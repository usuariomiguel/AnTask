// ═══════════════════════════════════════════════════════════════
// Visor de historial de hábitos.
//
// Tres bloques, de lo simple a lo detallado:
//
//  1. Resumen del periodo — cuatro tarjetas: cumplimiento (el dato que
//     manda, con su barra), completados, días perfectos y mejor racha.
//     El cumplimiento va primero y no los días perfectos: con varios
//     hábitos, cumplir todos menos uno cada día daba cero días perfectos,
//     y eso presidiendo el panel castiga sin informar.
//  2. Mapa de calor, estilo calendario de contribuciones, de hasta un
//     año. La intensidad de cada día es la proporción de lo que tocaba
//     que se cumplió, no un hecho/no hecho.
//  3. Una tarjeta por hábito: racha, porcentaje y su tira de días
//     recientes en verde/rojo.
//
// El filtro de periodo (7 / 30 / 90 / todo) va arriba y manda sobre 1 y
// sobre el porcentaje de 3. El mapa no lo sigue: es la vista panorámica,
// y recortarlo a una semana lo dejaría sin la forma que lo hace útil. Sí
// empieza en el hábito más viejo (con un mínimo de semanas): meses en
// blanco de antes de que existiera nada no cuentan nada. La racha
// tampoco sigue al filtro: es un dato del hábito, no del periodo.
// ═══════════════════════════════════════════════════════════════

import { t, getLang } from "../i18n/index.js";
import { createModalBase, closeModal } from "../ui/modal.js";
import { escHtml } from "../utils/html.js";
import {
  heatSeries,
  perfectDays,
  computeStreak,
  statsBetween,
  addDays,
  startDate,
  isDueOn,
  isDoneOn,
  weekdayIndex,
  weekStart,
} from "./model.js";
import { visibles, agruparPorDia } from "../activity/model.js";
import { lineaTiempoHTML } from "../activity/render.js";

/** Semanas del mapa: hasta un año redondo, como el calendario de GitHub,
 *  y al menos unas 4 meses para que tenga forma aunque todo sea nuevo. */
const SEMANAS_MAPA = 53;
const SEMANAS_MAPA_MIN = 18;

/* Días de la tira de cada hábito. Es MUCHO más corta que el mapa a
   propósito: repartir un año en el ancho del modal deja celdas de 2px,
   que no son un dato sino una mancha. El mapa de arriba ya cuenta el
   tramo largo; la tira responde a "¿cómo voy últimamente?". */
const DIAS_TIRA_ESCRITORIO = 30;
const DIAS_TIRA_MOVIL      = 21;

function esMovil() {
  return window.matchMedia("(max-width: 768px)").matches;
}

const CELDA = 11;
const HUECO = 3;
const PASO  = CELDA + HUECO;
/** Alto de la banda de meses que corona el mapa. */
const ALTO_MESES = 15;

/** Periodos del filtro. `null` = desde que empezó el hábito más viejo. */
const PERIODOS = [
  { id: "7",    dias: 7 },
  { id: "30",   dias: 30 },
  { id: "90",   dias: 90 },
  { id: "todo", dias: null },
];

/* El periodo elegido se recuerda mientras dure la sesión: quien mira
   "90 días" suele querer seguir mirándolo al volver a abrir. */
let _periodo = "30";
/** Pestaña del visor: «resumen» (hábitos) o «actividad» (registro). */
let _pestana = "resumen";

/** Conmutador Resumen | Actividad, con el mismo segmentado que el periodo. */
function pestanasHTML() {
  const b = (id, clave) => {
    const on = _pestana === id;
    return '<button type="button" class="hist-range-btn' + (on ? " hist-range-btn--on" : "") + '"' +
      ' data-pestana="' + id + '" aria-pressed="' + on + '">' + escHtml(t(clave)) + "</button>";
  };
  return '<div class="hist-range hist-pestanas" role="group">' + b("resumen", "hist.tab_summary") + b("actividad", "hist.tab_activity") + "</div>";
}

function locale() {
  return getLang() === "en" ? "en-GB" : "es-ES";
}

/** "5 sept 2026" — para el título accesible de cada celda. */
function fechaLegible(dateISO) {
  return new Date(dateISO + "T00:00:00").toLocaleDateString(locale(), {
    day: "numeric", month: "short", year: "numeric",
  });
}

/**
 * Primer día del periodo elegido.
 *
 * @param {Array<any>} habits
 * @param {string} todayISO
 * @returns {string}
 */
function desdeDelPeriodo(habits, todayISO) {
  const p = PERIODOS.filter(function (x) { return x.id === _periodo; })[0] || PERIODOS[0];
  if (p.dias) return addDays(todayISO, -(p.dias - 1));
  // "Todo" arranca en el hábito más viejo: empezar antes solo añadiría
  // días en los que no existía nada que cumplir.
  let masViejo = todayISO;
  habits.forEach(function (h) {
    const ini = startDate(h);
    if (ini < masViejo) masViejo = ini;
  });
  return masViejo;
}

/** Bloque 1: cuatro tarjetas con los datos del periodo. */
function resumenHTML(habits, todayISO) {
  const desde = desdeDelPeriodo(habits, todayISO);
  let done = 0;
  let due  = 0;
  heatSeries(habits, desde, todayISO).forEach(function (d) {
    done += d.done;
    due  += d.due;
  });

  const pct = due ? Math.round((done / due) * 100) : 0;
  const perfectos = perfectDays(habits, desde, todayISO);
  let mejor = 0;
  habits.forEach(function (h) { mejor = Math.max(mejor, computeStreak(h, todayISO)); });

  const tarjeta = function (clase, valor, etiqueta, extra) {
    return '<div class="hist-tile' + (clase ? " " + clase : "") + '">' +
      '<span class="hist-tile-valor">' + valor + "</span>" +
      '<span class="hist-tile-etq">' + escHtml(etiqueta) + "</span>" +
      (extra || "") +
    "</div>";
  };
  // La frase entera, para el lector de pantalla: las tarjetas sueltas
  // («72 %», «Cumplimiento») se leerían sin hilo.
  const frase = t("hist.summary").replace("{done}", String(done)).replace("{total}", String(due)) +
    ". " + t("hist.pct").replace("{n}", String(pct)) + ". " +
    (perfectos === 1 ? t("hist.perfect_one") : t("hist.perfect").replace("{n}", String(perfectos))) + ".";

  return (
    '<div class="hist-tiles" role="group" aria-label="' + escHtml(frase) + '">' +
      tarjeta("hist-tile--pct", pct + "%", t("hist.tile_pct"),
        '<span class="hist-tile-barra" aria-hidden="true"><span style="width:' + pct + '%"></span></span>') +
      tarjeta("", done + '<small>/' + due + "</small>", t("hist.tile_done")) +
      tarjeta("", String(perfectos), t("hist.tile_perfect")) +
      tarjeta("hist-tile--racha", '<i data-lucide="flame" class="hist-flame"></i>' + mejor, t("hist.tile_best")) +
    "</div>"
  );
}

/** El selector de periodo. */
function filtroHTML() {
  let btns = "";
  PERIODOS.forEach(function (p) {
    const activo = p.id === _periodo;
    btns +=
      '<button type="button" class="hist-range-btn' + (activo ? " hist-range-btn--on" : "") + '"' +
      ' data-rango="' + p.id + '" aria-pressed="' + activo + '">' +
        escHtml(t("hist.range_" + p.id)) +
      "</button>";
  });
  return '<div class="hist-range" role="group" aria-label="' +
    escHtml(t("hist.range_label")) + '">' + btns + "</div>";
}

/**
 * Bloque 2: el mapa del último año.
 *
 * Va en SVG y no en divs porque son ~370 celdas y aquí cada una es un
 * solo `<rect>`. El conjunto es UNA imagen con su resumen en
 * `aria-label`; el detalle de cada día vive en el `<title>` de su celda,
 * que los lectores anuncian al entrar y que sale como tooltip al pasar
 * el ratón. 370 elementos enfocables serían una trampa para el teclado.
 */
function mapaHTML(habits, todayISO) {
  // Desde la semana del hábito más viejo, entre el mínimo y un año.
  let masViejo = todayISO;
  habits.forEach(function (h) { const ini = startDate(h); if (ini < masViejo) masViejo = ini; });
  const diasDesde = Math.round((new Date(todayISO + "T00:00:00Z").getTime() - new Date(masViejo + "T00:00:00Z").getTime()) / 864e5);
  const semanas = Math.min(SEMANAS_MAPA, Math.max(SEMANAS_MAPA_MIN, Math.ceil(diasDesde / 7) + 1));
  // Se alinea a lunes para que cada columna sea una semana entera.
  const desde = weekStart(addDays(todayISO, -((semanas - 1) * 7)));
  const serie = heatSeries(habits, desde, todayISO);
  const base  = new Date(desde + "T00:00:00Z").getTime();

  const ancho = semanas * PASO - HUECO;
  const alto  = 7 * PASO - HUECO;

  let celdas = "";
  let hechos = 0;
  let conAlgo = 0;

  serie.forEach(function (d) {
    const col = Math.floor((new Date(d.date + "T00:00:00Z").getTime() - base) / 604800000);
    const x = col * PASO;
    const y = weekdayIndex(d.date) * PASO;

    if (d.due > 0) {
      conAlgo++;
      if (d.done === d.due) hechos++;
    }

    const titulo = d.due === 0
      ? fechaLegible(d.date) + " — " + t("hist.nothing_due")
      : fechaLegible(d.date) + " — " + d.done + "/" + d.due;

    celdas +=
      '<rect class="hm-cell hm-cell--' + d.level + (d.date === todayISO ? " hm-cell--hoy" : "") + '" x="' + x + '" y="' + y + '"' +
      ' width="' + CELDA + '" height="' + CELDA + '" rx="2.5">' +
      "<title>" + escHtml(titulo) + "</title></rect>";
  });

  // Banda de meses: una etiqueta en la primera columna de cada mes, como
  // el calendario de GitHub. Sin esto, un año de celdas no dice en qué
  // parte del año estás mirando.
  let meses = "";
  let mesPrevio = -1;
  for (let c = 0; c < semanas; c++) {
    const lunes = new Date(base + c * 604800000);
    const m = lunes.getUTCMonth();
    if (m !== mesPrevio) {
      // La última columna se salta: la etiqueta se saldría del SVG.
      if (mesPrevio !== -1 && c < semanas - 1) {
        const txt = lunes.toLocaleDateString(locale(), { month: "short", timeZone: "UTC" })
          .replace(/\.$/, "");
        meses += '<text class="hm-mes" x="' + (c * PASO) + '" y="10">' + escHtml(txt) + "</text>";
      }
      mesPrevio = m;
    }
  }

  // Etiquetas de día: solo lunes, miércoles y viernes, como GitHub. Las
  // siete no caben en 11px de alto sin solaparse.
  const dows = [0, 2, 4].map(function (i) {
    const d = new Date(Date.UTC(2024, 0, 1 + i)); // 2024-01-01 fue lunes
    const txt = d.toLocaleDateString(locale(), { weekday: "short", timeZone: "UTC" })
      .replace(/\.$/, "");
    return '<span style="grid-row:' + (i + 1) + '">' +
      escHtml(txt.charAt(0).toUpperCase() + txt.slice(1)) + "</span>";
  }).join("");

  const resumen = t("hist.map_sr")
    .replace("{done}", String(hechos))
    .replace("{total}", String(conAlgo));

  const rotulo = semanas >= SEMANAS_MAPA
    ? t("hist.map_year")
    : t("hist.map_since").replace("{date}", new Date(desde + "T00:00:00").toLocaleDateString(locale(), { month: "long", year: "numeric" }));

  return (
    '<section class="hist-bloque">' +
    '<p class="hist-caption">' + escHtml(rotulo) + "</p>" +
    '<div class="hm-wrap">' +
      '<div class="hm-dows" aria-hidden="true">' + dows + "</div>" +
      '<div class="hm-scroll" id="hm-scroll">' +
        '<svg class="hm-grid" width="' + ancho + '" height="' + (alto + ALTO_MESES) + '"' +
        ' viewBox="0 0 ' + ancho + " " + (alto + ALTO_MESES) + '" role="img"' +
        ' aria-label="' + escHtml(resumen) + '">' +
          meses +
          '<g transform="translate(0,' + ALTO_MESES + ')">' + celdas + "</g>" +
        "</svg>" +
      "</div>" +
    "</div>" +
    leyendaHTML() +
    "</section>"
  );
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
    if (isDueOn(habit, d)) clase = isDoneOn(habit, d) ? "hs-cell--done" : (i === 0 ? "hs-cell--pend" : "hs-cell--miss");
    celdas += '<span class="hs-cell ' + clase + (i === 0 ? " hs-cell--hoy" : "") + '"></span>';
  }
  return '<span class="hs-strip" aria-hidden="true" title="' +
    escHtml(t("hist.recent").replace("{n}", String(dias))) + '">' + celdas + "</span>";
}

/** Bloque 3: un hábito por fila — racha, % del periodo y su tira de días. */
function listaHTML(habits, todayISO) {
  if (habits.length === 0) {
    return '<p class="hist-empty">' + escHtml(t("hist.empty")) + "</p>";
  }

  const dias = esMovil() ? DIAS_TIRA_MOVIL : DIAS_TIRA_ESCRITORIO;
  let filas = "";

  habits.forEach(function (h) {
    const racha = computeStreak(h, todayISO);
    // El porcentaje sigue al filtro; la racha no: es un dato del hábito,
    // no del periodo que se esté mirando.
    const desde = _periodo === "todo" ? startDate(h) : desdeDelPeriodo(habits, todayISO);
    const st = statsBetween(h, desde, todayISO);
    const pct = st.due ? Math.round((st.done / st.due) * 100) : 0;

    filas +=
      '<li class="hist-row">' +
        '<span class="hist-row-top">' +
          '<span class="hist-name">' + escHtml(h.name) + "</span>" +
          '<span class="hist-stats">' +
            // Icono lucide y no el emoji 🔥: el emoji lo pinta la fuente
            // del sistema con su propio color —blanco en muchos casos— y
            // no hay forma de teñirlo. El SVG hereda `currentColor`, así
            // que la llama sale del mismo rojo que el número.
            '<span class="hist-streak" title="' + escHtml(t("hist.streak")) + '">' +
              '<i data-lucide="flame" class="hist-flame"></i>' + racha +
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

  // La sección no se rotula "últimos 30 días" aunque la tira lo sea: el
  // porcentaje de al lado obedece al filtro, y un rótulo con un número
  // de días fijo estaría contradiciendo a la mitad de la fila. La tira
  // dice su ventana en el tooltip.
  return '<section class="hist-bloque hist-bloque--lista">' +
    '<p class="hist-caption">' + escHtml(t("hist.per_habit")) + "</p>" +
    '<ul class="hist-list">' + filas + "</ul>" +
  "</section>";
}

/**
 * Una caja que se desplaza tiene que ser alcanzable con el teclado: sin
 * esto, el mapa —que casi siempre desborda— solo se puede recorrer con
 * ratón o dedo. Se mide en vez de suponerlo, para no dejar una parada de
 * tabulador de más cuando el contenido cabe entero.
 *
 * @param {Element|null} el
 * @param {string} etiqueta
 * @param {"x"|"y"} eje
 */
function enfocableSiDesborda(el, etiqueta, eje) {
  if (!el) return;
  const desborda = eje === "x"
    ? el.scrollWidth > el.clientWidth + 1
    : el.scrollHeight > el.clientHeight + 1;
  if (!desborda) {
    el.removeAttribute("tabindex");
    el.removeAttribute("role");
    el.removeAttribute("aria-label");
    return;
  }
  el.tabIndex = 0;
  el.setAttribute("role", "region");
  el.setAttribute("aria-label", etiqueta);
}

/**
 * Con pocas semanas (hábitos nuevos) el mapa ocupaba un tercio de su
 * tarjeta y el resto quedaba vacío. Si sobra sitio, crece hasta llenarla,
 * con un tope de casi el doble para que las casillas no se vuelvan
 * baldosas. Los rótulos de día escalan con él (--hm-escala) para seguir
 * cayendo en su fila. Si no cabe, se queda a su tamaño y se desplaza.
 */
function escalarMapa(cuerpo, scroll) {
  const svg = scroll && scroll.querySelector(".hm-grid");
  const wrap = scroll && scroll.closest(".hm-wrap");
  if (!svg || !wrap) return;
  const ancho = Number(svg.getAttribute("width"));
  const dows = wrap.querySelector(".hm-dows");
  const sitio = wrap.clientWidth - (dows ? dows.offsetWidth + 6 : 0);
  const escala = Math.max(1, Math.min(1.8, sitio / ancho));
  if (escala === 1) return;
  svg.style.width = (ancho * escala) + "px";
  svg.style.height = "auto";
  wrap.style.setProperty("--hm-escala", String(escala));
}

/** Rellena el cuerpo del modal. Se vuelve a llamar al cambiar el filtro. */
function pintar(cuerpo, habits, todayISO, actividad) {
  if (_pestana === "actividad") {
    const locale = getLang() === "en" ? "en-GB" : "es-ES";
    const ahora = Date.now();
    cuerpo.innerHTML = pestanasHTML() +
      '<div class="act-linea">' + lineaTiempoHTML(agruparPorDia(visibles(actividad || [], { dias: 90 }, ahora)), ahora, locale, t) + "</div>";
    if (window.lucide) window.lucide.createIcons({ nodes: [cuerpo] });
    return;
  }
  const conDatos = habits.length > 0;
  cuerpo.innerHTML = pestanasHTML() + (conDatos
    ? filtroHTML() +
      resumenHTML(habits, todayISO) +
      mapaHTML(habits, todayISO) +
      listaHTML(habits, todayISO)
    : listaHTML(habits, todayISO));

  // El mapa nace mirando a hoy, no a hace un año: al abrirlo, lo primero
  // que se ve tiene que ser la parte reciente.
  const scroll = cuerpo.querySelector("#hm-scroll");
  escalarMapa(cuerpo, scroll);
  if (scroll) scroll.scrollLeft = scroll.scrollWidth;

  enfocableSiDesborda(scroll, t("hist.map_year"), "x");
  enfocableSiDesborda(cuerpo.querySelector(".hist-list"), t("hist.list_label"), "y");

  // Los <i data-lucide> se sustituyen por SVG aquí y no una sola vez al
  // abrir: el cuerpo se reconstruye entero en cada cambio de filtro, y
  // sin esto las llamas desaparecerían al pulsar "90 días".
  if (window.lucide) window.lucide.createIcons({ nodes: [cuerpo] });
}

/**
 * Abre el visor. `habits` son los hábitos ya saneados del estado.
 *
 * @param {Array<any>} habits
 * @param {string} todayISO
 */
export function openHabitsHistory(habits, todayISO, actividad) {
  _pestana = "resumen";
  const vivos = (habits || []).filter(function (h) { return !h.archived; });

  const { overlay, box } = createModalBase();
  box.classList.add("hist-modal");
  // En móvil, pantalla propia que entra desde la derecha (ver CSS).
  if (esMovil()) overlay.classList.add("modal-overlay--pantalla");
  box.innerHTML =
    '<div class="hist-pantalla-head">' +
      '<button type="button" class="hist-volver" id="hist-back">' +
        '<i data-lucide="chevron-left"></i><span>' + escHtml(t("date.today")) + "</span>" +
      "</button>" +
      '<p class="hist-pantalla-title">' + escHtml(t("hist.title_short")) + "</p>" +
    "</div>" +
    '<p class="modal-label">' + escHtml(t("hist.title")) + "</p>" +
    '<div class="hist-body"></div>' +
    '<div class="modal-actions">' +
      '<button type="button" class="modal-btn modal-btn-cancel" id="hist-close">' +
        escHtml(t("modal.close")) +
      "</button>" +
    "</div>";

  const cuerpo = box.querySelector(".hist-body");
  pintar(cuerpo, vivos, todayISO, actividad);

  // Delegado: el cuerpo se reconstruye entero en cada cambio de filtro,
  // así que enganchar los botones uno a uno los dejaría muertos.
  cuerpo.addEventListener("click", function (e) {
    const pest = e.target.closest("[data-pestana]");
    if (pest) {
      if (pest.dataset.pestana === _pestana) return;
      _pestana = pest.dataset.pestana;
      pintar(cuerpo, vivos, todayISO, actividad);
      return;
    }
    const btn = e.target.closest("[data-rango]");
    if (!btn || btn.dataset.rango === _periodo) return;
    _periodo = btn.dataset.rango;
    pintar(cuerpo, vivos, todayISO, actividad);
  });

  function cerrar() { closeModal(overlay); }
  box.querySelector("#hist-close").addEventListener("click", cerrar);
  box.querySelector("#hist-back").addEventListener("click", cerrar);
  // Escape y clic fuera también la cierran (createModalBase los enruta aquí).
  overlay._cancel = cerrar;
  if (window.lucide) window.lucide.createIcons({ nodes: [box.querySelector(".hist-pantalla-head")] });
}
