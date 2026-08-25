/**
 * AnsoSync — módulo de sincronización Firebase (API modular v9+).
 *
 * Tree-shakeable: solo se incluye en el bundle final lo que importa.
 *
 * Para activar la sincronización entre dispositivos:
 *
 *  1. Ve a https://console.firebase.google.com y crea un proyecto.
 *  2. En el proyecto, añade una app web (icono </>) y copia la config.
 *  3. Activa Authentication → métodos de inicio de sesión → Google, y
 *     también "Enlace de email (sin contraseña)" y "Correo electrónico/
 *     contraseña" — alternativas a Google para la PWA instalada en iOS,
 *     donde Google bloquea el login dentro de un WebView embebido (ver
 *     signInWithEmailLinkTo() y signInWithPassword()/signUpWithPassword()
 *     más abajo).
 *  4. Activa Firestore Database → crear base de datos → modo producción.
 *  5. En Firestore → Reglas, sustituye el contenido por:
 *
 *       rules_version = '2';
 *       service cloud.firestore {
 *         match /databases/{database}/documents {
 *           match /users/{uid}/workspace/{doc} {
 *             allow read, write: if request.auth != null
 *                                && request.auth.uid == uid;
 *           }
 *         }
 *       }
 *
 *  6. Rellena los valores de firebaseConfig a continuación con los de tu app.
 */

import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { modalAlert, modalPrompt } from "./ui/modal.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { markSyncEnabled, clearSyncEnabled } from "./sync-loader.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCEZw4jJ_FAHnmZXI66wr3VlPbFQZDVlSE",
  authDomain:        "antask-7a86f.firebaseapp.com",
  projectId:         "antask-7a86f",
  storageBucket:     "antask-7a86f.firebasestorage.app",
  messagingSenderId: "643446618554",
  appId:             "1:643446618554:web:03aa51901153a69921c583",
};

// No hace nada si la config no ha sido rellenada
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  window.AnsoSync = null;
} else {
  let app, auth, db;
  try {
    app  = initializeApp(firebaseConfig);
    // IndexedDB en vez de la persistencia por defecto (localStorage):
    // en la PWA instalada en iOS ("añadir a pantalla de inicio"), el
    // viaje de ida y vuelta a accounts.google.com de signInWithRedirect
    // pierde a veces el estado guardado en localStorage —Safari lo
    // aísla de forma más agresiva ahí que en una pestaña normal—, así
    // que getRedirectResult() volvía sin usuario y sin error: el login
    // se completaba en Google pero, al volver, la app no tenía ni idea
    // de que había pasado nada. IndexedDB sobrevive a ese viaje con más
    // fiabilidad. Es la mitigación que recomienda la propia documentación
    // de Firebase para este caso — no hay garantía absoluta (es una
    // limitación de la plataforma, no solo de esta app), pero es la
    // que mejor resultado da.
    auth = initializeAuth(app, {
      persistence: indexedDBLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
    // Persistencia offline con soporte multi-tab. Si falla (ej. modo
    // incógnito sin IndexedDB), Firestore sigue funcionando en memoria.
    db   = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (err) {
    console.warn("AnsoSync: error inicializando Firebase:", err);
    window.AnsoSync = null;
  }

  if (app && auth && db) {
    let _user           = null;
    let _unsubscribe    = null;
    let _onRemoteChange = null;
    let _onAuthChange   = null;
    let _onFirstConnect = null;
    let _syncPaused     = false;
    let _saveTimer      = null;

    function docRef() {
      return doc(db, "users", _user.uid, "workspace", "data");
    }

    function startListening() {
      if (_unsubscribe) _unsubscribe();

      // La primera lectura se pide siempre al servidor, no a la caché offline
      // de Firestore: si este dispositivo ya tuvo esta cuenta abierta antes
      // (u otra sesión dejó algo en IndexedDB), el primer onSnapshot podría
      // devolver esa copia vieja antes de que llegue la del servidor, y ese
      // dato viejo se trataría como "el estado de la nube" al conectar.
      // Solo si no hay red caemos a la caché con getDoc.
      let firstConnectDone = false;
      getDocFromServer(docRef())
        .catch(function () { return getDoc(docRef()); })
        .then(function (snap) {
          firstConnectDone = true;
          if (typeof _onFirstConnect === "function") {
            _onFirstConnect(snap.exists() ? snap.data() : null);
          }
        })
        .catch(function (err) {
          firstConnectDone = true;
          console.warn("AnsoSync: error obteniendo datos iniciales:", err);
          if (typeof _onFirstConnect === "function") _onFirstConnect(null);
        });

      _unsubscribe = onSnapshot(docRef(), function (snap) {
        // Ignoramos snapshots mientras la primera lectura (arriba) no se
        // haya resuelto todavía, para no procesar el mismo dato dos veces
        // por dos caminos distintos.
        if (_syncPaused || !firstConnectDone) return;

        if (!snap.exists()) return;
        const data = snap.data();
        if (data && Array.isArray(data.projects) &&
            typeof _onRemoteChange === "function") {
          _onRemoteChange(data.projects, data.sections || [], data.updatedAt);
        }
      }, function (err) {
        console.warn("AnsoSync: error en listener:", err);
      });
    }

    function stopListening() {
      if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
    }

    // Con la app instalada (PWA standalone/en el móvil, sin barra del
    // navegador alrededor) `signInWithPopup` falla de forma intermitente:
    // el popup de Google no siempre puede avisar a la ventana que lo abrió
    // de que ha terminado (Cross-Origin-Opener-Policy entre ventanas de
    // distinto origen), y Firebase lo interpreta como que el usuario ha
    // cancelado el login (`auth/user-cancelled`) aunque haya completado el
    // proceso con normalidad. `signInWithRedirect` esquiva el problema del
    // todo: navega la propia ventana a Google y vuelve, sin segunda ventana.
    function _isStandalone() {
      return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
             window.navigator.standalone === true;
    }

    window.AnsoSync = {
      isConfigured: true,

      /**
       * Inicializa auth y el listener en tiempo real.
       * @param {Function|null} onRemoteChange  llamado cuando otro dispositivo guarda
       * @param {Function|null} onAuthChange    llamado cuando el estado de auth cambia
       * @param {Function|null} onFirstConnect  llamado una vez al conectar; recibe los
       *                                         datos de la nube (o null si no hay)
       */
      init: function (onRemoteChange, onAuthChange, onFirstConnect) {
        _onRemoteChange = onRemoteChange;
        _onAuthChange   = onAuthChange;
        _onFirstConnect = onFirstConnect;
        // ¿Veníamos de un signInWithRedirect? La marca la deja signIn()
        // justo antes de salir hacia Google, en sessionStorage (no
        // localStorage: solo debe importar el viaje de ida y vuelta
        // actual, no quedarse pegada para siempre). Se limpia aquí, se
        // haya completado el login o no.
        var vinoDeRedirect = false;
        try {
          vinoDeRedirect = sessionStorage.getItem("antask-redirect-pending") === "1";
          sessionStorage.removeItem("antask-redirect-pending");
        } catch (e) { /* sessionStorage bloqueado: sin aviso, no rompe nada */ }

        // ¿Es la vuelta de un enlace de email de inicio de sesión sin
        // contraseña? (ver signInWithEmailLinkTo() más abajo). Alternativa
        // a Google pensada para la PWA instalada en iOS: Google bloquea el
        // login dentro de un WebView embebido, pero este método no pasa
        // por la pantalla de consentimiento de Google en absoluto.
        if (isSignInWithEmailLink(auth, window.location.href)) {
          var savedEmail = null;
          try { savedEmail = localStorage.getItem("antask-email-for-signin"); } catch (e) {}
          Promise.resolve(savedEmail || modalPrompt(
            "¿Con qué email pediste el enlace?", "", "tu@email.com"
          )).then(function (email) {
            if (!email) return;
            return signInWithEmailLink(auth, email, window.location.href).then(function () {
              try { localStorage.removeItem("antask-email-for-signin"); } catch (e) {}
              // Limpia el enlace de la URL — si no, un refresco reintenta
              // el mismo oobCode ya consumido y falla.
              history.replaceState(null, "", window.location.pathname);
            });
          }).catch(function (err) {
            console.warn("AnsoSync: error completando el login por email:", err);
            var msg = err.code === "auth/invalid-action-code"
              ? "Este enlace ya no es válido — puede que ya lo hayas usado o haya caducado. Pide uno nuevo."
              : "Error al completar el inicio de sesión: " + (err.message || err.code);
            modalAlert(msg, "error");
          });
        }

        // Recoge el resultado si veníamos de un signInWithRedirect — sin
        // esto, un error del redirect (dominio no autorizado, etc.) se
        // perdía en silencio: onAuthStateChanged solo avisa de logins que
        // SÍ cuajan, nunca de por qué uno ha fallado. Antes solo se
        // registraba en consola: en la PWA instalada, quien vuelve de
        // Google tras un fallo no ve nada — "no me deja loguearme" sin
        // ninguna pista de por qué. Mismo mapeo de mensajes que el
        // catch de signIn() en sections-and-profile.js.
        getRedirectResult(auth).then(function (result) {
          // En iOS, la PWA instalada a veces pierde el estado del login
          // durante el viaje a Google y de vuelta (ver el comentario en
          // initializeAuth más arriba): ni error ni usuario, solo `null`,
          // aunque el login se completara en Google con normalidad. Sin
          // esta comprobación, quien vuelve de un redirect real se
          // queda mirando la app sin ningún indicio de qué ha pasado.
          if (!result && vinoDeRedirect) {
            modalAlert("No se ha podido completar el inicio de sesión al volver de Google. Es un problema conocido de las apps instaladas en iOS — inténtalo de nuevo; si persiste, prueba a iniciar sesión desde Safari en vez de la app instalada.", "error");
          }
        }).catch(function (err) {
          console.warn("AnsoSync: error en el resultado del redirect de login:", err);
          var msg = err.code === "auth/unauthorized-domain"
            ? "Este dominio no está autorizado en Firebase. Añádelo en Firebase Console → Authentication → Dominios autorizados."
            : err.code === "auth/user-cancelled" || err.code === "auth/cancelled-popup-request"
            ? null // el usuario canceló a propósito, sin aviso
            : "Error al iniciar sesión: " + (err.message || err.code);
          if (msg) modalAlert(msg, "error");
        });
        onAuthStateChanged(auth, function (user) {
          _user = user;
          // La marca decide si en el próximo arranque Firebase se carga
          // de entrada o se espera al botón. Se lleva aquí porque es el
          // único punto por el que pasan tanto el login como el logout.
          if (user) markSyncEnabled();
          else      clearSyncEnabled();
          if (user) startListening();
          else      stopListening();
          if (typeof _onAuthChange === "function") _onAuthChange(user);
        });
      },

      signIn: function () {
        const provider = new GoogleAuthProvider();
        if (_isStandalone()) {
          // signInWithRedirect saca de la app entera y vuelve como una
          // carga de página nueva — main.js decide si carga Firebase de
          // entrada mirando hasSyncHistory(), que en un dispositivo recién
          // limpiado no tiene ninguna señal todavía (la marca normal solo
          // se pone DESPUÉS de un login que ya ha tenido éxito). Sin este
          // aviso previo, la vuelta del redirect aterrizaba en una carga
          // que nunca llegaba a cargar Firebase, así que nadie procesaba
          // el resultado: el login se completaba en Google pero la app no
          // se enteraba nunca. Se marca ANTES de salir; si el login se
          // cancela, onAuthStateChanged(null) la retira sola al volver.
          markSyncEnabled();
          // Marca aparte (sessionStorage, no localStorage) para detectar
          // el caso "resultado nulo silencioso" en init(): si getRedirectResult()
          // vuelve sin usuario y sin error pero esta marca sigue puesta, es que
          // el redirect se completó en Google y la app perdió el estado al volver.
          try { sessionStorage.setItem("antask-redirect-pending", "1"); } catch (e) {}
          return signInWithRedirect(auth, provider);
        }
        return signInWithPopup(auth, provider);
      },

      /**
       * Alternativa a signIn() con Google: envía un enlace de un solo uso
       * al email indicado. Pensada para la PWA instalada en iOS, donde
       * Google bloquea el login dentro de un WebView embebido — este
       * método no pasa por la pantalla de consentimiento de Google.
       *
       * El enlace hay que abrirlo en el mismo dispositivo/app desde el
       * que se pidió para que complete el login ahí (ver el bloque
       * isSignInWithEmailLink() en init()); en otro contexto, se pide el
       * email otra vez y el login se completa allí en su lugar.
       * @param {string} email
       */
      signInWithEmailLinkTo: function (email) {
        var actionCodeSettings = {
          url: window.location.origin + window.location.pathname,
          handleCodeInApp: true,
        };
        return sendSignInLinkToEmail(auth, email, actionCodeSettings).then(function () {
          try { localStorage.setItem("antask-email-for-signin", email); } catch (e) {}
        });
      },

      /**
       * Otra alternativa a Google, pensada para lo mismo (la PWA instalada
       * en iOS): email + contraseña no pasa por ningún dominio externo, así
       * que no lo bloquea la política de Google contra WebViews embebidos.
       * @param {string} email
       * @param {string} password
       */
      signInWithPassword: function (email, password) {
        return signInWithEmailAndPassword(auth, email, password);
      },

      /** @param {string} email @param {string} password */
      signUpWithPassword: function (email, password) {
        return createUserWithEmailAndPassword(auth, email, password);
      },

      signOut: function () {
        stopListening();
        _user = null;
        return fbSignOut(auth);
      },

      getUser: function () { return _user; },

      /**
       * Guarda proyectos y secciones en la nube con un debounce de 2 s.
       * Pausa el listener para evitar el bucle escritura → snapshot.
       */
      scheduleSave: function (projects, sections) {
        if (!_user) return;
        if (_saveTimer) clearTimeout(_saveTimer);
        _saveTimer = setTimeout(function () {
          _syncPaused = true;
          setDoc(docRef(), {
            projects:        projects,
            sections:        sections || [],
            updatedAt:       serverTimestamp(),
            version:         2,
          }, {
            // Sin `merge` este setDoc REEMPLAZA el documento entero, así que
            // un cliente que no conozca algún campo lo borra de la nube al
            // guardar — y con la PWA instalada es normal que un dispositivo
            // vaya por detrás varias versiones durante días. Con merge, los
            // campos que este cliente no envía se quedan como estaban.
            //
            // No cambia nada para `projects`/`sections`: siempre se envían,
            // y los arrays se reemplazan enteros con merge o sin él. Solo
            // protege lo que este cliente todavía no sabe escribir.
            merge: true,
          }).then(function () {
            setTimeout(function () { _syncPaused = false; }, 1500);
          }).catch(function (err) {
            _syncPaused = false;
            console.warn("AnsoSync: error guardando en la nube:", err);
          });
        }, 2000);
      },
    };

    // Auto-init: script.js registra los callbacks en window._ansoSyncCallbacks
    // antes de que este módulo cargue. Los recogemos aquí para que el botón
    // "Sincronizar con Google" aparezca sin necesidad de un reload.
    var cbs = window._ansoSyncCallbacks;
    if (cbs) {
      window.AnsoSync.init(cbs.onRemoteChange, cbs.onAuthChange, cbs.onFirstConnect);
    }
  }
}
