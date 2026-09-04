// ═══════════════════════════════════════════════════════════════
// Visor de historial de hábitos — mapa de calor + resumen por hábito.
//
// Dos lecturas distintas, a propósito:
//
//  · El mapa de arriba es AGREGADO: una celda por día, con intensidad
//    según qué proporción de lo que tocaba ese día se cumplió. Es la
//    vista de "cómo voy en general".
//  · Debajo, cada hábito por separado con su racha y su porcentaje. Es
//    la vista de "cuál se me está escapando".
//
// El mapa agregado no distingue QUÉ hábito falló y la lista no dice
// CUÁNDO: se complementan, y por eso están las dos.
// ═══════════════════════════════════════════════════════════════

import { t, getLang } from "../i18n/index.js";
import { createModalBase, closeModal } from "../ui/modal.js";
import { escHtml } from "../utils/html.js";
import {
  heatSeries,
  computeStreak,
  statsBetween,
  addDays,
  startDate,
  weekdayIndex,
  weekStart,
  isDueOn,
  isDoneOn,
} from "./model.js";

/** Techo de semanas del mapa. Móvil cabe menos, y estrujarlas las haría ilegibles. */
const SEMANAS_ESCRITORIO = 26;
const SEMANAS_MOVIL      = 13;

/* Días de la tira de cada hábito. Es MUCHO más corta que el mapa a
   propósito: repartir 26 semanas en el ancho del modal deja celdas de
   2px, que no son un dato sino una mancha. El mapa de arriba ya cuenta
   el tramo largo; la tira responde a "¿cómo voy últimamente?". */
const DIAS_TIRA_ESCRITORIO = 30;
const DIAS_TIRA_MOVIL      = 21;

const CELDA = 12;
const HUECO = 3;
const PASO  = CELDA + HUECO;

function esMovil() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function locale() {
  return getLang() === "en" ? "en-GB" : "es-ES";
}

/** "5 sept" — para los títulos accesibles de cada celda. */
function fechaLegible(dateISO) {
  return new Date(dateISO + "T00:00:00").toLocaleDateString(locale(), {
    day: "numeric", month: "short", year: "numeric",
  });
}

/**
 * El mapa agregado, en SVG.
 *
 * Columnas = semanas, filas = día de la semana (lunes arriba), como los
 * calendarios de contribuciones. Se dibuja en SVG y no con divs porque
 * son ~180 celdas y aquí cada una es un solo `<rect>`.
 *
 * Accesibilidad: el conjunto es UNA imagen con su resumen en
 * `aria-label`, no 180 elementos enfocables. El detalle de cada día vive
 * en el `<title>` de su celda, que los lectores anuncian al entrar y que
 * además sale como tooltip nativo al pasar el ratón.
 */
function mapaSVG(habits, todayISO, semanas) {
  // El mapa no arranca antes del hábito más viejo: pintar semanas de
  // cuando no existía ninguno llenaba medio recuadro de celdas vacías que
  // no dicen nada. Con pocos días de historial el mapa sale corto, que es
  // la verdad, y se va llenando solo.
  const tope = weekStart(addDays(todayISO, -((semanas - 1) * 7)));
  let masViejo = todayISO;
  habits.forEach(function (h) {
    const ini = startDate(h);
    if (ini < masViejo) masViejo = ini;
  });
  const desde = weekStart(masViejo) > tope ? weekStart(masViejo) : tope;
  const semanasReales = Math.round(
    (new Date(todayISO + "T00:00:00Z") - new Date(desde + "T00:00:00Z")) / 604800000
  ) + 1;
  const serie = heatSeries(habits, desde, todayISO);

  const ancho = semanasReales * PASO - HUECO;
  const alto  = 7 * PASO - HUECO;

  let celdas = "";
  let cumplidos = 0;
  let conPendientes = 0;

  serie.forEach(function (d) {
    const col = Math.floor((new Date(d.date + "T00:00:00Z") - new Date(desde + "T00:00:00Z")) / 604800000);
    const fila = weekdayIndex(d.date);
    const x = col * PASO;
    const y = fila * PASO;

    if (d.due > 0) {
      conPendientes++;
      if (d.done === d.due) cumplidos++;
    }

    const titulo = d.due === 0
      ? fechaLegible(d.date) + " — " + t("hist.nothing_due")
      : fechaLegible(d.date) + " — " + d.done + "/" + d.due;

    celdas +=
      '<rect class="hm-cell hm-cell--' + d.level + '" x="' + x + '" y="' + y + '"' +
      ' width="' + CELDA + '" height="' + CELDA + '" rx="2">' +
      "<title>" + escHtml(titulo) + "</title></rect>";
  });

  const resumen = t("hist.summary")
    .replace("{done}", String(cumplidos))
    .replace("{total}", String(conPendientes));

  return {
    html:
      '<div class="hm-scroll">' +
        '<svg class="hm-grid" width="' + ancho + '" height="' + alto + '"' +
        ' viewBox="0 0 ' + ancho + " " + alto + '" role="img"' +
        ' aria-label="' + escHtml(resumen) + '">' + celdas + "</svg>" +
      "</div>",
    resumen: resumen,
  };
}

/** Leyenda de intensidad, de menos a más. */
function leyendaHTML() {
  let cuadros = "";
  [0, 1, 2, 3, 4].forEach(function (n) {
    cuadros += '<span class="hm-key-cell hm-cell--' + n + '"></span>';
  });
  return (
    '<div class="hm-key" aria-hidden="true">' +
      '<span class="hm-key-label">' + escHtml(t("hist.less")) + "</span>" +
      cuadros +
      '<span class="hm-key-label">' + escHtml(t("hist.more")) + "</span>" +
    "</div>"
  );
}

/** Tira compacta de un hábito: sus últimos N días, uno por celda. */
function tiraHabito(habit, todayISO, dias) {
  let celdas = "";
  for (let i = dias - 1; i >= 0; i--) {
    const d = addDays(todayISO, -i);
    let clase = "hs-cell--none";
    if (isDueOn(habit, d)) clase = isDoneOn(habit, d) ? "hs-cell--done" : "hs-cell--miss";
    celdas += '<span class="hs-cell ' + clase + '"></span>';
  }
  return '<span class="hs-strip" aria-hidden="true">' + celdas + "</span>";
}

/** Bloque por hábito: nombre, racha, % cumplido y su tira de días. */
function listaHabitos(habits, todayISO, dias) {
  if (habits.length === 0) {
    return '<p class="hist-empty">' + escHtml(t("hist.empty")) + "</p>";
  }

  const desde = addDays(todayISO, -(dias - 1));
  let filas = "";

  habits.forEach(function (h) {
    const racha = computeStreak(h, todayISO);
    const st = statsBetween(h, desde, todayISO);
    const pct = st.due ? Math.round((st.done / st.due) * 100) : 0;

    filas +=
      '<li class="hist-row">' +
        '<span class="hist-row-top">' +
          '<span class="hist-name">' + escHtml(h.name) + "</span>" +
          '<span class="hist-stats">' +
            '<span class="hist-streak" title="' + escHtml(t("hist.streak")) + '">' +
              "🔥 " + racha +
            "</span>" +
            '<span class="hist-pct">' + pct + "%</span>" +
          "</span>" +
        "</span>" +
        tiraHabito(h, todayISO, dias) +
        '<span class="hist-row-sr">' +
          escHtml(
            t("hist.row_sr")
              .replace("{name}", h.name)
              .replace("{streak}", String(racha))
              .replace("{done}", String(st.done))
              .replace("{due}", String(st.due))
          ) +
        "</span>" +
      "</li>";
  });

  return (
    '<p class="hist-caption">' +
      escHtml(t("hist.recent").replace("{n}", String(dias))) +
    "</p>" +
    '<ul class="hist-list">' + filas + "</ul>"
  );
}

/**
 * Abre el visor. `habits` son los hábitos ya saneados del estado.
 *
 * @param {Array<any>} habits
 * @param {string} todayISO
 */
export function openHabitsHistory(habits, todayISO) {
  const vivos = (habits || []).filter(function (h) { return !h.archived; });
  const movil = esMovil();
  const semanas = movil ? SEMANAS_MOVIL : SEMANAS_ESCRITORIO;
  const diasTira = movil ? DIAS_TIRA_MOVIL : DIAS_TIRA_ESCRITORIO;

  const { overlay, box } = createModalBase();
  const mapa = mapaSVG(vivos, todayISO, semanas);

  box.classList.add("hist-modal");
  box.innerHTML =
    '<p class="modal-label">' + escHtml(t("hist.title")) + "</p>" +
    '<p class="hist-sub">' + escHtml(mapa.resumen) + "</p>" +
    mapa.html +
    leyendaHTML() +
    listaHabitos(vivos, todayISO, diasTira) +
    '<div class="modal-actions">' +
      '<button type="button" class="modal-btn modal-btn-cancel" id="hist-close">' +
        escHtml(t("modal.close")) +
      "</button>" +
    "</div>";

  box.querySelector("#hist-close").addEventListener("click", function () {
    closeModal(overlay);
  });
}
