// Entry point — orquesta la carga de todos los módulos.
//
// El orden importa: cada módulo deja sus globales en `window` y
// los siguientes los consumen vía alias locales (ver `script.js`).
//
// firebase-sync  →  window.AnsoSync
// paste-utils    →  window.setupPasteHandler, window.setupImageResizer
// notifications  →  window.AnsoNotif
// script         →  window.THEME_KEY, window.modalAlert, window.activateProject, …
// sections-and-profile  →  inicializa el menú de perfil
//
// El CSS NO se importa desde aquí — se carga vía <link> en index.html
// para evitar el FOUC (flash of unstyled content) en dev.

import "./firebase-sync.js";
import "./paste-utils.js";
import "./notifications.js";
import "./script.js";
import "./sections-and-profile.js";
