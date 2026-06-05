// Sustituye los emojis nativos por SVG de OpenMoji (estilo color, line-art),
// coherentes en todos los sistemas y a juego con los iconos Lucide.
//
// Los SVG están self-hosted en /emoji/{CODE}.svg (ver scripts/fetch-openmoji.mjs).
// Solo se sustituyen los emojis para los que tenemos SVG; el resto queda nativo.
//
// Estrategia tipo Twemoji: un parser recorre los nodos de texto del DOM y
// reemplaza cada emoji por <img>. Un MutationObserver lo aplica a todo lo que
// se renderiza dinámicamente, sin tener que tocar los +200 puntos de pintado.

import { OPENMOJI_MAP } from "./openmoji-map.js";

const BASE = "/emoji/";

// Mapa normalizado (sin selector de variación FE0F) -> code, para tolerar que
// el mismo emoji aparezca con o sin FE0F entre el código fuente y el DOM.
const STRIPPED = new Map();
for (const [seq, code] of Object.entries(OPENMOJI_MAP)) {
  STRIPPED.set(seq.replace(/️/g, ""), code);
}

// Detecta secuencias emoji: pictográfico + FE0F + tono de piel + cadenas ZWJ.
const EMOJI_RE =
  /\p{Extended_Pictographic}️?[\u{1F3FB}-\u{1F3FF}]?(?:‍\p{Extended_Pictographic}️?)*/gu;

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "TEXTAREA", "CODE", "PRE"]);

function lookup(seq) {
  return STRIPPED.get(seq.replace(/️/g, "")) || null;
}

function makeImg(seq, code) {
  const img = document.createElement("img");
  img.className = "openmoji";
  img.src = BASE + code + ".svg";
  img.alt = seq;
  img.setAttribute("draggable", "false");
  img.setAttribute("aria-hidden", "true");
  // Si por lo que sea falta el SVG, recupera el emoji nativo.
  img.addEventListener("error", function () {
    img.replaceWith(document.createTextNode(seq));
  }, { once: true });
  return img;
}

function processTextNode(node) {
  const text = node.nodeValue;
  if (!text || !/\p{Extended_Pictographic}/u.test(text)) return;

  EMOJI_RE.lastIndex = 0;
  let m, last = 0, replaced = false;
  const frag = document.createDocumentFragment();

  while ((m = EMOJI_RE.exec(text))) {
    const seq = m[0];
    const code = lookup(seq);
    if (!code) continue; // emoji sin SVG: se queda nativo dentro del texto
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    frag.appendChild(makeImg(seq, code));
    last = m.index + seq.length;
    replaced = true;
  }

  if (!replaced) return;
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  node.parentNode.replaceChild(frag, node);
}

function processSubtree(root) {
  if (root.nodeType === Node.TEXT_NODE) { processTextNode(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  if (SKIP_TAGS.has(root.tagName) || root.isContentEditable) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const p = n.parentNode;
      if (p && (SKIP_TAGS.has(p.tagName) || p.isContentEditable)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(processTextNode);
}

let observer = null;

export function initOpenmoji() {
  if (observer) return; // ya inicializado

  const run = function () {
    const body = document.body;
    const opts = { childList: true, subtree: true, characterData: true };
    processSubtree(body);

    observer = new MutationObserver(function (mutations) {
      // Nos desconectamos mientras escribimos para no observar nuestras propias
      // sustituciones (evita reprocesar en bucle).
      observer.disconnect();
      for (const mut of mutations) {
        if (mut.type === "characterData") processTextNode(mut.target);
        else mut.addedNodes.forEach(processSubtree);
      }
      observer.observe(body, opts);
    });

    observer.observe(body, opts);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
}
