// Calendario de Hoy en móvil: título bien escrito, hoy distinguible del día
// elegido, puntos por estado (vencido / hecho), etiquetas para el lector de
// pantalla y botón «Hoy» al navegar fuera del periodo actual.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function carga(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    const T = (id, text, due, done) => ({ id, text, comment: "", done: !!done, priority: null, dueDate: due, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [
      T("a", "Hoy una", d(0)), T("b", "Hoy dos", d(0)),
      T("c", "Atrasada", d(-1)),
      T("e", "Hecha ayer", d(-2), true),
      T("f", "Mañana", d(1)),
    ] }]));
  });
  await page.goto("/");
  await page.waitForSelector("#hoy-cal-strip .hoy-cal-day", { timeout: 15000 });
  await page.waitForTimeout(500);
}
const iso = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

test("el título lleva una sola mayúscula y hoy se distingue del día elegido", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  // «Septiembre de 2026», no «Septiembre De 2026»
  const titulo = await page.locator(".hoy-cal-title").textContent();
  expect(titulo).not.toMatch(/\sDe\s/);
  expect(titulo).toMatch(/^[A-ZÁÉÍÓÚ]/);

  const hoyCelda = page.locator(`[data-cal-day="${iso(0)}"]`);
  await expect(hoyCelda).toHaveAttribute("aria-current", "date");
  // Al elegir otro día, hoy mantiene su anillo y el elegido se rellena
  await page.locator(`[data-cal-day="${iso(1)}"]`).click();
  await page.waitForTimeout(400);
  await expect(hoyCelda).toHaveClass(/hoy-cal-day--today/);
  await expect(page.locator(`[data-cal-day="${iso(1)}"]`)).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate((s) => getComputedStyle(document.querySelector(s + " .hoy-cal-day-num")).borderTopColor,
    `[data-cal-day="${iso(0)}"]`)).not.toBe("rgba(0, 0, 0, 0)");
  expect(errores).toEqual([]);
});

test("los puntos distinguen vencido y hecho, y el día se anuncia entero", async ({ page }) => {
  await carga(page);
  // Ayer: una pendiente vencida → punto rojo
  expect(await page.locator(`[data-cal-day="${iso(-1)}"] .hoy-cal-dot--vencido`).count()).toBe(1);
  // Anteayer: todo hecho → punto tenue
  expect(await page.locator(`[data-cal-day="${iso(-2)}"] .hoy-cal-dot--hecho`).count()).toBe(1);
  // Hoy: dos pendientes → dos puntos normales
  expect(await page.locator(`[data-cal-day="${iso(0)}"] .hoy-cal-dot:not(.hoy-cal-dot--off)`).count()).toBe(2);
  // Etiqueta completa para el lector de pantalla
  const etiqueta = await page.locator(`[data-cal-day="${iso(0)}"]`).getAttribute("aria-label");
  expect(etiqueta).toContain("Hoy");
  expect(etiqueta).toMatch(/pendientes|pendiente/);
});

test("el botón «Hoy» aparece al navegar y devuelve al periodo actual", async ({ page }) => {
  await carga(page);
  expect(await page.locator("[data-cal-today]").count()).toBe(0);
  await page.locator('[data-cal-step="1"]').click();
  await page.waitForTimeout(300);
  await expect(page.locator("[data-cal-today]")).toBeVisible();
  await page.locator("[data-cal-today]").click();
  await page.waitForTimeout(300);
  expect(await page.locator("[data-cal-today]").count()).toBe(0);
  await expect(page.locator(`[data-cal-day="${iso(0)}"]`)).toBeVisible();
});
