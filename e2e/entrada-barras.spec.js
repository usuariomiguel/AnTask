// Entrada de las barras flotantes tras el escalonado de las filas: la de
// captura en escritorio (al cambiar de vista, sin descentrarse) y en móvil
// la de navegación y el + (solo al abrir la app).
import { test, expect } from "@playwright/test";
const datos = () => {
  localStorage.clear();
  localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
  const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
  localStorage.setItem("anso-projects", JSON.stringify([
    { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("i1", "Una"), T("i2", "Dos")] },
    { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: Array.from({ length: 12 }, (_, i) => T("t" + i, "Tarea " + (i + 1))) }]));
};
const anims = (page, sel) => page.evaluate((sel) => { const el = document.querySelector(sel); return el ? el.getAnimations().map((a) => Math.round(a.effect.getTiming().delay)) : null; }, sel);

test("escritorio: la barra de captura entra tras las filas, y solo al cambiar de vista", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/"); await page.evaluate(datos); await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.waitForTimeout(700);
  await page.click("li[data-project-id='p1']");
  const filas = await page.evaluate(() => Math.max(...[...document.querySelectorAll("#task-list .task-item")].flatMap((el) => el.getAnimations().map((a) => a.effect.getTiming().delay))));
  const barra = await anims(page, "#capture-bar");
  const centrada = await page.evaluate(() => { const r = document.getElementById("capture-bar").getBoundingClientRect(); const p = document.getElementById("capture-bar").offsetParent.getBoundingClientRect(); return Math.round((r.left + r.width / 2) - (p.left + p.width / 2)); });
  expect(barra.length).toBe(1);
  expect(barra[0]).toBeGreaterThanOrEqual(filas);
  expect(Math.abs(centrada)).toBeLessThan(2);
  await page.waitForTimeout(600);
  await page.locator(".task-item").nth(1).locator(".task-toggle").click();
  expect((await anims(page, "#capture-bar")).length).toBe(0);
  expect(errores).toEqual([]);
});

test("móvil: la barra y el + entran al abrir, no al cambiar de pantalla", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(datos);
  // Se registra cada animación que se lanza sobre las barras desde el
  // arranque: mirar en un instante fijo fallaba con la máquina cargada,
  // porque la animación ya había terminado.
  await page.addInitScript(() => {
    window.__animadas = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      if (this.id === "mobile-bottom-nav" || this.id === "mobile-fab") window.__animadas.push(this.id);
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  await page.waitForSelector("#mobile-bottom-nav", { timeout: 15000 });
  await page.waitForTimeout(800);
  const alAbrir = await page.evaluate(() => window.__animadas.slice());
  expect(alAbrir).toContain("mobile-bottom-nav");
  expect(alAbrir).toContain("mobile-fab");
  await page.click("#bnav-inbox-btn");
  await page.waitForTimeout(600);
  const despues = await page.evaluate(() => window.__animadas.slice());
  expect(despues.filter((id) => id === "mobile-bottom-nav").length).toBe(1);
});
