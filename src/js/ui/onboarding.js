// ═══════════════════════════════════════════════════════════════
// Onboarding de primera ejecución
//
// Modal de 3 pasos que enseña los conceptos clave: Inbox + Hoy +
// captura rápida + sintaxis natural. Se muestra una sola vez.
// El flag se persiste en localStorage.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";

const STORAGE_KEY = "antask-onboarded";

const STEPS = [
  {
    eyebrow: "Paso 1 de 3",
    icon:    "☀️",
    title:   "Bienvenido a antask",
    bodyHTML:
      '<p class="onb-lead">Una app de tareas con tres ideas:</p>' +
      '<ul class="onb-bullets">' +
        '<li><span class="onb-bullet-icon">📥</span>' +
          '<span><strong>Inbox</strong> — captura tareas sin pensar dónde guardarlas.</span></li>' +
        '<li><span class="onb-bullet-icon">☀️</span>' +
          '<span><strong>Hoy</strong> — todo lo del día en un sitio, atravesando proyectos.</span></li>' +
        '<li><span class="onb-bullet-icon">⚡</span>' +
          '<span><strong>Captura rápida</strong> — añadir tareas desde cualquier sitio con un atajo.</span></li>' +
      '</ul>',
  },
  {
    eyebrow: "Paso 2 de 3",
    icon:    "⚡",
    title:   "Captura más rápida que pensar",
    bodyHTML:
      '<p class="onb-lead">Pulsa <kbd>Ctrl</kbd> + <kbd>⇧</kbd> + <kbd>Espacio</kbd> desde cualquier sitio.</p>' +
      '<p class="onb-muted" style="margin-top:0">Y al escribir, usa <strong>sintaxis natural</strong>:</p>' +
      '<div class="onb-syntax-demo">' +
        '<code class="onb-syntax-input">Llamar al banco mañana p1 #personal</code>' +
        '<div class="onb-syntax-arrow">↳</div>' +
        '<div class="onb-syntax-chips">' +
          '<span class="onb-chip onb-chip-date">📅 Mañana</span>' +
          '<span class="onb-chip onb-chip-prio">🚩 Alta</span>' +
          '<span class="onb-chip onb-chip-label">#personal</span>' +
        '</div>' +
      '</div>' +
      '<p class="onb-muted">Detecta fechas, prioridad y etiquetas. Tú solo escribes.</p>',
  },
  {
    eyebrow: "Paso 3 de 3",
    icon:    "⌨️",
    title:   "Atajos esenciales",
    bodyHTML:
      '<table class="onb-shortcuts">' +
        '<tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Buscar en proyectos y notas</td></tr>' +
        '<tr><td><kbd>Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Espacio</kbd></td><td>Captura rápida (al Inbox)</td></tr>' +
        '<tr><td><kbd>N</kbd></td><td>Enfocar campo "nueva tarea"</td></tr>' +
        '<tr><td><kbd>A</kbd> · <kbd>C</kbd></td><td>Vista Agenda · Calendario</td></tr>' +
        '<tr><td><kbd>?</kbd></td><td>Ver todos los atajos</td></tr>' +
      '</table>' +
      '<p class="onb-cta-text">Pulsa <strong>Empezar</strong> y a por ello.</p>',
  },
];

/** ¿Debería mostrarse el onboarding? (no se ha visto antes) */
export function shouldShowOnboarding() {
  try { return !localStorage.getItem(STORAGE_KEY); }
  catch (_) { return false; }
}

/** Marca el onboarding como visto (silencioso, no muestra nada). */
export function markOnboardingDone() {
  try { localStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
}

/**
 * Abre el modal de onboarding.
 *
 * @param {{ onDone?: () => void }} [opts]
 */
export function showOnboarding(opts) {
  const onDone = opts && opts.onDone;
  let currentStep = 0;

  const { overlay, box } = createModalBase();
  box.className = "modal-box modal-box-onb";

  function finish() {
    markOnboardingDone();
    closeModal(overlay);
    if (typeof onDone === "function") onDone();
  }

  function render() {
    const step    = STEPS[currentStep];
    const isLast  = currentStep === STEPS.length - 1;
    const isFirst = currentStep === 0;

    const dotsHTML = STEPS.map(function (_, i) {
      return '<span class="onb-dot' + (i === currentStep ? " onb-dot-active" : "") + '"></span>';
    }).join("");

    box.innerHTML =
      '<div class="onb-eyebrow">' + step.eyebrow + '</div>' +
      '<div class="onb-icon">' + step.icon + '</div>' +
      '<h2 class="onb-title">' + step.title + '</h2>' +
      '<div class="onb-body">' + step.bodyHTML + '</div>' +
      '<div class="onb-dots">' + dotsHTML + '</div>' +
      '<div class="onb-actions">' +
        '<button type="button" class="onb-skip"' + (isLast ? ' style="visibility:hidden"' : "") + '>Saltar</button>' +
        '<div class="onb-nav">' +
          (isFirst ? "" : '<button type="button" class="onb-prev">← Atrás</button>') +
          '<button type="button" class="onb-next">' + (isLast ? "Empezar" : "Siguiente →") + '</button>' +
        '</div>' +
      '</div>';

    const nextBtn = box.querySelector(".onb-next");
    const prevBtn = box.querySelector(".onb-prev");
    const skipBtn = box.querySelector(".onb-skip");

    if (nextBtn) nextBtn.addEventListener("click", function () {
      if (isLast) finish();
      else { currentStep++; render(); }
    });

    if (prevBtn) prevBtn.addEventListener("click", function () {
      currentStep--;
      render();
    });

    if (skipBtn) skipBtn.addEventListener("click", finish);

    // Focus en el botón principal para navegación con teclado
    setTimeout(function () { if (nextBtn) nextBtn.focus(); }, 40);
  }

  overlay._cancel = finish;

  // Teclas: → siguiente, ← atrás, Esc cierra
  function onKey(e) {
    if (e.key === "Escape") { finish(); cleanup(); }
    if (e.key === "ArrowRight" || e.key === "Enter") {
      const btn = box.querySelector(".onb-next");
      if (btn) btn.click();
    }
    if (e.key === "ArrowLeft") {
      const btn = box.querySelector(".onb-prev");
      if (btn) btn.click();
    }
  }
  function cleanup() { document.removeEventListener("keydown", onKey); }
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("transitionend", function () {
    if (!overlay.classList.contains("modal-visible")) cleanup();
  }, { once: true });

  render();
}
