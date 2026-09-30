// Animaciones propias del móvil: el detalle de tarea entra y sale desde la
// derecha como una pantalla nativa, y el conmutador Tareas/Hábitos de Hoy
// desliza su resaltado y hace entrar el contenido por ese lado.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function carga(page, modo) {
  await page.goto("/");
  await page.evaluate((modo) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", modo);
    localStorage.setItem("antrack_swipe_hinted", "1");
    const hoy = new Date().toISOString().slice(0, 10);
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Revisar contrato"), T("b", "Pedir facturas")] }]));
    localStorage.setItem("antrack-habits", JSON.stringify([{ id: "h1", name: "Leer 20 minutos", schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - 5 * 864e5).toISOString(), archived: false, log: {} }]));
  }, modo);
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(600);
}

// Posición horizontal de un elemento fotograma a fotograma durante `ms`.
const recorrido = (page, sel, ms) => page.evaluate(([sel, ms]) => new Promise((res) => {
  const xs = [];
  const t0 = performance.now();
  (function paso() {
    const el = document.querySelector(sel);
    if (el) xs.push(Math.round(el.getBoundingClientRect().left));
    if (performance.now() - t0 < ms) requestAnimationFrame(paso); else res(xs);
  })();
}), [sel, ms]);

test("el detalle entra y sale desde la derecha", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page, "full");
  // En móvil tocar una tarea abre el panel rápido de fecha y repetir; al
  // detalle completo se llega manteniéndola pulsada en una lista → «Ver
  // detalles».
  await page.locator("#bnav-inbox-btn").tap();
  await page.waitForTimeout(500);
  // Mantener pulsado dispara «contextmenu» con la posición del dedo.
  await page.locator(".task-item", { hasText: "Revisar contrato" }).evaluate((el) => {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left + 120, clientY: r.top + r.height / 2 }));
  });
  await page.waitForTimeout(300);
  // Abrir: la pantalla pasa por posiciones intermedias entre fuera (x≥390) y 0.
  const entrada = recorrido(page, "#task-detail-wrap", 1400);
  await page.locator(".ctx-item", { hasText: "Ver detalles" }).tap();
  const xs = await entrada;
  expect(xs.some((x) => x > 30 && x < 360)).toBe(true);
  await expect(page.locator("#task-detail-title")).toHaveValue("Revisar contrato");
  expect(await page.evaluate(() => Math.round(document.getElementById("task-detail-wrap").getBoundingClientRect().left))).toBe(0);

  // Cerrar: sale hacia la derecha con su contenido todavía pintado.
  const salida = recorrido(page, "#task-detail-wrap", 1400);
  const conContenido = page.evaluate(() => new Promise((res) => {
    setTimeout(() => res(getComputedStyle(document.getElementById("task-detail-panel")).display), 120);
  }));
  await page.locator("#task-detail-back").tap();
  const ys = await salida;
  expect(ys.some((x) => x > 30 && x < 360)).toBe(true);
  expect(await conContenido).toBe("flex");
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById("task-detail-wrap")).visibility)).toBe("hidden");
  expect(errores).toEqual([]);
});

test("el resaltado del conmutador de Hoy se desliza", async ({ page }) => {
  await carga(page, "simple");
  const pos = () => page.evaluate(() => ({
    ind: Math.round(document.querySelector(".hoy-tabs-indicador").getBoundingClientRect().left),
    act: Math.round(document.querySelector(".hoy-tab--active").getBoundingClientRect().left),
  }));
  const inicio = await pos();
  expect(inicio.ind).toBe(inicio.act);
  const viaje = recorrido(page, ".hoy-tabs-indicador", 1200);
  await page.locator("[data-hoy-tab='habits']").tap();
  const xs = await viaje;
  const fin = await pos();
  expect(fin.ind).toBe(fin.act);
  expect(xs.some((x) => x > inicio.ind && x < fin.ind)).toBe(true);
  await expect(page.locator(".today-item--habit", { hasText: "Leer 20 minutos" })).toBeVisible();
});
