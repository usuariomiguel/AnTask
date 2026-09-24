// En móvil, el botón de claro/oscuro vive en la cabecera, a la derecha del
// buscador (antes bajaba a la fila de filtros, que en modo simple ni se ve).
import { test, expect } from "@playwright/test";
const MODO = process.env.MODO || "simple";
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
test("toggle de tema junto al buscador", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate((modo) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", modo); localStorage.setItem("mis-tareas-theme", "light");
  }, MODO);
  await page.goto("/");
  await page.waitForSelector("#theme-toggle-btn", { timeout: 15000 });
  await page.waitForTimeout(700);
  const geo = await page.evaluate(() => {
    const s = document.getElementById("mobile-search-btn").getBoundingClientRect();
    const t = document.getElementById("theme-toggle-btn").getBoundingClientRect();
    const cs = (el) => { const c = getComputedStyle(el); return c.backgroundColor + " | " + c.borderTopColor + " | " + c.borderTopWidth; };
      return { buscar: [s.left, s.top, s.width, s.height].map(Math.round), tema: [t.left, t.top, t.width, t.height].map(Math.round) };
  });
  expect(geo.tema[0]).toBeGreaterThan(geo.buscar[0]);       // a la derecha
  expect(Math.abs(geo.tema[1] - geo.buscar[1])).toBeLessThan(3);  // misma línea
  expect(geo.tema[2]).toBe(geo.buscar[2]);                  // mismo tamaño
  await page.locator("#theme-toggle-btn").tap();
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  expect(errores).toEqual([]);
});
