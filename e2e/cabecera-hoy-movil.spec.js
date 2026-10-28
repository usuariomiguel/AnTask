// La cabecera de Hoy en móvil no repite la cuenta de hechas: el
// conmutador Tareas/Hábitos que va justo debajo ya la lleva en cada
// pestaña. El anillo y las vencidas sí se quedan — las vencidas no están
// en ninguna otra parte de la pantalla.
import { test, expect } from "@playwright/test";

const dia = (desplazamiento) => {
  const d = new Date(Date.now() + desplazamiento * 86400000);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

async function carga(page, ancho, tareas) {
  await page.setViewportSize({ width: ancho, height: ancho === 390 ? 780 : 900 });
  await page.goto("/");
  await page.evaluate(({ tareas }) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    localStorage.setItem("anso-projects", JSON.stringify([{
      id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z",
      sectionId: null, archived: false, icon: "", color: "", tasks: tareas,
    }]));
  }, { tareas });
  await page.goto("/");
  if (ancho === 390) await page.click("#bnav-today-btn");
  else await page.click(".project-item-today");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(500);
}

const T = (id, text, dueDate, done) => ({
  id, text, comment: "", done: !!done, priority: null, dueDate,
  recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [],
});

const PARA_HOY = [T("a", "Una", dia(0)), T("b", "Dos", dia(0), true)];

/**
 * Lo que no puede verse es la CUENTA, no un elemento concreto: comprobar
 * solo que `.hoy-stats-done` está oculto pasaba igual cuando ese
 * elemento ni siquiera existía. Y con `useInnerText`, porque
 * `textContent` incluye también lo que está en display:none.
 */
async function sinCuentaDeHechas(page) {
  await expect(page.locator(".hoy-header-extra"))
    .not.toContainText("hechas", { useInnerText: true });
}

test("en móvil la cabecera de Hoy no repite «N de M hechas»", async ({ page }) => {
  await carga(page, 390, PARA_HOY);

  await sinCuentaDeHechas(page);
  await expect(page.locator(".hoy-stats-done")).toBeHidden();
  // El anillo se queda: dice lo mismo sin palabras.
  await expect(page.locator(".hoy-ring")).toBeVisible();
  // Y la cuenta sigue estando a la vista, en la pestaña.
  await expect(page.locator(".hoy-tabs")).toContainText("1/2");
});

test("sin vencidas, el bloque de stats no deja hueco al lado del anillo", async ({ page }) => {
  await carga(page, 390, PARA_HOY);

  await expect(page.locator(".hoy-stats")).toBeHidden();
  const ancho = await page.locator(".hoy-header-extra").evaluate((e) => e.getBoundingClientRect().width);
  const anillo = await page.locator(".hoy-ring").evaluate((e) => e.getBoundingClientRect().width);
  expect(ancho).toBeCloseTo(anillo, 0);
});

test("las vencidas sí siguen en la cabecera móvil", async ({ page }) => {
  await carga(page, 390, PARA_HOY.concat([T("c", "Vieja", dia(-1))]));

  await sinCuentaDeHechas(page);
  await expect(page.locator(".hoy-stats-overdue")).toBeVisible();
  await expect(page.locator(".hoy-stats-overdue")).toContainText("1");
});

test("en escritorio la cuenta sigue en la cabecera", async ({ page }) => {
  await carga(page, 1280, PARA_HOY);

  await expect(page.locator(".hoy-stats-done")).toBeVisible();
  await expect(page.locator(".hoy-stats-done")).toContainText("1");
  await expect(page.locator(".hoy-header-extra")).toContainText("hechas", { useInnerText: true });
  await expect(page.locator(".hoy-ring")).toBeVisible();
});
