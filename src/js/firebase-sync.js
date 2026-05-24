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
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

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
      let isFirst = true;
      _unsubscribe = onSnapshot(docRef(), function (snap) {
        if (_syncPaused) return;

        if (isFirst) {
          isFirst = false;
          if (typeof _onFirstConnect === "function") {
            _onFirstConnect(snap.exists() ? snap.data() : null);
          }
          return;
        }

        if (!snap.exists()) return;
        const data = snap.data();
        if (data && Array.isArray(data.projects) &&
            typeof _onRemoteChange === "function") {
          _onRemoteChange(data.projects, data.sections || [], data.standaloneNotes || [], data.updatedAt);
        }
      }, function (err) {
        console.warn("AnsoSync: error en listener:", err);
      });
    }

    function stopListening() {
      if (_unsubscribe) { _unsubscribe(); _unsubscribe = null; }
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
        onAuthStateChanged(auth, function (user) {
          _user = user;
          if (user) startListening();
          else      stopListening();
          if (typeof _onAuthChange === "function") _onAuthChange(user);
        });
      },

      signIn: function () {
        const provider = new GoogleAuthProvider();
        return signInWithPopup(auth, provider);
      },

      signOut: function () {
        stopListening();
        _user = null;
        return fbSignOut(auth);
      },

      getUser: function () { return _user; },

      /**
       * Guarda proyectos / secciones / notas standalone en la nube
       * con un debounce de 2 s. Pausa el listener para evitar el
       * bucle escritura → snapshot.
       */
      scheduleSave: function (projects, sections, standaloneNotes) {
        if (!_user) return;
        if (_saveTimer) clearTimeout(_saveTimer);
        _saveTimer = setTimeout(function () {
          _syncPaused = true;
          setDoc(docRef(), {
            projects:        projects,
            sections:        sections || [],
            standaloneNotes: standaloneNotes || [],
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
