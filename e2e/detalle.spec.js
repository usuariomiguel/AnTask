// @ts-check
// Panel de detalle de tarea: cada propiedad y sección sigue editándose y
// persistiendo tras el rediseño a "editor" (propiedades sin caja, subtareas
// como contenido, lista en una línea, nota como área de escritura).
import { test, expect } from "@playwright/test";

const T = (id, text, extra) => Object.assign({
  id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null,
  reminderAt: null, timeLogged: 0, log: {}, subtasks: [],
}, extra);

async function carga(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate((proyectos) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    localStorage.setItem("anso-projects", JSON.stringify(proyectos));
  }, [
    { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
    { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f",
      tasks: [T("a", "Licitación"), T("b", "Otra tarea")] },
    { id: "p2", name: "Casa", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#3d8fb0", tasks: [] },
  ]);
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15_000 });
  await page.click("li[data-project-id='p1']");
  await page.locator(".task-item", { hasText: "Licitación" }).locator(".task-text").click();
  await expect(page.locator("#task-detail-title")).toHaveValue("Licitación");
}

const guardada = (page, id) => page.evaluate((id) => {
  for (const p of JSON.parse(localStorage.getItem("anso-projects") || "[]")) {
    const t = p.tasks.find((x) => x.id === id);
    if (t) return Object.assign({ lista: p.id }, t);
  }
  return null;
}, id);

test("detalle: propiedades, subtareas, lista y nota se editan y persisten", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);

  // Prioridad
  await page.click("#task-detail-priority");
  expect((await guardada(page, "a")).priority).toBe("high");
  await expect(page.locator("#task-detail-priority")).toHaveClass(/active/);

  // Fecha: el mismo popover de siempre
  await page.click("#task-detail-date-btn");
  await page.locator(".field-popover [data-quick='today']").click();
  expect((await guardada(page, "a")).dueDate).toBe(await page.evaluate(() => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }));
  await expect(page.locator("#task-detail-date-text")).toHaveText("Hoy");

  // Repetir
  await page.click("#task-detail-recur-btn");
  await page.locator(".field-popover [data-days='1']").click();
  expect((await guardada(page, "a")).recurDays).toBe(1);

  // Recordatorio
  await page.click("#task-detail-reminder-btn");
  await page.locator(".field-popover [data-iso]").first().click();
  expect((await guardada(page, "a")).reminderAt).toBeTruthy();

  // Subtareas: crear dos, completar una, borrar otra; el título cuenta
  const campo = page.locator("#task-detail-subtask-input");
  await campo.fill("Primera");
  await campo.press("Enter");
  await campo.fill("Segunda");
  await campo.press("Enter");
  expect((await guardada(page, "a")).subtasks.length).toBe(2);
  await expect(page.locator("#task-detail-subtask-count")).toHaveText(" · 0/2");
  await page.locator("#task-detail-subtasks .subtask-checkbox").first().check();
  await expect(page.locator("#task-detail-subtask-count")).toHaveText(" · 1/2");
  await page.locator("#task-detail-subtasks .subtask-item").last().hover();
  await page.locator("#task-detail-subtasks .subtask-delete-btn").last().click();
  expect((await guardada(page, "a")).subtasks.length).toBe(1);

  // Nota
  await page.fill("#task-detail-comment", "Pedir presupuesto");
  await page.locator("#task-detail-title").click();
  await expect.poll(async () => (await guardada(page, "a")).comment).toBe("Pedir presupuesto");

  // Lista
  await page.click("#task-detail-project-btn");
  await page.locator(".field-popover [data-project-id='p2']").click();
  expect((await guardada(page, "a")).lista).toBe("p2");

  // Completar desde el panel
  await page.check("#task-detail-toggle");
  expect((await guardada(page, "a")).done).toBe(true);

  // Todo sigue ahí tras recargar
  await page.reload();
  await page.waitForSelector("li[data-project-id='p2']");
  const tras = await guardada(page, "a");
  expect({ p: tras.priority, r: tras.recurDays, n: tras.comment, l: tras.lista, d: tras.done, s: tras.subtasks.length })
    .toEqual({ p: "high", r: 1, n: "Pedir presupuesto", l: "p2", d: true, s: 1 });
  expect(errores).toEqual([]);
});

test("detalle: cerrar, abrir otra tarea y eliminar", async ({ page }) => {
  await carga(page);
  await page.click("#task-detail-close");
  await expect(page.locator("#task-detail-wrap")).not.toHaveClass(/task-detail-wrap--open/);

  await page.locator(".task-item", { hasText: "Licitación" }).locator(".task-text").click();
  await page.locator(".task-item", { hasText: "Otra tarea" }).locator(".task-text").click();
  await expect(page.locator("#task-detail-title")).toHaveValue("Otra tarea");

  await page.click("#task-detail-delete-btn");
  const confirmar = page.getByRole("button", { name: "Eliminar", exact: true }).last();
  if (await confirmar.isVisible().catch(() => false)) await confirmar.click();
  await expect.poll(() => guardada(page, "b")).toBeNull();
});
