// Entrada escalonada al abrir una lista: entran todas las filas visibles
// (antes solo 10, y en escritorio las últimas aparecían de golpe), el
// escalonado no pasa de 200ms y las de fuera de pantalla no se animan.
import { test, expect } from "@playwright/test";
for (const [ancho, alto] of [[1280, 900], [1920, 1080]]) test(`escalonado ${ancho}x${alto}`, async ({ page }) => {
  await page.setViewportSize({ width: ancho, height: alto });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: Array.from({ length: 40 }, (_, i) => T("t" + i, "Tarea " + (i + 1))) }]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.waitForTimeout(600);
  await page.click("li[data-project-id='p1']");
  const r = await page.evaluate(() => {
    const vista = document.querySelector(".task-list-scroll").getBoundingClientRect();
    const filas = [...document.querySelectorAll("#task-list .task-item")];
    const visibles = filas.filter((el) => { const b = el.getBoundingClientRect(); return b.bottom > vista.top && b.top < vista.bottom; });
    const animadas = visibles.filter((el) => el.getAnimations().length > 0);
    const retrasos = visibles.map((el) => el.getAnimations()[0] ? Math.round(el.getAnimations()[0].effect.getTiming().delay) : null);
    return { visibles: visibles.length, animadas: animadas.length, maxRetraso: Math.max(...retrasos.filter((x) => x !== null)), fuera: filas.length - visibles.length, fueraAnimadas: filas.filter((el) => !visibles.includes(el) && el.getAnimations().length).length };
  });
  expect(r.animadas).toBe(r.visibles);
  expect(r.maxRetraso).toBeLessThanOrEqual(200);
  expect(r.fueraAnimadas).toBe(0);
});
