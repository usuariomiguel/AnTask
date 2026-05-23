// @ts-check
import DOMPurify from "dompurify";

/**
 * Config permisiva para el editor de notas: permite negrita, cursiva,
 * listas, imágenes (base64 incluido) y tamaños de fuente.
 * Elimina <script>, event handlers, javascript: y cualquier otra
 * superficie de ejecución de código.
 */
const RICH_TEXT_CONFIG = {
  ALLOWED_TAGS: [
    "b", "strong", "i", "em", "u", "s", "del", "strike",
    "ul", "ol", "li",
    "br", "p", "div", "span",
    "img",
    "font",
  ],
  ALLOWED_ATTR: ["style", "src", "width", "height", "alt", "size"],
  // Permite URLs http/https y data:image/* (imágenes pegadas). Bloquea
  // javascript:, data:text/html, vbscript:, etc.
  ALLOWED_URI_REGEXP: /^(?:https?:|data:image\/[\w+.-]+;base64,|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Sanitiza HTML de entrada de usuario (notas, paste) usando DOMPurify.
 * Es seguro llamarlo con cadenas vacías o nulas.
 *
 * @param {string|null|undefined} html
 * @returns {string}
 */
export function sanitizeRichHtml(html) {
  if (!html || typeof html !== "string") return "";
  return DOMPurify.sanitize(html, RICH_TEXT_CONFIG);
}
