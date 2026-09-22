// Animaciones de los filtros: toque de pulsación en el elegido (el relleno
// cambia con un fundido CSS), «Otros» se abre animado y su texto cambia con
// fundido, el estado vacío entra una sola vez, y los filtros entran al
// cambiar de vista pero no al pulsar uno de ellos.
import { test, expect } from "@playwright/test";

async function carga(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("i1", "Una")] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("a", "Pendiente A"), T("b", "Pendiente B")] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.waitForTimeout(600);
}
// Animaciones en marcha sobre un elemento, sin contar las transiciones CSS
// (el fundido del fondo al cambiar de filtro no es una entrada).
const anima = (page, sel) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  return !!el && el.getAnimations().some((a) => a.playState === "running" && !(a instanceof CSSTransition));
}, sel);

test("filtros: pulsación, «Otros» animado y texto con fundido", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(600);

  // El relleno cambia con transición CSS y el elegido da el toque.
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".filter-segment")).transitionProperty)).toContain("background-color");
  await page.click(".filter-segment[data-filter='pending']");
  expect(await anima(page, ".filter-segment[data-filter='pending']")).toBe(true);
  // Pulsar un filtro no vuelve a hacer entrar a los demás.
  expect(await anima(page, ".filter-segment[data-filter='all']")).toBe(false);

  // «Otros»: el panel entra animado.
  await page.click("#filter-trigger-btn");
  expect(await anima(page, "#filter-panel")).toBe(true);
  await page.waitForTimeout(300);
  await page.locator("#filter-panel .filter-opt[data-filter='overdue']").click();
  expect(await anima(page, "#filter-trigger-label")).toBe(true);
  await expect(page.locator("#filter-trigger-label")).toHaveText("Vencidas");
  expect(errores).toEqual([]);
});

test("el estado vacío entra una vez y los filtros entran al cambiar de lista", async ({ page }) => {
  await carga(page);
  await page.click("li[data-project-id='p1']");
  // Al entrar en la lista, los filtros entran escalonados.
  expect(await anima(page, ".filter-segment[data-filter='done']")).toBe(true);
  await page.waitForTimeout(600);

  // «Hechas» sin tareas hechas: aparece el vacío, animado.
  await page.click(".filter-segment[data-filter='done']");
  await expect(page.locator(".empty-illustrated")).toBeVisible();
  expect(await anima(page, ".empty-illustrated")).toBe(true);
  await page.waitForTimeout(600);

  // Otro repintado con el mismo vacío en pantalla: no se repite.
  await page.evaluate(() => window.applyFilter("done"));
  expect(await anima(page, ".empty-illustrated")).toBe(false);
});
