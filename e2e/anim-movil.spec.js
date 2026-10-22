// Animaciones propias del móvil: el conmutador Tareas/Hábitos de Hoy
// desliza su resaltado y hace entrar el contenido por ese lado. (El
// detalle de tarea ya no se abre en móvil: lo sustituye la hoja de tarea.)
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
