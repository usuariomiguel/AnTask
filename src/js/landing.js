// @ts-check
// Entry point para la landing page comercial.
// - Importa las fuentes self-hosted (Vite las bundlea como .woff2)
// - Aplica reveal-on-scroll (IntersectionObserver)
// - Maneja toggle mensual/anual en pricing
// - Anima escritura del chip NL en hero
// - Toggle de navegación móvil

import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/jetbrains-mono/wght-italic.css";

// ─── Reveal on scroll ──────────────────────────────────────────────────
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  // Respeta prefers-reduced-motion: muestra todo de golpe.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    els.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
  );

  els.forEach((el) => io.observe(el));
}

// ─── Pricing billing toggle ───────────────────────────────────────────
function initBillingToggle() {
  const monthlyBtn = document.getElementById("billing-monthly");
  const annualBtn  = document.getElementById("billing-annual");
  const priceNum   = document.getElementById("pro-price-num");
  const priceSfx   = document.getElementById("pro-price-suffix");
  const priceSave  = document.getElementById("pro-price-save");

  if (!monthlyBtn || !annualBtn || !priceNum || !priceSfx) return;

  const setBilling = (mode) => {
    const annual = mode === "annual";
    monthlyBtn.classList.toggle("active", !annual);
    annualBtn.classList.toggle("active",  annual);
    monthlyBtn.setAttribute("aria-pressed", String(!annual));
    annualBtn.setAttribute("aria-pressed",  String(annual));
    priceNum.textContent = annual ? "2,92" : "3,99";
    priceSfx.textContent = annual ? "/mes · facturado anual" : "/mes";
    if (priceSave) priceSave.hidden = !annual;
  };

  monthlyBtn.addEventListener("click", () => setBilling("monthly"));
  annualBtn.addEventListener("click",  () => setBilling("annual"));
}

// ─── NL chip typing animation ─────────────────────────────────────────
const NL_FULL = "Pagar gym cada mes p1 #facturas";
const NL_PATTERNS = [
  { re: /\bcada mes\b/, cls: "token-pink" },
  { re: /\bp[123]\b/,   cls: "token-red" },
  { re: /#\w+/,         cls: "token-cyan" },
];

function highlightNL(text) {
  // Resalta tokens conocidos; el resto va plano. Devuelve HTML escapado.
  const parts = [];
  let rest = text;
  while (rest.length) {
    let earliest = null;
    for (const p of NL_PATTERNS) {
      const m = rest.match(p.re);
      if (m && (!earliest || m.index < earliest.index)) {
        earliest = { index: m.index, match: m[0], cls: p.cls };
      }
    }
    if (!earliest) { parts.push(escapeHtml(rest)); break; }
    if (earliest.index > 0) parts.push(escapeHtml(rest.slice(0, earliest.index)));
    parts.push(`<span class="${earliest.cls}">${escapeHtml(earliest.match)}</span>`);
    rest = rest.slice(earliest.index + earliest.match.length);
  }
  return parts.join("");
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

function initTypingChip() {
  const target = document.getElementById("nl-chip-text");
  if (!target) return;

  // Respeta prefers-reduced-motion: deja el texto completo sin animación.
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) {
    target.innerHTML = highlightNL(NL_FULL) + '<span class="caret"></span>';
    return;
  }

  let n = NL_FULL.length;
  let dir = -1; // empieza borrando
  let timer;

  const render = () => {
    const text = NL_FULL.slice(0, n);
    target.innerHTML = highlightNL(text) + '<span class="caret"></span>';
  };

  const tick = () => {
    n += dir;
    let delay;
    if (n <= 12) { dir = 1; delay = 600; }
    else if (n >= NL_FULL.length) { dir = -1; delay = 1800; }
    else { delay = 55 + Math.random() * 40; }
    render();
    timer = setTimeout(tick, delay);
  };

  // Comienza después de un breve delay para no competir con reveal-on-scroll.
  render();
  timer = setTimeout(tick, 1200);

  // Cleanup si la sección sale de viewport (ahorro de CPU).
  const chip = target.closest(".nl-chip");
  if (chip && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting && timer) {
          clearTimeout(timer);
          timer = null;
        } else if (e.isIntersecting && !timer) {
          timer = setTimeout(tick, 600);
        }
      });
    }, { threshold: 0 });
    io.observe(chip);
  }
}

// ─── Mobile nav toggle ─────────────────────────────────────────────────
function initMobileNav() {
  const btn = document.getElementById("nav-mobile-toggle");
  const links = document.getElementById("nav-links");
  if (!btn || !links) return;

  btn.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
    if (open) {
      links.style.display = "flex";
    } else {
      links.style.removeProperty("display");
    }
  });
}

// ─── Boot ──────────────────────────────────────────────────────────────
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}

function boot() {
  initReveal();
  initBillingToggle();
  initTypingChip();
  initMobileNav();
}
