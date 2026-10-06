// @ts-check
// ═══════════════════════════════════════════════════════════════
// Avatar dibujado (DiceBear · Critters en tonos tierra)
// ═══════════════════════════════════════════════════════════════
//
// Se genera en el propio navegador: la semilla no sale del dispositivo
// (la API pública de DiceBear la recibiría en la URL) y el avatar funciona
// sin conexión. La definición del estilo se carga en diferido: mientras
// llega, el avatar enseña la inicial de siempre.
//
// Critters es de DiceBear, bajo CC0 1.0 (dominio público): no pide
// atribución. Trae su propia animación (respira, parpadea y mueve las
// orejas) en CSS dentro del SVG, así que se mueve también como <img>, y
// se para sola con «reducir movimiento» del sistema.

/** Colores en tonos tierra, a juego con la paleta de la app. */
const OPCIONES = {
  backgroundColor: ["#43301c"],
  bodyColor: ["#d9bd94", "#c4a377", "#e3cdb0", "#b08d5f"],
  accentColor: ["#a8865a", "#8f6d43"],
  inkColor: ["#2b1d10"],
  mouthVariant: ["smile", "tinySmile", "teeth", "ooh", "line", "smirk", "wavy",
    "catMouth", "zigzag", "frown", "sad", "slant", "dot", "tooth"],
  // Lenta: en la barra de abajo y en el perfil está siempre a la vista.
  animationVariant: ["slow"],
};

/** @type {Promise<(seed: string) => string> | null} */
let _generador = null;

/**
 * Carga el estilo una sola vez y devuelve la función que pinta un avatar.
 * @returns {Promise<(seed: string) => string>}
 */
export function cargarGeneradorAvatar() {
  if (!_generador) {
    _generador = Promise.all([
      import("@dicebear/core"),
      import("@dicebear/styles/critters.json"),
    ]).then(function ([core, def]) {
      const estilo = new core.Style(/** @type {any} */ (def.default || def));
      return function (seed) {
        return new core.Avatar(estilo, Object.assign({ seed: seed }, OPCIONES)).toDataUri();
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
