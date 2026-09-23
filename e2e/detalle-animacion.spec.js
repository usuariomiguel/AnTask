// Animaciones del panel de detalle: el contenido entra en cascada al abrir
// y en la dirección del salto al cambiar de tarea; las subtareas se abren,
// se cierran y se barren al marcarlas; los campos dan un toque al estrenar
// valor; y la nota avisa de que se ha guardado sola.
import { test, expect } from "@playwright/test";

async function carga(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Registro de cada animación lanzada: comprobarlas en un instante fijo
  // falla con la máquina cargada, porque las cortas ya han terminado.
  await page.addInitScript(() => {
    window.__anim = [];
    const original = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const kf = args[0];
      window.__anim.push({
        tag: this.tagName.toLowerCase(),
        cls: this.getAttribute("class") || "",
        id: this.id || "",
        kf: JSON.stringify(kf),
      });
      return original.apply(this, args);
    };
  });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const T = (id, text, subtasks) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: subtasks || [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f",
        tasks: [
          T("a", "Primera", [{ id: "s1", text: "Paso uno", done: false }, { id: "s2", text: "Paso dos", done: false }]),
          T("b", "Segunda"),
          T("c", "Tercera"),
        ] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(700);
}
const anim = (page) => page.evaluate(() => window.__anim.slice());
const reset = (page) => page.evaluate(() => { window.__anim = []; });

test("el contenido entra en cascada al abrir y según el salto al cambiar", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  await reset(page);
  await page.locator(".task-item", { hasText: "Primera" }).locator(".task-text").click();
  await page.waitForTimeout(400);
  const bloques = (await anim(page)).filter((a) => a.cls.includes("task-detail-title-row") || a.cls.includes("task-detail-props") || a.cls.includes("task-detail-section"));
  expect(bloques.length).toBeGreaterThanOrEqual(3);

  // Cambiar a una tarea de más abajo: entra desde abajo (translate positivo).
  await reset(page);
  await page.locator(".task-item", { hasText: "Tercera" }).locator(".task-text").click();
  await page.waitForTimeout(400);
  const bajando = (await anim(page)).find((a) => a.cls.includes("task-detail-title-row"));
  expect(bajando.kf).toContain("0 10px");

  // Y al volver a una de más arriba, desde arriba.
  await reset(page);
  await page.locator(".task-item", { hasText: "Primera" }).locator(".task-text").click();
  await page.waitForTimeout(400);
  const subiendo = (await anim(page)).find((a) => a.cls.includes("task-detail-title-row"));
  expect(subiendo.kf).toContain("0 -10px");
  expect(errores).toEqual([]);
});

test("subtareas: alta, marcado y baja", async ({ page }) => {
  await carga(page);
  await page.locator(".task-item", { hasText: "Primera" }).locator(".task-text").click();
  await page.waitForTimeout(600);

  // Alta: la nueva se abre en altura
  await reset(page);
  await page.fill("#task-detail-subtask-input", "Paso tres");
  await page.press("#task-detail-subtask-input", "Enter");
  await page.waitForTimeout(300);
  expect((await anim(page)).some((a) => a.cls.includes("subtask-item") && a.kf.includes("height"))).toBe(true);
  await expect(page.locator(".subtask-item")).toHaveCount(3);

  // Marcado: barrido sobre el texto y contador que gira
  await reset(page);
  await page.locator(".subtask-item", { hasText: "Paso uno" }).locator(".subtask-checkbox").check();
  await page.waitForTimeout(150);
  expect(await page.locator(".subtask-text.sub-barrido").count()).toBe(1);
  expect((await anim(page)).some((a) => a.id === "task-detail-subtask-count")).toBe(true);
  await expect(page.locator("#task-detail-subtask-count")).toHaveText(" · 1/3");

  // Baja: la borrada cierra su hueco
  await reset(page);
  await page.locator(".subtask-item", { hasText: "Paso dos" }).locator(".subtask-delete-btn").click();
  await page.waitForTimeout(100);
  expect(await page.locator(".subtask-item.fila-saliendo").count()).toBe(1);
  await page.waitForTimeout(500);
  expect(await page.locator(".subtask-item.fila-saliendo").count()).toBe(0);
  await expect(page.locator(".subtask-item")).toHaveCount(2);
});

test("los campos dan un toque al estrenar valor y la nota avisa al guardarse", async ({ page }) => {
  await carga(page);
  await page.locator(".task-item", { hasText: "Segunda" }).locator(".task-text").click();
  await page.waitForTimeout(600);

  await reset(page);
  await page.click("#task-detail-date-btn");
  await page.locator(".field-popover [data-quick='tomorrow'], .field-popover-row", { hasText: "Mañana" }).first().click();
  await page.waitForTimeout(300);
  const toque = (await anim(page)).filter((a) => a.id === "task-detail-date-btn" || a.id === "task-detail-date-text");
  expect(toque.length).toBeGreaterThanOrEqual(1);

  // Nota: destello al guardarse sola
  await page.fill("#task-detail-comment", "Apuntes de la reunión");
  await page.waitForTimeout(700);
  expect(await page.locator("#task-detail-comment.nota-guardada").count()).toBe(1);
  await page.waitForTimeout(800);
  expect(await page.locator("#task-detail-comment.nota-guardada").count()).toBe(0);
});
