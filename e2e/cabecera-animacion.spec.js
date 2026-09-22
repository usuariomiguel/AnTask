// Animaciones de la cabecera: el título y el subtítulo entran al cambiar de
// vista; en Hoy, al completar una tarea el tramo del anillo se dibuja, el
// porcentaje cuenta y la cifra gira, y al llegar al 100 % el anillo late y
// entra «Todo hecho». El icono de tema gira al cambiar de tema.
import { test, expect } from "@playwright/test";

const hoy = new Date().toISOString().slice(0, 10);

async function carga(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  // Registro de cada animación lanzada, con la clase y la etiqueta del
  // elemento: comprobar en un instante fijo fallaba con la máquina cargada,
  // porque las animaciones cortas ya habían terminado.
  await page.addInitScript(() => {
    window.__animadas = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      window.__animadas.push(this.tagName.toLowerCase() + "|" + (this.getAttribute("class") || "") + "|" + (this.parentElement ? this.parentElement.className : ""));
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  await page.evaluate((hoy) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Una"), T("b", "Dos"), T("c", "Tres")] },
    ]));
  }, hoy);
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(800);
}
test("al completar: el tramo se dibuja, el porcentaje cuenta y la cifra gira", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  // Porcentajes vistos fotograma a fotograma durante el cambio.
  const cuenta = page.evaluate(() => new Promise((res) => {
    const vistos = new Set();
    const t0 = performance.now();
    (function paso() {
      const p = document.querySelector(".hoy-ring-pct");
      if (p) vistos.add(p.textContent);
      if (performance.now() - t0 < 700) requestAnimationFrame(paso); else res([...vistos]);
    })();
  }));
  await page.evaluate(() => { window.__animadas = []; });
  await page.locator(".today-item", { hasText: "Una" }).locator(".today-check").click();
  const vistos = await cuenta;
  const animadas = await page.evaluate(() => window.__animadas.slice());
  expect(animadas.some((a) => a.includes("hoy-ring-trazo"))).toBe(true);
  expect(animadas.some((a) => a.startsWith("strong|") && a.endsWith("hoy-stats"))).toBe(true);
  // Pasa por valores intermedios entre 0 % y 33 %.
  expect(vistos.some((v) => v !== "0%" && v !== "33%")).toBe(true);
  await page.waitForTimeout(300);
  await expect(page.locator(".hoy-ring-pct")).toHaveText("33%");
  expect(await page.locator(".hoy-ring-trazo").count()).toBe(0);
  expect(errores).toEqual([]);
});

test("al llegar al 100 %: el anillo late y entra «Todo hecho»", async ({ page }) => {
  await carga(page);
  for (const t of ["Una", "Dos"]) {
    await page.locator(".today-item", { hasText: t }).locator(".today-check").click();
    await page.waitForTimeout(500);
  }
  await page.evaluate(() => { window.__animadas = []; });
  await page.locator(".today-item", { hasText: "Tres" }).locator(".today-check").click();
  await page.waitForTimeout(350);
  expect(await page.evaluate(() => window.__animadas.some((a) => a.split("|")[1] === "hoy-ring"))).toBe(true);
  await expect(page.locator("#project-subtitle .subtitle-hecho")).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.locator(".hoy-ring-pct")).toHaveText("100%");
});

test("el título entra al cambiar de vista y el icono de tema gira", async ({ page }) => {
  await carga(page);
  const titulo = () => page.evaluate(() => window.__animadas.filter((a) => a.startsWith("h2|project-title")).length);
  await page.evaluate(() => { window.__animadas = []; });
  await page.click(".project-item-inbox");
  await page.waitForTimeout(300);
  expect(await titulo()).toBe(1);
  // Pulsar un filtro no vuelve a hacer entrar el título.
  await page.click(".filter-segment[data-filter='pending']");
  await page.waitForTimeout(300);
  expect(await titulo()).toBe(1);
  // Icono de tema: transición de giro y fundido (ya existía).
  await page.click("#theme-toggle-btn");
  await page.waitForTimeout(60);
  const gira = await page.evaluate(() => [...document.querySelectorAll(".theme-toggle-ico")]
    .some((el) => el.getAnimations().some((a) => a instanceof CSSTransition && a.transitionProperty === "transform")));
  expect(gira).toBe(true);
});
