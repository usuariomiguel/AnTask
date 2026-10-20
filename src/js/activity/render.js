// @ts-check
// Pintado del registro de actividad. Lo comparten la vista «Actividad»
// (PC), el «Hechas este día» del calendario (móvil) y la pestaña
// Actividad de Estadísticas, para que una fila se lea igual en los tres.

import { escHtml } from "../utils/html.js";
import { diaLocal } from "./model.js";

/** @typedef {import("./model.js").EventoActividad} EventoActividad */

/**
 * «Hoy», «Ayer» o «Lunes, 18 oct».
 * @param {string} dia
 * @param {number} ahora
 * @param {string} locale
 * @param {(k: string) => string} t
 */
export function etiquetaDia(dia, ahora, locale, t) {
  if (dia === diaLocal(ahora)) return t("act.today");
  if (dia === diaLocal(ahora - 864e5)) return t("act.yesterday");
  const txt = new Date(dia + "T00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

/**
 * Una fila: hora · icono · texto · lista (o «Hábito»).
 * Un hábito apuntado otro día (p. ej. el de ayer marcado hoy) no tiene una
 * hora que signifique nada para ese día: va sin hora y con la nota de
 * cuándo se apuntó.
 * @param {EventoActividad} ev
 * @param {string} locale
 * @param {(k: string) => string} t
 */
export function filaActividadHTML(ev, locale, t) {
  const hora = new Date(ev.ts).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const aDestiempo = diaLocal(ev.ts) !== ev.dia;
  const esTarea = ev.tipo === "tarea";
  let meta;
  if (esTarea) {
    meta = ev.lista
      ? '<span class="act-lista"><span class="act-punto"' + (ev.color ? ' style="background:' + escHtml(ev.color) + '"' : "") + '></span>' + escHtml(ev.lista) + "</span>"
      : "";
  } else {
    meta = '<span class="act-lista act-lista--habito">' + escHtml(t("act.habit")) + "</span>";
  }
  const nota = aDestiempo
    ? '<span class="act-nota">' + escHtml(t("act.logged_on").replace("{fecha}",
        new Date(ev.ts).toLocaleDateString(locale, { day: "numeric", month: "short" }) + " " + hora)) + "</span>"
    : "";
  return '<li class="act-fila act-fila--' + ev.tipo + '" data-act-id="' + escHtml(ev.id) + '">' +
    '<span class="act-hora">' + (aDestiempo ? "—" : escHtml(hora)) + "</span>" +
    '<span class="act-ico"><i data-lucide="' + (esTarea ? "circle-check" : "sprout") + '"></i></span>' +
    '<span class="act-cuerpo"><span class="act-texto">' + escHtml(ev.texto) + "</span>" + nota + "</span>" +
    meta +
  "</li>";
}

/**
 * Línea de tiempo entera en HTML (para Estadísticas): un bloque por día.
 * @param {{dia: string, eventos: EventoActividad[]}[]} grupos
 * @param {number} ahora
 * @param {string} locale
 * @param {(k: string) => string} t
 */
export function lineaTiempoHTML(grupos, ahora, locale, t) {
  if (!grupos.length) {
    return '<div class="act-vacio"><p class="act-vacio-titulo">' + escHtml(t("act.empty_title")) + "</p>" +
      '<p class="act-vacio-texto">' + escHtml(t("act.empty_body")) + "</p></div>";
  }
  return grupos.map((g) =>
    '<section class="act-dia"><h3 class="act-dia-titulo">' + escHtml(etiquetaDia(g.dia, ahora, locale, t)) +
      '<span class="act-dia-cuenta">' + g.eventos.length + "</span></h3>" +
      '<ul class="act-lista-dia">' + g.eventos.map((e) => filaActividadHTML(e, locale, t)).join("") + "</ul></section>"
  ).join("");
}
