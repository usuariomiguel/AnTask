// ═══════════════════════════════════════════════════════════════
// Etiquetas (tags) de una tarea
//
// - getLabelSlot / getLabelColor: hashing puro que asigna un color
//   determinista a cada nombre de etiqueta.
// - renderTaskLabels: pinta los badges junto a una tarea. Recibe
//   un callback `onToggleFilter(labelName)` para que el caller
//   decida qué hacer al pulsar (en script.js se mutará el filtro
//   global y se re-renderiza).
// ═══════════════════════════════════════════════════════════════

const TAG_SLOTS = ["violet", "blue", "green", "amber", "pink", "rose", "cyan", "slate"];

/**
 * Asigna determinísticamente uno de los 8 "slots" de color a un
 * nombre de etiqueta usando un hash sencillo (mismo nombre →
 * mismo color siempre).
 */
export function getLabelSlot(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return TAG_SLOTS[hash % TAG_SLOTS.length];
}

/**
 * Devuelve la variable CSS del color de foreground (`fg`) asociado
 * al slot calculado para esa etiqueta.
 */
export function getLabelColor(name) {
  return "var(--tag-" + getLabelSlot(name) + "-fg)";
}

/**
 * Pinta los badges de las etiquetas de una tarea dentro de un
 * contenedor. Borra lo que hubiera dentro.
 *
 * @param {{labels?: string[]}} task
 * @param {HTMLElement} container
 * @param {(labelName: string) => void} [onToggleFilter]
 *   Callback invocado al pulsar un badge (típicamente para alternar
 *   el filtro de etiqueta activo).
 */
export function renderTaskLabels(task, container, onToggleFilter) {
  container.innerHTML = "";
  if (!Array.isArray(task.labels) || task.labels.length === 0) return;
  task.labels.forEach(function (labelName) {
    const badge = document.createElement("span");
    badge.className = "label-badge";
    badge.textContent = labelName;
    const slot = getLabelSlot(labelName);
    badge.style.setProperty("--tag-bg", "var(--tag-" + slot + "-bg)");
    badge.style.setProperty("--tag-fg", "var(--tag-" + slot + "-fg)");
    if (typeof onToggleFilter === "function") {
      badge.addEventListener("click", function (e) {
        e.stopPropagation();
        onToggleFilter(labelName);
      });
    }
    container.appendChild(badge);
  });
}
