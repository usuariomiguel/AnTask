/**
 * AnsoSync — módulo de sincronización Firebase para Ansotask
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

(function () {
  "use strict";

  var firebaseConfig = {
    apiKey: "AIzaSyCEZw4jJ_FAHnmZXI66wr3VlPbFQZDVlSE",
    authDomain: "antask-7a86f.firebaseapp.com",
    projectId: "antask-7a86f",
    storageBucket: "antask-7a86f.firebasestorage.app",
    messagingSenderId: "643446618554",
    appId: "1:643446618554:web:03aa51901153a69921c583",
    // measurementId: "G-7ZD4J1KMSP"
  };

  // No hace nada si la config no ha sido rellenada
  if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    window.AnsoSync = null;
    return;
  }

  firebase.initializeApp(firebaseConfig);
  var auth = firebase.auth();
  var db = firebase.firestore();

  // Persistencia offline: Firestore cachea datos localmente
  db.enablePersistence({ synchronizeTabs: true }).catch(function () { });

  var _user = null;
  var _unsubscribe = null;
  var _onRemoteChange = null;
  var _onAuthChange = null;
  var _onFirstConnect = null;
  var _syncPaused = false;
  var _saveTimer = null;

  function docRef() {
    return db.collection("users").doc(_user.uid)
      .collection("workspace").doc("data");
  }

  function startListening() {
    if (_unsubscribe) _unsubscribe();
    var isFirst = true;
    _unsubscribe = docRef().onSnapshot(function (snap) {
      if (_syncPaused) return;

      if (isFirst) {
        isFirst = false;
        if (typeof _onFirstConnect === "function") {
          _onFirstConnect(snap.exists ? snap.data() : null);
        }
        return;
      }

      if (!snap.exists) return;
      var data = snap.data();
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

  window.AnsoSync = {
    isConfigured: true,

    /**
     * Inicializa auth y el listener en tiempo real.
     * @param {Function|null} onRemoteChange  llamado cuando otro dispositivo guarda
     * @param {Function|null} onAuthChange    llamado cuando el estado de auth cambia
     * @param {Function|null} onFirstConnect  llamado una vez al conectar; recibe los datos
     *                                        de la nube (o null si no hay datos)
     */
    init: function (onRemoteChange, onAuthChange, onFirstConnect) {
      _onRemoteChange = onRemoteChange;
      _onAuthChange = onAuthChange;
      _onFirstConnect = onFirstConnect;
      auth.onAuthStateChanged(function (user) {
        _user = user;
        if (user) {
          startListening();
        } else {
          stopListening();
        }
        if (typeof _onAuthChange === "function") _onAuthChange(user);
      });
    },

    signIn: function () {
      var provider = new firebase.auth.GoogleAuthProvider();
      return auth.signInWithPopup(provider);
    },

    signOut: function () {
      stopListening();
      _user = null;
      return auth.signOut();
    },

    getUser: function () { return _user; },

    /**
     * Guarda proyectos y secciones en la nube con un debounce de 2 s.
     * Pausa el listener para evitar el bucle de escritura→snapshot.
     */
    scheduleSave: function (projects, sections) {
      if (!_user) return;
      if (_saveTimer) clearTimeout(_saveTimer);
      _saveTimer = setTimeout(function () {
        _syncPaused = true;
        docRef().set({
          projects: projects,
          sections: sections || [],
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          version: 2
        }).then(function () {
          setTimeout(function () { _syncPaused = false; }, 1500);
        }).catch(function (err) {
          _syncPaused = false;
          console.warn("AnsoSync: error guardando en la nube:", err);
        });
      }, 2000);
    }
  };
})();
