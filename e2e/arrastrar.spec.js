// @ts-check
// Arrastrar tareas: desde el Inbox también se sueltan en listas las tareas
// de otras listas que enseña, pero solo se reordena entre las de la lista abierta.
import { test, expect } from "@playwright/test";
test.setTimeout(120000);
async function carga(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Suelta")] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("t1", "Informe"), T("t2", "Correo"), T("t3", "Llamada")] },
      { id: "p2", name: "Casa", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#3d8fb0", tasks: [] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15000 });
}
const estado = (page) => page.evaluate(() => Object.fromEntries(JSON.parse(localStorage.getItem("anso-projects")).map(p => [p.id, p.tasks.map(t => t.id).join(",")])));

test("desde Inbox: tarea de otra lista a una lista", async ({ page }) => {
  await carga(page);
  await page.click(".project-item-inbox"); await page.waitForTimeout(600);
  await page.locator(".task-item", { hasText: "Informe" }).dragTo(page.locator("li[data-project-id='p2']"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a", p1: "t2,t3", p2: "t1" });
  // a su propia lista: no hace nada
  await page.locator(".task-item", { hasText: "Correo" }).dragTo(page.locator("li[data-project-id='p1']"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a", p1: "t2,t3", p2: "t1" });
  // al Inbox fijado: pasa a vivir en el Inbox
  await page.locator(".task-item", { hasText: "Correo" }).dragTo(page.locator(".project-item-inbox"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a,t2", p1: "t3", p2: "t1" });
  // la tarea del propio Inbox también
  await page.locator(".task-item", { hasText: "Suelta" }).dragTo(page.locator("li[data-project-id='p1']"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "t2", p1: "t3,a", p2: "t1" });
});

test("reordenar: sí dentro de la lista, no con tareas ajenas en el Inbox", async ({ page }) => {
  await carga(page);
  await page.click("li[data-project-id='p1']"); await page.waitForTimeout(600);
  const llamada = page.locator(".task-item", { hasText: "Llamada" });
  const informe = page.locator(".task-item", { hasText: "Informe" });
  await llamada.dragTo(informe, { targetPosition: { x: 40, y: 4 } });
  await page.waitForTimeout(300);
  expect((await estado(page)).p1).toBe("t3,t1,t2");
  await page.click(".project-item-inbox"); await page.waitForTimeout(600);
  await page.locator(".task-item", { hasText: "Correo" }).dragTo(page.locator(".task-item", { hasText: "Suelta" }), { targetPosition: { x: 40, y: 4 } });
  await page.locator(".task-item", { hasText: "Suelta" }).dragTo(page.locator(".task-item", { hasText: "Correo" }), { targetPosition: { x: 40, y: 4 } });
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a", p1: "t3,t1,t2", p2: "" });
});
