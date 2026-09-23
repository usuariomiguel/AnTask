// Al cambiar de vista el filtro se reinicia a «Todas»: antes el segmentado
// de escritorio se quedaba con «Pendientes» resaltado mientras la lista
// enseñaba todas las tareas.
import { test, expect } from "@playwright/test";
async function carga(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
    const T = (id, text, done) => ({ id, text, comment: "", done: !!done, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("i1", "Inbox pendiente"), T("i2", "Inbox hecha", true)] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("a", "Pendiente A"), T("b", "Hecha B", true)] }]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.waitForTimeout(500);
}
const marcado = (page) => page.evaluate(() => [...document.querySelectorAll("#filter-segments .filter-segment")].filter((b) => b.classList.contains("filter-opt--active")).map((b) => b.dataset.filter + ":" + b.getAttribute("aria-pressed")));

test("al cambiar de vista el filtro vuelve a «Todas» y así se marca", async ({ page }) => {
  await carga(page);
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(400);
  await page.click(".filter-segment[data-filter='pending']");
  await page.waitForTimeout(400);
  expect(await marcado(page)).toEqual(["pending:true"]);
  expect(await page.locator(".task-item").count()).toBe(1);

  // Cambiar de lista: filtro «Todas», marcado y aplicado
  await page.click(".project-item-inbox");
  await page.waitForTimeout(500);
  expect(await marcado(page)).toEqual(["all:true"]);
  // El Inbox enseña además las tareas de las otras listas: 2 suyas + 2 de Trabajo
  expect(await page.locator(".task-item").count()).toBe(4);

  // Y también al ir a Hoy y volver
  await page.click(".filter-segment[data-filter='done']");
  await page.waitForTimeout(400);
  await page.locator("#project-list .project-item", { hasText: "Hoy" }).first().click();
  await page.waitForTimeout(500);
  expect(await marcado(page)).toEqual(["all:true"]);
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(500);
  expect(await marcado(page)).toEqual(["all:true"]);
  expect(await page.locator(".task-item").count()).toBe(2);
});
