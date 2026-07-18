// @ts-check
import { test, expect } from "@playwright/test";

/**
 * Limpia localStorage, navega a la app y abre el Inbox. En escritorio
 * la creación de tareas va por la captura rápida (barra flotante
 * #capture-bar), como en el prototipo Tierra: el input superior solo
 * existe en móvil.
 */
async function freshLoad(page) {
  // La raíz "/" sirve la landing desde el split landing/app: la app vive en /app.html
  await page.goto("/app.html");
  await page.evaluate(() => {
    localStorage.clear();
    // Evita que el tour de onboarding y el banner de consentimiento
    // intercepten los clicks del test en un perfil recién limpiado.
    localStorage.setItem("antask-onboarded", "1");
    localStorage.setItem("antask_consent", "essential");
  });
  await page.goto("/app.html");

  // Espera a que la sidebar cargue (el splash tiene un fallback de 500ms).
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });

  // Activa el Inbox para que el panel de tareas se muestre.
  await page.click(".project-item-inbox");

  // La barra de captura flotante debe ser visible (escritorio).
  await page.waitForSelector("#capture-bar", { state: "visible", timeout: 5_000 });
}

/** Crea una tarea con la captura rápida y espera a que el modal cierre. */
async function addTask(page, text) {
  await page.click("#capture-bar");
  await page.waitForSelector(".quick-capture-input", { state: "visible", timeout: 5_000 });
  await page.fill(".quick-capture-input", text);
  await page.press(".quick-capture-input", "Enter");
  await expect(page.locator(".quick-capture-input")).toHaveCount(0);
}

test("crear tarea en Inbox y que aparezca en la lista", async ({ page }) => {
  await freshLoad(page);

  await addTask(page, "Comprar leche");

  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Comprar leche" })
  ).toBeVisible();
});

test("completar una tarea marca el checkbox", async ({ page }) => {
  await freshLoad(page);

  await addTask(page, "Tarea para completar");

  const taskItem = page.locator("#task-list .task-item").filter({ hasText: "Tarea para completar" });
  await expect(taskItem).toBeVisible();

  await taskItem.locator(".task-toggle").click();
  await expect(taskItem.locator(".task-toggle")).toBeChecked();
});

test("las tareas persisten tras recargar la página", async ({ page }) => {
  await freshLoad(page);

  await addTask(page, "Tarea persistente");

  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Tarea persistente" })
  ).toBeVisible();

  // Recarga sin borrar localStorage — verifica persistencia real.
  await page.goto("/app.html");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
  await page.click(".project-item-inbox");
  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Tarea persistente" })
  ).toBeVisible();
});

test("el parser NL acepta tokens de fecha y prioridad en la captura", async ({ page }) => {
  await freshLoad(page);

  await page.click("#capture-bar");
  await page.waitForSelector(".quick-capture-input", { state: "visible" });
  await page.fill(".quick-capture-input", "Informe urgente hoy p1");
  await expect(page.locator(".quick-capture-input")).toHaveValue("Informe urgente hoy p1");

  // La preview de chips NL debe reaccionar a los tokens.
  await expect(page.locator(".quick-capture-preview")).toBeVisible();

  await page.press(".quick-capture-input", "Enter");

  // El texto limpio (sin tokens) debe aparecer en la lista.
  await expect(
    page.locator("#task-list .task-item").filter({ hasText: "Informe urgente" })
  ).toBeVisible();
});

test("crear múltiples tareas y verificar que todas aparecen", async ({ page }) => {
  await freshLoad(page);

  const tareas = ["Primera tarea", "Segunda tarea", "Tercera tarea"];
  for (const texto of tareas) {
    await addTask(page, texto);
  }

  for (const texto of tareas) {
    await expect(
      page.locator("#task-list .task-item").filter({ hasText: texto })
    ).toBeVisible();
  }
});
