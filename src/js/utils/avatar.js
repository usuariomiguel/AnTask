// @ts-check
// ═══════════════════════════════════════════════════════════════
// Avatar dibujado (DiceBear · Clay, variante «Bare»)
// ═══════════════════════════════════════════════════════════════
//
// Se genera en el propio navegador: la semilla no sale del dispositivo
// (la API pública de DiceBear la recibiría en la URL) y el avatar funciona
// sin conexión. La definición del estilo se carga en diferido: mientras
// llega, el avatar enseña la inicial de siempre.
//
// Clay es de DiceBear, bajo CC0 1.0 (dominio público): no pide atribución.
// Variante «Bare» (preset de dicebear.com/styles/clay/presets): sin pieza
// en la cabeza ni estampado, solo cuerpo y cara, con los colores del
// estilo. Trae su propia animación en CSS dentro del SVG.
//
// Por defecto se pinta QUIETO: un SVG animado dentro de un <img> obliga al
// navegador a redibujarlo en cada fotograma, y solo el avatar de la barra
// tenía la app en reposo con ~11 % del hilo principal ocupado (0 % sin él;
// ~20 % en un móvil lento). Además, «reducir movimiento» no lo paraba. La
// versión animada se pide aparte, para ratos cortos (ver avatarAnimable).

/** Preset «Bare»: sin pieza en la cabeza (top) ni estampado (pattern). */
const OPCIONES = {
  topProbability: 0,
  patternProbability: 0,
};

/** @typedef {(seed: string, animado?: boolean) => string} PintarAvatar */

/** @type {Promise<PintarAvatar> | null} */
let _generador = null;

/**
 * Carga el estilo una sola vez y devuelve la función que pinta un avatar:
 * quieto por defecto; con `animado`, la versión que respira y parpadea.
 * @returns {Promise<PintarAvatar>}
 */
export function cargarGeneradorAvatar() {
  if (!_generador) {
    _generador = Promise.all([
      import("@dicebear/core"),
      import("@dicebear/styles/clay.json"),
    ]).then(function ([core, def]) {
      const estilo = new core.Style(/** @type {any} */ (def.default || def));
      return function (seed, animado) {
        return new core.Avatar(estilo, Object.assign({ seed: seed }, OPCIONES, {
          animationVariant: ["slow"],
          animationProbability: animado ? 100 : 0,
        })).toDataUri();
      };
    });
  }
  return _generador;
}

/**
 * Semilla aleatoria y estable para el perfil: no se usa el nombre para que
 * la cara no cambie al renombrarse.
 * @returns {string}
 */
export function nuevaSemillaAvatar() {
  return (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** ¿Puede animarse el avatar? No con «reducir movimiento» del sistema. */
export function avatarPuedeMoverse() {
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Anima el avatar de `img` solo mientras el ratón está encima de `host`
 * (el botón que lo lleva). Al salir vuelve a la versión quieta. Con dedo no
 * hay «encima», así que en móvil se queda siempre quieto.
 * @param {HTMLElement} host
 * @param {HTMLImageElement} img
 * @param {string} quieto
 * @param {string} animado
 */
export function avatarAnimable(host, img, quieto, animado) {
  img.dataset.quieto = quieto;
  img.dataset.animado = animado;
  if (/** @type {any} */ (host)._avatarAnimable) return;
  /** @type {any} */ (host)._avatarAnimable = true;
  host.addEventListener("pointerenter", function (e) {
    if (e.pointerType !== "mouse" || !avatarPuedeMoverse()) return;
    host.querySelectorAll("img[data-animado]").forEach(function (i) {
      /** @type {HTMLImageElement} */ (i).src = /** @type {HTMLElement} */ (i).dataset.animado || "";
    });
  });
  host.addEventListener("pointerleave", function () {
    host.querySelectorAll("img[data-quieto]").forEach(function (i) {
      /** @type {HTMLImageElement} */ (i).src = /** @type {HTMLElement} */ (i).dataset.quieto || "";
    });
  });
}
