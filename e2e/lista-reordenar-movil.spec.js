// @ts-check
// Reordenar en el Inbox y las listas del móvil con el mismo gesto que en Hoy:
// mantener pulsado, la fila se levanta y las demás se apartan. Solo entre
// tareas de la misma lista; el orden se guarda y sobrevive al recargar.
import { test, expect } from "@playwright/test";

const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function preparar(page, modo) {
  await page.goto("/?app");
  await page.evaluate(([projects, modo]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack_swipe_hinted", "1");
    localStorage.setItem("antrack-mode", modo);
    localStorage.setItem("anso-projects", JSON.stringify(projects));
  }, [[
    { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Uno"), T("b", "Dos"), T("c", "Tres")] },
    { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("d", "Cuatro"), T("e", "Cinco")] },
  ], modo]);
  await page.goto("/?app");
  await page.waitForTimeout(800);
  await page.locator("#bnav-inbox-btn").tap();
  await page.waitForSelector(".task-item[data-task-id='a']", { timeout: 15000 });
  await page.waitForTimeout(700);
}

const textos = (page) => page.locator(".task-item .task-text").allInnerTexts();
const guardado = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects") || "[]").map((p) => p.tasks.map((t) => t.text)));

// Una sola sesión por página: con una nueva en cada toque se pierde el dedo.
const sesiones = new WeakMap();
async function toque(page, tipo, x, y) {
  if (!sesiones.has(page)) sesiones.set(page, await page.context().newCDPSession(page));
  await sesiones.get(page).send("Input.dispatchTouchEvent", { type: tipo, touchPoints: tipo === "touchEnd" ? [] : [{ x, y }] });
}

/** Mantiene pulsada la fila `desde` y la lleva hasta `hastaY`; devuelve el estado a medio camino. */
async function arrastrar(page, desde, hastaY) {
  const a = await page.locator(`.task-item[data-task-id='${desde}']`).boundingBox();
  const x = a.x + a.width * 0.55, y0 = a.y + a.height / 2;
  await toque(page, "touchStart", x, y0);
  await page.waitForTimeout(550);
  let medio = null;
  for (let i = 1; i <= 10; i++) {
    await toque(page, "touchMove", x, y0 + (hastaY - y0) * i / 10);
    if (i === 6) {
      await page.waitForTimeout(250);
      medio = await page.evaluate((id) => ({
        levantada: document.querySelector(`.task-item[data-task-id='${id}']`).classList.contains("hoy-fila--arrastrada"),
        apartadas: [...document.querySelectorAll(".task-item")].filter((el) => el.dataset.taskId !== id && el.style.transform).length,
      }), desde);
    }
  }
  await toque(page, "touchEnd", x, 0);
  return medio;
}

test("modo simple: se reordena como en Hoy y se guarda", async ({ page }) => {
  await preparar(page, "simple");
  expect(await textos(page)).toEqual(["Uno", "Dos", "Tres", "Cuatro", "Cinco"]);
  const c = await page.locator(".task-item[data-task-id='c']").boundingBox();
  const medio = await arrastrar(page, "a", c.y + c.height * 0.8);
  // A medio gesto: la fila va levantada y las de debajo se apartan.
  expect(medio.levantada).toBe(true);
  expect(medio.apartadas).toBeGreaterThan(0);
  await expect.poll(() => textos(page)).toEqual(["Dos", "Tres", "Uno", "Cuatro", "Cinco"]);
  expect(await guardado(page)).toEqual([["Dos", "Tres", "Uno"], ["Cuatro", "Cinco"]]);
  await page.waitForTimeout(400);
  await expect(page.locator(".hoja-tarea").filter({ visible: true })).toHaveCount(0);
  // Sin transform pegados tras soltar.
  expect(await page.evaluate(() => [...document.querySelectorAll(".task-item")].filter((el) => el.style.transform).length)).toBe(0);
  await page.reload();
  await page.waitForTimeout(800);
  await page.locator("#bnav-inbox-btn").tap();
  await expect.poll(() => textos(page)).toEqual(["Dos", "Tres", "Uno", "Cuatro", "Cinco"]);
});

test("no se mezcla con las tareas de otra lista", async ({ page }) => {
  await preparar(page, "simple");
  const e = await page.locator(".task-item[data-task-id='e']").boundingBox();
  await arrastrar(page, "a", e.y + e.height * 0.9);
  // Llega como mucho al final de las suyas.
  await expect.poll(() => guardado(page)).toEqual([["Dos", "Tres", "Uno"], ["Cuatro", "Cinco"]]);
});

test("modo completo: dentro de su grupo", async ({ page }) => {
  await preparar(page, "full");
  const e = await page.locator(".task-item[data-task-id='e']").boundingBox();
  const d = await page.locator(".task-item[data-task-id='d']").boundingBox();
  await arrastrar(page, "e", d.y + d.height * 0.2);
  await expect.poll(() => guardado(page)).toEqual([["Uno", "Dos", "Tres"], ["Cinco", "Cuatro"]]);
  expect(e).toBeTruthy();
});

test("mantener pulsado sin mover abre la hoja, como antes", async ({ page }) => {
  await preparar(page, "simple");
  const b = await page.locator(".task-item[data-task-id='b']").boundingBox();
  await toque(page, "touchStart", b.x + b.width * 0.55, b.y + b.height / 2);
  await page.waitForTimeout(700);
  await toque(page, "touchEnd", 0, 0);
  await page.waitForTimeout(500);
  await expect(page.locator(".hoja-tarea").first()).toBeVisible();
  expect(await guardado(page)).toEqual([["Uno", "Dos", "Tres"], ["Cuatro", "Cinco"]]);
});
