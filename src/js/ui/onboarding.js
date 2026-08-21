// ═══════════════════════════════════════════════════════════════
// Onboarding de primera ejecución
//
// Modal de 3 pasos que enseña los conceptos clave: Inbox + Hoy +
// captura rápida + sintaxis natural. El paso 2 es interactivo de
// verdad — abre la captura rápida real y solo avanza cuando se crea
// una tarea, no con un simple "Siguiente". Se muestra una sola vez;
// el flag se persiste en localStorage.
// ═══════════════════════════════════════════════════════════════

import { createModalBase, closeModal } from "./modal.js";

const STORAGE_KEY = "antask-onboarded";

const STEPS = [
  {
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
    icon:    "zap",
    title:   "Captura más rápida que pensar",
    // Este paso no se salta con "Siguiente": solo avanza al crear una
    // tarea de verdad (ver el botón #onb-try-btn y su handler abajo).
    requiresAction: true,
    // Sin teclado físico no hay atajo que pulsar — en móvil se señala el
    // botón + flotante en su lugar (ver leadHTML en showOnboarding).
    leadHTML:
      '<p class="onb-lead">Pulsa <kbd>Ctrl</kbd>+<kbd>⇧</kbd>+<kbd>Espacio</kbd> desde cualquier sitio.</p>',
    leadHTMLMobile:
      '<p class="onb-lead">Toca el botón <strong>+</strong> desde cualquier pantalla.</p>',
    bodyHTML:
      '<p class="onb-muted" style="margin-top:0">Y al escribir, usa <strong>sintaxis natural</strong>:</p>' +
      '<div class="onb-syntax-demo">' +
        '<div class="onb-syntax-input"><code id="onb-syntax-typed"></code><span class="onb-caret" id="onb-syntax-caret"></span></div>' +
        '<div class="onb-syntax-arrow">↳</div>' +
        '<div class="onb-syntax-chips" id="onb-syntax-chips"></div>' +
      '</div>' +
      '<p class="onb-muted">Detecta fechas y prioridad. Tú solo escribes.</p>' +
      '<button type="button" class="onb-try-btn" id="onb-try-btn" hidden>' +
        '<i data-lucide="zap"></i> Ahora tú: crea tu primera tarea' +
      '</button>',
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
    icon:    "keyboard",
    title:   "Atajos esenciales",
    // Sin teclado físico no hay atajos que enseñar — este paso se salta
    // en móvil (ver el filtrado de STEPS en showOnboarding).
    desktopOnly: true,
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
 * fija del resultado. Al terminar de revelar los chips, llama a `onComplete`
 * (el paso 2 la usa para descubrir el botón "Ahora tú" justo después).
 *
 * @param {HTMLElement} box
 * @param {{text: string, chips: Array<{cls:string, icon:string, label:string}>}} demo
 * @param {() => void} [onComplete]
 * @returns {number} id del intervalo — cancelarlo si se cambia de paso a media escritura
 */
function _runTypeDemo(box, demo, onComplete) {
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
        if (typeof onComplete === "function") {
          setTimeout(onComplete, demo.chips.length * 100 + 250);
        }
      }, 220);
    }
  }, 42);
  return timer;
}

/**
 * Ráfaga de puntitos de color desde el centro de `fromEl` — remate visual
 * al pulsar "Empezar" o al crear la primera tarea de verdad en el paso 2.
 * `fromEl` necesita overflow visible: el botón base ya trae
 * `overflow: hidden` por defecto, así que se pisa aquí en línea.
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
  // Sin teclado físico, el paso de atajos no pinta nada en móvil.
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const activeSteps = isMobile ? STEPS.filter(function (s) { return !s.desktopOnly; }) : STEPS;
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

    const step    = activeSteps[currentStep];
    const isLast  = currentStep === activeSteps.length - 1;
    const isFirst = currentStep === 0;
    const eyebrow = "Paso " + (currentStep + 1) + " de " + activeSteps.length;
    const lead = (isMobile && step.leadHTMLMobile) ? step.leadHTMLMobile : (step.leadHTML || "");

    const dotsHTML = activeSteps.map(function (_, i) {
      return '<span class="onb-dot' + (i === currentStep ? " onb-dot-active" : "") + '"></span>';
    }).join("");

    box.innerHTML =
      '<div class="onb-step" style="--onb-dir:' + (lastDir === -1 ? "-16px" : "16px") + '">' +
        '<div class="onb-eyebrow">' + eyebrow + '</div>' +
        '<div class="onb-icon"><i data-lucide="' + step.icon + '"></i></div>' +
        '<h2 class="onb-title">' + step.title + '</h2>' +
        '<div class="onb-body">' + lead + step.bodyHTML + '</div>' +
      '</div>' +
      '<div class="onb-dots">' + dotsHTML + '</div>' +
      '<div class="onb-actions">' +
        '<button type="button" class="onb-skip"' + (isLast ? ' style="visibility:hidden"' : "") + '>Saltar</button>' +
        '<div class="onb-nav">' +
          (isFirst ? "" : '<button type="button" class="onb-prev">← Atrás</button>') +
          (step.requiresAction ? "" :
            '<button type="button" class="onb-next">' + (isLast ? "Empezar" : "Siguiente →") + '</button>') +
        '</div>' +
      '</div>';

    if (window.lucide) window.lucide.createIcons({ nodes: [box] });

    const nextBtn  = box.querySelector(".onb-next");
    const prevBtn  = box.querySelector(".onb-prev");
    const skipBtn  = box.querySelector(".onb-skip");
    const tryBtn   = box.querySelector("#onb-try-btn");

    if (step.typeDemo) {
      typeTimer = _runTypeDemo(box, step.typeDemo, function () {
        if (tryBtn) tryBtn.hidden = false;
      });
    }

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

    // Paso interactivo: abre la captura rápida DE VERDAD. El onboarding se
    // oculta mientras tanto (no se cierra — conserva el paso en el que iba)
    // y solo avanza si de verdad se creó una tarea, no con cualquier cierre.
    if (tryBtn) tryBtn.addEventListener("click", function () {
      if (typeof window.openQuickCapture !== "function") return;
      _burst(tryBtn);
      overlay.style.display = "none";
      let created = false;
      window.openQuickCapture({
        // El onboarding arranca en Hoy (vista por defecto de la app): sin
        // fecha, la tarea de prueba cae en el Inbox pero la vista se queda
        // en Hoy, que sigue vacía — el usuario no ve lo que acaba de crear.
        // redirectToInbox lleva a donde de verdad aterrizó la tarea.
        redirectToInbox: true,
        onTaskCreated: function () { created = true; },
        onClose: function () {
          overlay.style.display = "";
          if (created) {
            // En escritorio este paso nunca es el último (sigue "Atajos
            // esenciales"), pero en móvil ese paso no existe — sin esta
            // comprobación currentStep++ apuntaba a un paso inexistente
            // (activeSteps[2] === undefined) y el render reventaba, dejando
            // el tutorial colgado a medias en vez de cerrarse.
            if (isLast) { finish(); }
            else { currentStep++; lastDir = 1; render(); }
          }
          // Si se cerró sin crear nada, se queda tal cual en este paso —
          // el botón "Ahora tú" sigue ahí para intentarlo de nuevo.
        },
      });
    });

    // Focus en el botón principal para navegación con teclado.
    setTimeout(function () {
      const focusTarget = nextBtn || tryBtn;
      if (focusTarget) focusTarget.focus();
    }, 40);
  }

  overlay._cancel = finish;

  // Teclas: → siguiente, ← atrás, Esc cierra
  function onKey(e) {
    if (e.key === "Escape") { finish(); cleanup(); }
    if (e.key === "ArrowRight" || e.key === "Enter") {
      const btn = box.querySelector(".onb-next") || box.querySelector("#onb-try-btn");
      if (btn && !btn.hidden) btn.click();
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
