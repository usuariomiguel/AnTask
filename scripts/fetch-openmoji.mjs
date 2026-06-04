// Descarga los SVG de OpenMoji (estilo color) SOLO para los emojis que la app
// usa realmente, y los guarda en public/emoji/{CODE}.svg.
//
// Filosofía del proyecto: self-host total, sin requests externos en runtime.
// Este script se ejecuta UNA vez (o cuando se añadan emojis nuevos) en build/dev.
//
//   node scripts/fetch-openmoji.mjs
//
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
// Estilo: "black" (line-art monocromo, por defecto) o "color".
//   node scripts/fetch-openmoji.mjs color
const STYLE = process.argv[2] === "color" ? "color" : "black";
const OUT_DIR = join(ROOT, "public", "emoji");
const VERSION = "15.1.0";
const BASE = `https://cdn.jsdelivr.net/npm/openmoji@${VERSION}/${STYLE}/svg`;

// Detecta secuencias emoji (pictográfico + selector FE0F + tono de piel + ZWJ).
const EMOJI_RE =
  /\p{Extended_Pictographic}(\u{1F3FB}-\u{1F3FF})?(️)?(‍\p{Extended_Pictographic}(️)?)*/gu;

// Recolecta ficheros de texto donde buscar emojis (excluye tests y node_modules).
function collectFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "__tests__" || name === "dist") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) collectFiles(p, acc);
    else if (/\.(js|html)$/.test(name) && !name.endsWith(".test.js")) acc.push(p);
  }
  return acc;
}

const files = [
  ...collectFiles(join(ROOT, "src", "js")),
  join(ROOT, "index.html"),
].filter(existsSync);

const seqs = new Set();
for (const f of files) {
  const txt = readFileSync(f, "utf8");
  const m = txt.match(EMOJI_RE);
  if (m) for (const s of m) seqs.add(s);
}

// Engrosa el trazo de los SVG "black" (line-art) para que se vean más marcados.
const STROKE_FACTOR = 1.25;
function thicken(svg) {
  return svg.replace(/stroke-width="([0-9.]+)"/g, (_, w) => {
    return `stroke-width="${(parseFloat(w) * STROKE_FACTOR).toFixed(3)}"`;
  });
}

// Convierte una secuencia emoji al nombre de fichero OpenMoji (hex mayúsculas, '-').
function toCode(seq) {
  return [...seq].map((ch) => ch.codePointAt(0).toString(16).toUpperCase()).join("-");
}

mkdirSync(OUT_DIR, { recursive: true });

const manifest = {}; // emoji char -> code
let ok = 0, fail = [];

for (const seq of seqs) {
  // Candidatos: tal cual, y sin FE0F (OpenMoji a veces nombra sin el selector).
  const candidates = [toCode(seq)];
  const noFe0f = toCode(seq.replace(/️/g, ""));
  if (noFe0f !== candidates[0]) candidates.push(noFe0f);

  let saved = null;
  for (const code of candidates) {
    const dest = join(OUT_DIR, `${code}.svg`);
    try {
      const res = await fetch(`${BASE}/${code}.svg`);
      if (res.ok) {
        let body = await res.text();
        if (STYLE === "black") body = thicken(body);
        writeFileSync(dest, body, "utf8");
        saved = code;
        break;
      }
    } catch { /* siguiente candidato */ }
  }

  if (saved) { manifest[seq] = saved; ok++; }
  else fail.push(seq);
}

// Manifest JS para que el runtime mapee emoji -> code sin recalcular.
const manifestJs =
  "// AUTOGENERADO por scripts/fetch-openmoji.mjs — no editar a mano.\n" +
  "export const OPENMOJI_MAP = " + JSON.stringify(manifest, null, 2) + ";\n";
writeFileSync(join(ROOT, "src", "js", "utils", "openmoji-map.js"), manifestJs, "utf8");

console.log(`OpenMoji: ${ok} descargados, ${fail.length} sin SVG.`);
if (fail.length) console.log("Sin SVG (fallback nativo):", fail.join(" "));
