// @ts-check
// ═══════════════════════════════════════════════════════════════
// SIEMBRA DE EJEMPLO (primera ejecución)
//
// Quien abría AnTrack por primera vez se encontraba el Inbox vacío y la
// vista Hoy sin nada: ni una fila que tocar para entender de qué va
// esto. Aquí se dejan unas tareas y unos hábitos de muestra elegidos
// para que se vea lo que hace la app —una con subtareas, una marcada
// como importante, un hábito que no es diario— y para borrarse de un
// tirón: la última tarea lo dice.
//
// Solo se siembra en un perfil de verdad nuevo: sin tareas, sin hábitos
// y sin haber visto nunca el onboarding. Esa última condición es también
// la que mantiene los tests e2e fuera de aquí, porque todos marcan
// `antrack-onboarded` antes de cargar la app.
//
// Los ids sembrados se apuntan aparte (SEMILLA_KEY), y no es cosmético:
// `_tieneContenido()` decide si este dispositivo tiene algo que perder al
// iniciar sesión, y unas tareas de muestra NO lo son. Sin esa lista,
// estrenar la app y entrar en una cuenta que ya tiene datos sacaba el
// modal de conflicto de sincronización para preguntar si conservar
// cuatro ejemplos.
// ═══════════════════════════════════════════════════════════════

import { t } from "../i18n/index.js";
import { ONBOARDED_KEY, SEMILLA_KEY } from "./keys.js";
import { sanitizeTasks, sanitizeHabits } from "./sanitize.js";

/** Fecha de hoy en local, no en UTC: a medianoche en España `toISOString()`
 *  todavía devuelve el día anterior y las tareas nacerían vencidas. */
function hoyLocal() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
    "-" + String(d.getDate()).padStart(2, "0");
}

function leerRegistro() {
  try {
    const raw = localStorage.getItem(SEMILLA_KEY);
    if (!raw) return null;
    const reg = JSON.parse(raw);
    if (!reg || typeof reg !== "object") return null;
    return {
      tareas: Array.isArray(reg.tareas) ? reg.tareas : [],
      habitos: Array.isArray(reg.habitos) ? reg.habitos : [],
    };
  } catch (_) {
    return null;
  }
}

function hayTareas(projects) {
  return Array.isArray(projects) && projects.some(function(p) {
    return p && Array.isArray(p.tasks) && p.tasks.length > 0;
  });
}

/**
 * ¿Es este un perfil recién estrenado, sin nada de nadie?
 *
 * @param {any[]} projects
 * @param {any[]} habits
 * @returns {boolean}
 */
export function hayQueSembrar(projects, habits) {
  try {
    if (localStorage.getItem(ONBOARDED_KEY)) return false;
    if (localStorage.getItem(SEMILLA_KEY)) return false;
  } catch (_) {
    // Sin localStorage no hay forma de recordar que ya se sembró, y
    // sembrar en cada carga sería peor que no hacerlo.
    return false;
  }
  if (Array.isArray(habits) && habits.length > 0) return false;
  return !hayTareas(projects);
}

/**
 * Las tareas y los hábitos de muestra, ya saneados.
 *
 * Pasan por `sanitizeTasks`/`sanitizeHabits` a propósito, y no se
 * escriben a mano con todos sus campos: así la muestra no se queda atrás
 * cuando el modelo gane uno nuevo.
 *
 * @returns {{ tareas: any[], habitos: any[] }}
 */
export function construirSemilla() {
  const hoy = hoyLocal();
  const tareas = sanitizeTasks([
    // Con fecha de hoy, para que la vista Hoy tampoco arranque vacía.
    { text: t("seed.task_captura"), dueDate: hoy, priority: "high" },
    { text: t("seed.task_sintaxis"), dueDate: hoy },
    {
      text: t("seed.task_listas"),
      subtasks: [{ text: t("seed.sub_crear") }, { text: t("seed.sub_mover") }],
    },
    // La última dice en voz alta que esto es de mentira y se puede tirar.
    { text: t("seed.task_borrar") },
  ]);
  const habitos = sanitizeHabits([
    { name: t("seed.habit_agua"), schedule: "daily" },
    { name: t("seed.habit_leer"), schedule: "daily" },
    { name: t("seed.habit_andar"), schedule: "everyN", everyNDays: 2 },
  ]);
  return { tareas: tareas, habitos: habitos };
}

/**
 * Mete la muestra en el Inbox y en los hábitos, y apunta sus ids.
 *
 * Al Inbox y no a una lista nueva: el bloque de onboarding de script.js
 * considera "usuario con contenido" —y se salta el tour— a quien tenga
 * tareas en una lista que no sea el Inbox.
 *
 * Muta los arrays que recibe, como el resto del estado de la app; el
 * caller guarda.
 *
 * @param {any[]} projects
 * @param {any[]} habits
 * @param {string} inboxId
 * @returns {boolean} si se sembró
 */
export function sembrar(projects, habits, inboxId) {
  const inbox = (projects || []).find(function(p) { return p && p.id === inboxId; });
  if (!inbox || !Array.isArray(habits)) return false;

  const semilla = construirSemilla();
  if (!Array.isArray(inbox.tasks)) inbox.tasks = [];
  inbox.tasks.push.apply(inbox.tasks, semilla.tareas);
  habits.push.apply(habits, semilla.habitos);

  try {
    localStorage.setItem(SEMILLA_KEY, JSON.stringify({
      tareas: semilla.tareas.map(function(tk) { return tk.id; }),
      habitos: semilla.habitos.map(function(h) { return h.id; }),
    }));
  } catch (_) { /* si no se puede apuntar, al menos la muestra ya está */ }

  return true;
}

/**
 * ¿Todo lo que hay en este dispositivo es la muestra sin tocar?
 *
 * Lo usa la sincronización: una muestra no es "datos anónimos" que haya
 * que defender de la nube. Basta con que aparezca UNA tarea o UN hábito
 * que no sean de la siembra para que esto sea `false` y el conflicto se
 * trate como siempre.
 *
 * @param {any[]} projects
 * @param {any[]} habits
 * @returns {boolean}
 */
export function soloHayMuestra(projects, habits) {
  const reg = leerRegistro();
  if (!reg) return false;

  let algo = false;
  const listas = Array.isArray(projects) ? projects : [];
  for (let i = 0; i < listas.length; i++) {
    const tareas = (listas[i] && listas[i].tasks) || [];
    for (let j = 0; j < tareas.length; j++) {
      algo = true;
      if (reg.tareas.indexOf(tareas[j].id) === -1) return false;
    }
  }
  const habitosLocales = Array.isArray(habits) ? habits : [];
  for (let k = 0; k < habitosLocales.length; k++) {
    algo = true;
    if (reg.habitos.indexOf(habitosLocales[k].id) === -1) return false;
  }
  return algo;
}
