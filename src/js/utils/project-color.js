// ═══════════════════════════════════════════════════════════════
// Color efectivo de un proyecto.
//
// Vive aquí —y no en script.js— porque lo necesitan también los
// módulos de UI que pintan chips de lista (task-badges, search).
// Cuando cada uno resolvía el color por su cuenta, los proyectos
// sin `.color` (los importados de un .json, o los creados sin
// elegir color: `color: ""`) salían con la franja de acento
// coloreada y el chip gris en la misma fila.
// ═══════════════════════════════════════════════════════════════

export const INBOX_ID = "__inbox__";

/**
 * Color determinista por id (hash → índice de paleta). Sirve de
 * fallback cuando el proyecto no tiene .color explícito, para que
 * cada uno tenga su propio dot/franja visual.
 * @param {string} id
 * @returns {string}
 */
export function projectColorFromId(id) {
  // El Inbox (y un id ausente) usan el acento del tema, no un hue
  // hasheado: el hash de "__inbox__" caía en violeta, fuera de la
  // paleta Tierra.
  if (!id || id === INBOX_ID) return "var(--c-primary-500)";
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  // Paleta cálida "Tierra" del prototipo v1 (evita hues fuera de tono como
  // el violeta que salía del hash libre). Índice determinista por id.
  const palette = ["#c98a3c", "#7c8a52", "#5aa06b", "#3d8fb0", "#b0473f", "#8a6fb0"];
  return palette[Math.abs(hash) % palette.length];
}

/**
 * Color efectivo de un proyecto: el elegido por el usuario o el hash del id.
 * @param {{id?: string, color?: string} | null | undefined} project
 * @returns {string}
 */
export function projectColor(project) {
  return (project && (project.color || projectColorFromId(project.id || ""))) || "var(--c-primary-500)";
}
