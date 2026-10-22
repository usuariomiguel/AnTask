// @ts-check
// Enlaces adjuntos a una tarea: reconocer lo que el usuario pega o
// escribe, limpiarlo y darle un nombre legible.
//
// Solo http y https. Cualquier otro esquema (javascript:, data:, file:…)
// se rechaza: el enlace acaba en un <a href> y uno de esos sería código
// ejecutable o un archivo local.

export const ENLACES_MAX = 20;
const URL_MAX = 2048;
const TITULO_MAX = 120;

/**
 * Convierte texto en una URL válida, o null si no lo es.
 * Acepta «https://…» y también «www.algo.com/…» o «algo.com/…» sin
 * esquema (se le pone https). Con `estricto`, solo lo que ya trae
 * http(s):// o empieza por www. — es el modo del pegado suelto en el
 * panel, donde un «hola.que tal» no debe convertirse en enlace.
 * @param {string} texto
 * @param {{estricto?: boolean}} [opts]
 * @returns {string|null}
 */
export function normalizarEnlace(texto, opts = {}) {
  if (typeof texto !== "string") return null;
  let t = texto.trim();
  if (!t || t.length > URL_MAX || /\s/.test(t)) return null;
  const conEsquema = /^[a-z][a-z0-9+.-]*:/i.test(t);
  if (conEsquema) {
    if (!/^https?:\/\//i.test(t)) return null;
  } else {
    if (opts.estricto && !/^www\./i.test(t)) return null;
    // Sin esquema: tiene que parecer un dominio (algo.tld) para no
    // convertir cualquier palabra en enlace.
    if (!/^[^/?#]+\.[a-z]{2,}([/:?#]|$)/i.test(t)) return null;
    t = "https://" + t;
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname || !u.hostname.includes(".")) return null;
    return u.href;
  } catch (_) {
    return null;
  }
}

/** Dominio sin «www.»: «docs.google.com». */
export function dominioDe(url) {
  try { return new URL(url).hostname.replace(/^www\./i, ""); } catch (_) { return ""; }
}

/** ¿Un tramo de ruta se lee como nombre, o es un código (id de documento…)? */
function pareceNombre(s) {
  if (s.length < 2 || s.length > 60 || !/[a-zà-ÿ]/i.test(s)) return false;
  // «1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms»: largo, con cifras y
  // mayúsculas y minúsculas mezcladas. Eso no es un nombre.
  if (s.length > 14 && /\d/.test(s) && /[A-Z]/.test(s) && /[a-z]/.test(s)) return false;
  return true;
}

/**
 * Nombre legible para la fila: el último tramo con sentido de la ruta
 * («Presupuesto 2026», «Mi proyecto»). Si no hay ninguno, el dominio. La
 * fila enseña el dominio debajo, así que aquí no se repite. Sin pedir la
 * página: eso enviaría la URL a un tercero y el navegador lo bloquearía.
 * @param {string} url
 * @returns {string}
 */
export function tituloDe(url) {
  try {
    const u = new URL(url);
    const dominio = u.hostname.replace(/^www\./i, "");
    const tramos = u.pathname.split("/").filter(Boolean)
      .map((s) => { try { return decodeURIComponent(s); } catch (_) { return s; } })
      .map((s) => s.replace(/\.[a-z0-9]{2,4}$/i, "").replace(/[-_+]+/g, " ").trim())
      .filter((s) => !/^(edit|view|d|u|0|index|file|document|spreadsheets|presentation)$/i.test(s))
      .filter(pareceNombre);
    const ultimo = tramos.length ? tramos[tramos.length - 1] : "";
    return (ultimo ? ultimo.charAt(0).toUpperCase() + ultimo.slice(1) : dominio).slice(0, TITULO_MAX);
  } catch (_) {
    return "";
  }
}

/**
 * Sanea la lista de enlaces de una tarea (localStorage, nube, copia JSON).
 * @param {any} entrada
 * @returns {{id: string, url: string, title: string}[]}
 */
export function sanitizeLinks(entrada) {
  if (!Array.isArray(entrada)) return [];
  const vistos = new Set();
  const out = [];
  for (const l of entrada) {
    if (!l || typeof l !== "object") continue;
    const url = normalizarEnlace(typeof l.url === "string" ? l.url : "");
    if (!url || vistos.has(url)) continue;
    vistos.add(url);
    const title = typeof l.title === "string" && l.title.trim() ? l.title.trim().slice(0, TITULO_MAX) : tituloDe(url);
    out.push({ id: typeof l.id === "string" && l.id ? l.id : Math.random().toString(36).slice(2, 10), url, title });
    if (out.length >= ENLACES_MAX) break;
  }
  return out;
}
