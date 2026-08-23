// @ts-check
// ═══════════════════════════════════════════════════════════════
// Carga de Firebase bajo demanda.
//
// El bundle de Firebase son ~405 KB, con diferencia el activo más
// pesado de la app. Antes se importaba en diferido pero sin condición
// alguna, así que se lo descargaba TODO el mundo —también quien nunca
// va a iniciar sesión—, cuando sincronizar es opcional en una app que
// funciona entera en local.
//
// Ahora solo se carga de entrada si hay rastro de que esta persona ya
// sincroniza. Si no, espera a que pulse "Sincronizar con Google".
// ═══════════════════════════════════════════════════════════════

import { PROJECTS_KEY } from "./state/keys.js";

const SYNC_FLAG = "antask-sync-enabled";

/**
 * ¿Hay indicios de que este dispositivo ya tiene sincronización?
 *
 * Se miran tres señales en orden decreciente de fiabilidad. Con que
 * una acierte basta: equivocarse por exceso solo cuesta una descarga,
 * mientras que un falso negativo dejaría a alguien con sesión abierta
 * viendo la app como si fuera local hasta que pulsara el botón.
 *
 * @returns {boolean}
 */
export function hasSyncHistory() {
  try {
    // 0. Venimos de pulsar el enlace de un email de inicio de sesión sin
    //    contraseña (ver signInWithEmailLinkTo() en firebase-sync.js): en
    //    un dispositivo/contexto sin ningún rastro previo de sync, sin
    //    esto nadie cargaría Firebase para procesar el enlace.
    if (location.search.indexOf("mode=signIn") !== -1 && location.search.indexOf("oobCode=") !== -1) {
      return true;
    }
    // 1. La marca que ponemos nosotros al autenticar.
    if (localStorage.getItem(SYNC_FLAG) === "1") return true;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || "";
      // 2. Caché por cuenta que escribe la propia app ("anso-projects-<uid>").
      //    Cubre a quien ya sincronizaba antes de que existiera la marca.
      //
      //    Consecuencia asumida: cerrar sesión NO borra esa caché —es
      //    deliberado, los datos de la cuenta se conservan para el
      //    siguiente login—, así que quien se desconecte seguirá
      //    descargando Firebase al arrancar. Se prefiere eso a que
      //    alguien con su sesión abierta entre y vea la app en modo
      //    local hasta pulsar el botón.
      if (key.startsWith(PROJECTS_KEY + "-")) return true;
      // 3. La sesión que persiste Firebase Auth por su cuenta.
      if (key.startsWith("firebase:authUser:")) return true;
    }
  } catch (e) {
    // localStorage puede lanzar en modo restringido: ante la duda, cargar.
    return true;
  }
  return false;
}

/** Deja constancia de que este dispositivo sincroniza. */
export function markSyncEnabled() {
  try { localStorage.setItem(SYNC_FLAG, "1"); } catch (e) { /* cuota llena */ }
}

/** Retira la marca al cerrar sesión, para no volver a cargar de balde. */
export function clearSyncEnabled() {
  try { localStorage.removeItem(SYNC_FLAG); } catch (e) { /* nada que hacer */ }
}

/** @type {Promise<void>|null} */
let _loading = null;

/**
 * Importa firebase-sync.js una sola vez. Llamarlo de más es gratis:
 * devuelve siempre la misma promesa.
 *
 * Al resolverse, `window.AnsoSync` ya está publicado (o es null si la
 * config de Firebase no se ha rellenado).
 *
 * @returns {Promise<void>}
 */
export function loadSync() {
  if (!_loading) {
    _loading = import("./firebase-sync.js").then(function () { /* publica window.AnsoSync */ });
  }
  return _loading;
}
