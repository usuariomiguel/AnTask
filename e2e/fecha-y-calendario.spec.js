// Fecha personalizada y calendario de Hoy en móvil:
//  · el selector nativo escribe hoy al abrirse y dispara «change»; guardar
//    en ese primer cambio asignaba hoy sin dejar elegir;
//  · tocar el día de hoy en la tira vuelve a Hoy, no deja el modo día;
//  · el día elegido es cosa de la solapa de Tareas, no de Hábitos.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const iso = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

async function carga(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "simple");
    localStorage.setItem("antrack_swipe_hinted", "1");
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    const T = (id, text, due) => ({ id, text, comment: "", done: false, priority: null, dueDate: due, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "De hoy", d(0)), T("b", "Sin fecha", null)] }]));
    localStorage.setItem("antrack-habits", JSON.stringify([{ id: "h1", name: "Leer 20 minutos", schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - 10 * 864e5).toISOString(), archived: false, log: {} }]));
  });
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(600);
}
const due = (page, id) => page.evaluate((id) => (JSON.parse(localStorage.getItem("anso-projects"))[0].tasks.find((t) => t.id === id) || {}).dueDate, id);

test("la fecha personalizada no se asigna sola al abrir el selector", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  await page.locator(".today-item", { hasText: "Sin fecha" }).locator(".today-text").tap();
  await page.waitForTimeout(400);

  // Lo que hace el selector nativo del móvil al abrirse: escribe hoy y avisa.
  await page.evaluate((hoy) => {
    const input = document.querySelector("[data-date-input]");
    input.value = hoy;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, iso(0));
  await page.waitForTimeout(300);
  expect(await due(page, "b")).toBeNull();               // sigue sin fecha
  expect(await page.locator(".field-popover--fixed").count()).toBe(1);   // el panel sigue abierto

  // El usuario elige otro día y cierra el selector.
  await page.evaluate((otro) => {
    const input = document.querySelector("[data-date-input]");
    input.value = otro;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  }, iso(5));
  await page.waitForTimeout(500);
  expect(await due(page, "b")).toBe(iso(5));
  expect(errores).toEqual([]);
});

test("tocar hoy en la tira vuelve a Hoy y Hábitos no hereda el día elegido", async ({ page }) => {
  await carga(page);
  // Elegir otro día: aparece el modo día con su «Volver a hoy»
  await page.locator(`[data-cal-day="${iso(2)}"]`).tap();
  await page.waitForTimeout(400);
  await expect(page.locator(".hoy-section-action", { hasText: "Volver a hoy" })).toBeVisible();

  // Tocar HOY deja la vista como Hoy normal, sin «Volver a hoy»
  await page.locator(`[data-cal-day="${iso(0)}"]`).tap();
  await page.waitForTimeout(400);
  expect(await page.locator(".hoy-section-action", { hasText: "Volver a hoy" }).count()).toBe(0);
  await expect(page.locator(".today-item", { hasText: "De hoy" })).toBeVisible();

  // Con un día elegido, la solapa de Hábitos enseña los hábitos, no las
  // tareas de ese día.
  await page.locator(`[data-cal-day="${iso(2)}"]`).tap();
  await page.waitForTimeout(400);
  await page.locator("[data-hoy-tab='habits']").tap();
  await page.waitForTimeout(500);
  await expect(page.locator(".today-item--habit", { hasText: "Leer 20 minutos" })).toBeVisible();
  expect(await page.locator(".hoy-section-action", { hasText: "Volver a hoy" }).count()).toBe(0);
});
