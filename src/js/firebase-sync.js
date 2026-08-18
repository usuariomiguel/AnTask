/**
 * AnsoSync — módulo de sincronización Firebase (API modular v9+).
 *
 * Tree-shakeable: solo se incluye en el bundle final lo que importa.
 *
 * Para activar la sincronización entre dispositivos:
 *
 *  1. Ve a https://console.firebase.google.com y crea un proyecto.
 *  2. En el proyecto, añade una app web (icono </>) y copia la config.
 *  3. Activa Authentication → métodos de inicio de sesión → Google.
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
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
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
    auth = getAuth(app);
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
        // Recoge el resultado si veníamos de un signInWithRedirect — sin
        // esto, un error del redirect (dominio no autorizado, etc.) se
        // perdía en silencio: onAuthStateChanged solo avisa de logins que
        // SÍ cuajan, nunca de por qué uno ha fallado.
        getRedirectResult(auth).catch(function (err) {
          console.warn("AnsoSync: error en el resultado del redirect de login:", err);
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
        if (_isStandalone()) return signInWithRedirect(auth, provider);
        return signInWithPopup(auth, provider);
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
