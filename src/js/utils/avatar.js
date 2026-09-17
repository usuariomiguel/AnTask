// @ts-check
// ═══════════════════════════════════════════════════════════════
// Avatar dibujado (DiceBear · Croodles)
// ═══════════════════════════════════════════════════════════════
//
// Se genera en el propio navegador: la semilla no sale del dispositivo
// (la API pública de DiceBear la recibiría en la URL) y el avatar funciona
// sin conexión. La definición del estilo pesa ~90 KB, así que se carga en
// diferido: mientras llega, el avatar enseña la inicial de siempre.
//
// Croodles es de vijay verma, bajo CC BY 4.0 (atribución en README).

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
      import("@dicebear/styles/croodles.json"),
    ]).then(function ([core, def]) {
      const estilo = new core.Style(/** @type {any} */ (def.default || def));
      return function (seed) {
        return new core.Avatar(estilo, { seed: seed }).toDataUri();
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
