// Subtareas: con muchas se ven las 5 primeras y un «Mostrar N más» que
// despliega el resto (y «Mostrar menos» lo pliega). En el detalle de PC y
// en la hoja de tarea del móvil.
import { test, expect } from "@playwright/test";

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

async function carga(page, n) {
  await page.goto("/");
  await page.evaluate(([n, hoy]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack_swipe_hinted", "1");
    const subtasks = Array.from({ length: n }, (_, i) => ({ id: "s" + i, text: "Paso " + (i + 1), done: false }));
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "",
        tasks: [{ id: "a", text: "Mudanza", comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks }] },
    ]));
  }, [n, iso(0)]);
  await page.goto("/");
  await page.waitForTimeout(1000);
}

test("PC: con 9 subtareas se ven 5 y se despliegan las demás", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await carga(page, 9);
  await page.locator(".today-item", { hasText: "Mudanza" }).locator(".today-text").click();
  const filas = page.locator("#task-detail-subtasks .subtask-item");
  await expect(filas).toHaveCount(5);
  const btn = page.locator("#task-detail-subtasks .subtask-more-btn");
  await expect(btn).toHaveText("Mostrar 4 más");
  await btn.click();
  await expect(filas).toHaveCount(9);
  await expect(btn).toHaveText("Mostrar menos");
  await btn.click();
  await expect(filas).toHaveCount(5);
  expect(errores).toEqual([]);
});

test("PC: con 6 o menos no hay botón", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await carga(page, 6);
  await page.locator(".today-item", { hasText: "Mudanza" }).locator(".today-text").click();
  await expect(page.locator("#task-detail-subtasks .subtask-item")).toHaveCount(6);
  await expect(page.locator("#task-detail-subtasks .subtask-more-btn")).toHaveCount(0);
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("en la hoja también, y lo desplegado se mantiene al marcar una", async ({ page }) => {
    await carga(page, 8);
    await page.locator(".today-item", { hasText: "Mudanza" }).locator(".today-text").tap();
    const filas = page.locator(".hoja-subtareas .subtask-item");
    await expect(filas).toHaveCount(5);
    await page.locator(".hoja-subtareas .subtask-more-btn").tap();
    await expect(filas).toHaveCount(8);
    await page.locator(".hoja-subtareas .subtask-item", { hasText: "Paso 7" }).locator(".subtask-checkbox").check({ force: true });
    await expect(filas).toHaveCount(8);
    await expect(page.locator(".hoja-tarea-subtareas .hoja-tarea-rotulo")).toHaveText("Subtareas · 1/8");
  });
});
