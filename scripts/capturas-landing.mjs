// Capturas de la landing (/inicio en español, /en en inglés), en claro y
// oscuro, con datos de demo. Necesita el servidor de desarrollo levantado:
//
//   npm run dev -- --port 5179
//   node scripts/capturas-landing.mjs            (o PORT=5173 node …)
//
// Escribe en public/landing/ (español) y public/landing/en/ (inglés), en
// webp. Mismos tamaños que espera la landing: Hoy a 1440×900, el móvil a
// 390×844 y los recortes de la captura rápida y del historial al tamaño
// de su ventana, todo @2x.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("../public/landing/", import.meta.url));
const URL_APP = "http://localhost:" + (process.env.PORT || 5179) + "/?app";
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

// ── Datos de demo, en los dos idiomas ──
function demo(lang) {
  const L = (es, en) => (lang === "en" ? en : es);
  let semilla = 11; const rnd = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
  const T = (id, text, extra = {}) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [], links: [], ...extra });
  const P = (id, name, color, tasks) => ({ id, name, createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color, tasks });
  const projects = [
    P("__inbox__", "Inbox", "", [
      T("i1", L("Pedir cita en el dentista", "Book dentist appointment"), { dueDate: iso(0) }),
      T("i2", L("Contestar a Laura lo del finde", "Reply to Laura about the weekend")),
      T("i3", L("Renovar el pasaporte", "Renew passport"), { dueDate: iso(3) }),
    ]),
    P("p1", L("Trabajo", "Work"), "#b0473f", [
      T("w1", L("Preparar la revisión del trimestre", "Prepare Q4 roadmap review"), { dueDate: iso(0), priority: "high", reminderAt: iso(0) + "T16:00",
        comment: L("Centrarse en las tres apuestas del próximo trimestre y en lo que dejamos.", "Focus on the three bets for next quarter and what we are dropping."),
        subtasks: [
          { id: "s1", text: L("Sacar las métricas", "Collect metrics from analytics"), done: true },
          { id: "s2", text: L("Hacer las diapositivas", "Draft the slides"), done: true },
          { id: "s3", text: L("Repasarlo con Marta", "Review with Marta"), done: false },
          { id: "s4", text: L("Enviarlo al equipo", "Send to the team"), done: false },
        ] }),
      T("w2", L("Enviar la factura al cliente", "Send invoice to client"), { dueDate: iso(-1) }),
      T("w3", L("Notas de la reunión semanal", "Weekly team sync notes"), { dueDate: iso(0), recurDays: 7 }),
      T("w4", L("Actualizar la guía de bienvenida", "Update onboarding docs"), { dueDate: iso(2) }),
    ]),
    P("p2", L("Casa", "Home"), "#5f7a3a", [
      T("h1", L("Regar las plantas", "Water the plants"), { dueDate: iso(0), recurDays: 2 }),
      T("h2", L("Compra de la semana", "Groceries for the week"), { dueDate: iso(1) }),
      T("h3", L("Arreglar la luz del baño", "Fix the bathroom light"), { done: true }),
    ]),
    P("p3", L("Proyecto personal", "Side project"), "#3f6fb0", [
      T("x1", L("Escribir el post del lanzamiento", "Write the launch post"), { dueDate: iso(0) }),
      T("x2", L("Grabar una demo de 30 segundos", "Record a 30-second demo"), { dueDate: iso(1) }),
    ]),
  ];
  const logs = [{}, {}, {}, {}];
  for (let i = 1; i < 330; i++) {
    if (rnd() < 0.86) logs[0][iso(-i)] = 1;
    if (i < 240 && rnd() < 0.7) logs[1][iso(-i)] = 1;
    if (i < 200 && i % 2 === 0 && rnd() < 0.8) logs[2][iso(-i)] = 1;
    if (i < 90 && rnd() < 0.75) logs[3][iso(-i)] = 1;
  }
  logs[0][iso(0)] = 1; logs[3][iso(0)] = 1;
  const H = (id, name, dias, log, extra = {}) => ({ id, name, schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - dias * 864e5).toISOString(), archived: false, log, ...extra });
  const habits = [
    H("ha1", L("Leer 20 minutos", "Read 20 minutes"), 330, logs[0]),
    H("ha2", L("Meditar", "Meditate"), 240, logs[1]),
    H("ha3", L("Correr", "Run"), 200, logs[2], { schedule: "everyN", everyNDays: 2 }),
    H("ha4", L("Beber 2 litros de agua", "Drink 2L of water"), 90, logs[3]),
  ];
  return { projects, habits, captura: L("Llamar a Ana mañana p1 #Trabajo", "Call Ana tomorrow p1 #Work"), tarea: L("Preparar la revisión", "Prepare Q4") };
}

const b = await chromium.launch();

async function pagina(lang, tema, opts) {
  const d = demo(lang);
  const p = await b.newPage({ deviceScaleFactor: 2, ...opts });
  const errores = []; p.on("pageerror", (e) => errores.push(e.message));
  await p.addInitScript(([d, lang, tema]) => {
    if (sessionStorage.getItem("s")) return; sessionStorage.setItem("s", "1"); localStorage.clear();
    localStorage.setItem("anso-projects", JSON.stringify(d.projects));
    localStorage.setItem("antrack-habits", JSON.stringify(d.habits));
    localStorage.setItem("antrack-profile", JSON.stringify({ name: "Alex", avatarSeed: "demo-9" }));
    localStorage.setItem("mis-tareas-theme", tema);
    localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", lang);
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack_swipe_hinted", "1");
  }, [d, lang, tema]);
  await p.goto(URL_APP); await p.waitForTimeout(1500);
  p._d = d; p._errores = errores;
  return p;
}

// PNG → webp con el propio navegador (sin dependencias de imagen).
async function guardar(png, ruta) {
  const q = await b.newPage();
  const webp = await q.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/webp", 0.86).split(",")[1];
  }, "data:image/png;base64," + png.toString("base64"));
  await q.close();
  fs.writeFileSync(ruta, Buffer.from(webp, "base64"));
}

// Solo la ventana, con las esquinas transparentes.
async function recorte(p, selector) {
  await p.addStyleTag({ content: "html,body{background:transparent!important} .modal-overlay{background:transparent!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important} body>*:not(.modal-overlay){visibility:hidden!important}" });
  await p.waitForTimeout(600);
  // Con un margen: el borde de la ventana cae justo en el límite de la caja
  // y el recorte exacto se lo comía.
  const r = await p.locator(selector).first().boundingBox();
  const m = 3;
  return p.screenshot({ omitBackground: true, clip: { x: r.x - m, y: r.y - m, width: r.width + 2 * m, height: r.height + 2 * m } });
}

const PC = { viewport: { width: 1440, height: 900 } };
const MOVIL = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

for (const lang of ["es", "en"]) {
  const dir = lang === "es" ? RAIZ : RAIZ + "en/";
  fs.mkdirSync(dir, { recursive: true });
  for (const [tema, sufijo] of [["light", "claro"], ["dark", "oscuro"]]) {
    // Hoy en el ordenador, con el detalle de una tarea abierto
    { const p = await pagina(lang, tema, PC);
      await p.locator(".today-item", { hasText: p._d.tarea }).locator(".today-text").first().click();
      await p.waitForTimeout(800);
      await guardar(await p.screenshot(), dir + "hoy-" + sufijo + ".webp");
      console.log(lang, sufijo, "hoy", p._errores); await p.close(); }

    // Captura rápida
    { const p = await pagina(lang, tema, PC);
      await p.keyboard.press("Control+Shift+Space"); await p.waitForTimeout(500);
      await p.keyboard.type(p._d.captura, { delay: 15 });
      await p.waitForTimeout(500);
      await guardar(await recorte(p, ".modal-box-quick"), dir + "captura-" + sufijo + ".webp");
      console.log(lang, sufijo, "captura", p._errores); await p.close(); }

    // Historial de hábitos
    // Ventana alta: así cabe entero, sin scroll ni el botón de cerrar asomando.
    { const p = await pagina(lang, tema, { viewport: { width: 1440, height: 1500 } });
      await p.locator(".project-item-habits").click(); await p.waitForTimeout(500);
      await p.locator(".today-item--habit").first().locator(".today-text").click(); await p.waitForTimeout(500);
      await p.locator(".habit-detail-hist-btn").click(); await p.waitForTimeout(400);
      await p.locator('.hist-range-btn[data-rango="30"]').click(); await p.waitForTimeout(400);
      await guardar(await recorte(p, ".hist-modal"), dir + "habitos-" + sufijo + ".webp");
      console.log(lang, sufijo, "habitos", p._errores); await p.close(); }

    // Móvil
    { const p = await pagina(lang, tema, MOVIL);
      await guardar(await p.screenshot(), dir + "movil-" + sufijo + ".webp");
      console.log(lang, sufijo, "movil", p._errores); await p.close(); }
  }
}
// ── Imagen para compartir el enlace (Open Graph), 1200×630 ──
// Se monta sobre la propia landing para tener sus fuentes y colores.
const OG = {
  es: { h1: "Haz hoy.", h2: "Repite mañana.", sub: "Tareas y hábitos en un solo sitio.<br>Sin anuncios ni registro. Funciona offline.", sale: "og-image.jpg" },
  en: { h1: "Do it today.", h2: "Repeat tomorrow.", sub: "Tasks and habits in one place.<br>No ads, no sign-up. Works offline.", sale: "og-image-en.jpg" },
};
for (const lang of ["es", "en"]) {
  const t = OG[lang];
  const hoy = fs.readFileSync(RAIZ + (lang === "es" ? "" : "en/") + "hoy-claro.webp").toString("base64");
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.addInitScript(() => { try { localStorage.setItem("mis-tareas-theme", "light"); } catch (e) { /* */ } });
  await p.goto(URL_APP.replace("/?app", "/inicio/"));
  await p.evaluate(([t, hoy]) => {
    document.body.innerHTML =
      '<div style="position:fixed;inset:0;background:radial-gradient(circle at 30% 40%,#fbe9bd,#f1d38f);overflow:hidden">' +
        '<div style="position:absolute;left:72px;top:148px;display:flex;align-items:center;gap:18px">' +
          '<span style="width:64px;height:64px;border-radius:16px;background:#fbf3df;box-shadow:0 6px 16px rgba(80,55,10,.18);display:grid;place-items:center"><img src="/src/img/logo-mark-light.webp" style="width:42px;height:42px"></span>' +
          '<span style="font:700 36px/1 \'Bricolage Grotesque Variable\',sans-serif;color:#2a221a;letter-spacing:-.02em">AnTrack</span>' +
        '</div>' +
        '<div style="position:absolute;left:72px;top:250px;font:800 60px/1.04 \'Bricolage Grotesque Variable\',sans-serif;letter-spacing:-.035em;color:#2a221a">' +
          t.h1 + '<br><span style="color:#5f6b3a">' + t.h2 + '</span></div>' +
        '<p style="position:absolute;left:74px;top:426px;margin:0;font:400 23px/1.45 \'Inter Variable\',sans-serif;color:#5a4a36">' + t.sub + '</p>' +
        '<img src="data:image/webp;base64,' + hoy + '" style="position:absolute;left:680px;top:70px;width:900px;border-radius:20px;border:2px solid rgba(60,40,10,.12);box-shadow:0 24px 50px rgba(60,40,10,.25)">' +
      '</div>';
  }, [t, hoy]);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);
  fs.writeFileSync(fileURLToPath(new URL("../public/" + t.sale, import.meta.url)), await p.screenshot({ type: "jpeg", quality: 88 }));
  console.log("og", lang); await p.close();
}

await b.close();
