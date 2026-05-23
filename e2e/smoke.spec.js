// @ts-check
import { test, expect } from "@playwright/test";

/**
 * Limpia localStorage, navega a la app, abre Inbox y espera a que el
 * input sea usable. El task-input está oculto hasta que hay un proyecto activo.
 */
async function freshLoad(page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");

  // Espera a que la sidebar cargue (el splash tiene un fallback de 500ms).
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });

  // Activa el Inbox para que el panel de tareas (y el input) se muestren.
  await page.click(".project-item-inbox");

  // Ahora el input debe ser visible.
  await page.waitForSelector("#task-input", { state: "visible", timeout: 5_000 });
}

test("crear tarea en Inbox y que aparezca en la lista", async ({ page }) => {
  await freshLoad(page);

  await page.fill("#task-input", "Comprar leche");
  await page.press("#task-input", "Enter");

  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Comprar leche" })
  ).toBeVisible();
});

test("completar una tarea marca el checkbox", async ({ page }) => {
  await freshLoad(page);

  await page.fill("#task-input", "Tarea para completar");
  await page.press("#task-input", "Enter");

  const taskItem = page.locator("#task-list .task-item").filter({ hasText: "Tarea para completar" });
  await expect(taskItem).toBeVisible();

  await taskItem.locator(".task-toggle").click();
  await expect(taskItem.locator(".task-toggle")).toBeChecked();
});

test("las tareas persisten tras recargar la página", async ({ page }) => {
  await freshLoad(page);

  await page.fill("#task-input", "Tarea persistente");
  await page.press("#task-input", "Enter");

  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Tarea persistente" })
  ).toBeVisible();

  // Recarga sin borrar localStorage — verifica persistencia real.
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
  await page.click(".project-item-inbox");
  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Tarea persistente" })
  ).toBeVisible();
});

test("el parser NL acepta tokens de fecha y prioridad en el input", async ({ page }) => {
  await freshLoad(page);

  await page.fill("#task-input", "Informe urgente hoy p1");
  await expect(page.locator("#task-input")).toHaveValue("Informe urgente hoy p1");

  await page.press("#task-input", "Enter");

  // El texto limpio (sin tokens) debe aparecer en la lista.
  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Informe urgente" })
  ).toBeVisible();
});

test("crear múltiples tareas y verificar que todas aparecen", async ({ page }) => {
  await freshLoad(page);

  const tareas = ["Primera tarea", "Segunda tarea", "Tercera tarea"];
  for (const texto of tareas) {
    await page.fill("#task-input", texto);
    await page.press("#task-input", "Enter");
  }

  for (const texto of tareas) {
    await expect(
      page.locator("#task-list .task-item").filter({ hasText: texto })
    ).toBeVisible();
  }
});
