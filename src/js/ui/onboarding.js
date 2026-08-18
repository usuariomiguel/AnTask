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
    icon:    "sparkles",
    title:   "Bienvenido a antask",
    bodyHTML:
      '<p class="onb-lead">Una app de tareas con tres ideas:</p>' +
      '<ul class="onb-bullets">' +
        '<li><span class="onb-bullet-icon"><i data-lucide="inbox"></i></span>' +
          '<span><strong>Inbox</strong> — captura tareas sin pensar dónde guardarlas.</span></li>' +
        '<li><span class="onb-bullet-icon"><i data-lucide="sun"></i></span>' +
          '<span><strong>Hoy</strong> — todo lo del día en un sitio, atravesando proyectos.</span></li>' +
        '<li><span class="onb-bullet-icon"><i data-lucide="zap"></i></span>' +
          '<span><strong>Captura rápida</strong> — añadir tareas desde cualquier sitio con un atajo.</span></li>' +
      '</ul>',
  },
  {
    eyebrow: "Paso 2 de 3",
    icon:    "zap",
    title:   "Captura más rápida que pensar",
    bodyHTML:
      '<p class="onb-lead">Pulsa <kbd>Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Espacio</kbd> desde cualquier sitio.</p>' +
      '<p class="onb-muted" style="margin-top:0">Y al escribir, usa <strong>sintaxis natural</strong>:</p>' +
      '<div class="onb-syntax-demo">' +
        '<div class="onb-syntax-input"><code id="onb-syntax-typed"></code><span class="onb-caret" id="onb-syntax-caret"></span></div>' +
        '<div class="onb-syntax-arrow">↳</div>' +
        '<div class="onb-syntax-chips" id="onb-syntax-chips"></div>' +
      '</div>' +
      '<p class="onb-muted">Detecta fechas y prioridad. Tú solo escribes.</p>',
    // Guía del efecto de escritura — fuera del HTML, lo rellena _runTypeDemo.
    typeDemo: {
      text: "Llamar al banco mañana p1",
      chips: [
        { cls: "onb-chip-date", icon: "calendar", label: "Mañana" },
        { cls: "onb-chip-prio", icon: "flag",     label: "Alta" },
      ],
    },
  },
  {
    eyebrow: "Paso 3 de 3",
    icon:    "keyboard",
    title:   "Atajos esenciales",
    bodyHTML:
      '<table class="onb-shortcuts">' +
        '<tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Buscar en proyectos y tareas</td></tr>' +
        '<tr><td><kbd>Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Espacio</kbd></td><td>Captura rápida (al Inbox)</td></tr>' +
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
 * Escribe `demo.text` letra a letra en `#onb-syntax-typed` y, al terminar,
 * revela los chips detectados con un pequeño rebote escalonado — vender la
 * sensación de "esto entiende lo que escribo" en vez de enseñar una imagen
 * fija del resultado.
 *
 * @param {HTMLElement} box
 * @param {{text: string, chips: Array<{cls:string, icon:string, label:string}>}} demo
 * @returns {number} id del intervalo — cancelarlo si se cambia de paso a media escritura
 */
function _runTypeDemo(box, demo) {
  const typedEl = box.querySelector("#onb-syntax-typed");
  const caretEl = box.querySelector("#onb-syntax-caret");
  const chipsEl = box.querySelector("#onb-syntax-chips");
  if (!typedEl || !chipsEl) return null;

  let i = 0;
  const text = demo.text;
  const timer = setInterval(function () {
    i++;
    typedEl.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(timer);
      if (caretEl) caretEl.classList.add("onb-caret-done");
      setTimeout(function () {
        demo.chips.forEach(function (chip, idx) {
          const span = document.createElement("span");
          span.className = "onb-chip " + chip.cls;
          span.style.animationDelay = (idx * 100) + "ms";
          span.innerHTML = '<i data-lucide="' + chip.icon + '"></i>' + chip.label;
          chipsEl.appendChild(span);
        });
        if (window.lucide) window.lucide.createIcons({ nodes: [chipsEl] });
      }, 220);
    }
  }, 42);
  return timer;
}

/**
 * Ráfaga de puntitos de color desde el centro de `fromEl` — el remate visual
 * al pulsar "Empezar". `fromEl` necesita overflow visible: el botón base ya
 * trae `overflow: hidden` por defecto, así que se pisa aquí en línea.
 *
 * @param {HTMLElement} fromEl
 */
function _burst(fromEl) {
  const colors = ["var(--c-primary-500)", "var(--c-primary-300)", "#f2b3a8", "#e0a35a"];
  fromEl.style.overflow = "visible";
  const n = 10;
  for (let i = 0; i < n; i++) {
    const dot = document.createElement("span");
    dot.className = "onb-burst-dot";
    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.35;
    const dist  = 30 + Math.random() * 18;
    dot.style.setProperty("--tx", Math.cos(angle) * dist + "px");
    dot.style.setProperty("--ty", Math.sin(angle) * dist + "px");
    dot.style.setProperty("--dot-color", colors[i % colors.length]);
    fromEl.appendChild(dot);
    dot.addEventListener("animationend", function () { dot.remove(); });
  }
}

/**
 * Abre el modal de onboarding.
 *
 * @param {{ onDone?: () => void }} [opts]
 */
export function showOnboarding(opts) {
  const onDone = opts && opts.onDone;
  let currentStep  = 0;
  let lastDir       = 1;   // 1 = avanzando, -1 = retrocediendo (dirección de la animación)
  let typeTimer     = null;

  const { overlay, box } = createModalBase();
  box.className = "modal-box modal-box-onb";

  function finish() {
    markOnboardingDone();
    closeModal(overlay);
    if (typeof onDone === "function") onDone();
  }

  function render() {
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }

    const step    = STEPS[currentStep];
    const isLast  = currentStep === STEPS.length - 1;
    const isFirst = currentStep === 0;

    const dotsHTML = STEPS.map(function (_, i) {
      return '<span class="onb-dot' + (i === currentStep ? " onb-dot-active" : "") + '"></span>';
    }).join("");

    box.innerHTML =
      '<div class="onb-step" style="--onb-dir:' + (lastDir === -1 ? "-16px" : "16px") + '">' +
        '<div class="onb-eyebrow">' + step.eyebrow + '</div>' +
        '<div class="onb-icon"><i data-lucide="' + step.icon + '"></i></div>' +
        '<h2 class="onb-title">' + step.title + '</h2>' +
        '<div class="onb-body">' + step.bodyHTML + '</div>' +
      '</div>' +
      '<div class="onb-dots">' + dotsHTML + '</div>' +
      '<div class="onb-actions">' +
        '<button type="button" class="onb-skip"' + (isLast ? ' style="visibility:hidden"' : "") + '>Saltar</button>' +
        '<div class="onb-nav">' +
          (isFirst ? "" : '<button type="button" class="onb-prev">← Atrás</button>') +
          '<button type="button" class="onb-next">' + (isLast ? "Empezar" : "Siguiente →") + '</button>' +
        '</div>' +
      '</div>';

    if (window.lucide) window.lucide.createIcons({ nodes: [box] });
    if (step.typeDemo) typeTimer = _runTypeDemo(box, step.typeDemo);

    const nextBtn = box.querySelector(".onb-next");
    const prevBtn = box.querySelector(".onb-prev");
    const skipBtn = box.querySelector(".onb-skip");

    if (nextBtn) nextBtn.addEventListener("click", function () {
      if (isLast) {
        nextBtn.disabled = true;
        _burst(nextBtn);
        setTimeout(finish, 320);
        return;
      }
      currentStep++; lastDir = 1; render();
    });

    if (prevBtn) prevBtn.addEventListener("click", function () {
      currentStep--; lastDir = -1; render();
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
  function cleanup() {
    document.removeEventListener("keydown", onKey);
    if (typeTimer) { clearInterval(typeTimer); typeTimer = null; }
  }
  document.addEventListener("keydown", onKey);
  overlay.addEventListener("transitionend", function () {
    if (!overlay.classList.contains("modal-visible")) cleanup();
  }, { once: true });

  render();
}
