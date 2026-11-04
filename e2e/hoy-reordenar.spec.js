// @ts-check
// Reordenar dentro de una sección de Hoy: con el ratón, manteniendo pulsado
// en el móvil y con Alt + flechas. El orden se guarda y sobrevive al
// recargar; mantener pulsado sin mover sigue abriendo la hoja.
import { test, expect } from "@playwright/test";

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const T = (id, text, dueDate) => ({ id, text, comment: "", done: false, priority: null, dueDate, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
const H = (id, name) => ({ id, name, schedule: "daily", everyNDays: null, createdAt: "2026-01-01T00:00:00.000Z", archived: false, log: {} });

async function preparar(page) {
  await page.goto("/?app");
  await page.evaluate(([projects, habits]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack_swipe_hinted", "1");
    localStorage.setItem("anso-projects", JSON.stringify(projects));
    localStorage.setItem("antrack-habits", JSON.stringify(habits));
  }, [[
    { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Uno", iso(0)), T("b", "Dos", iso(0))] },
    { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("c", "Tres", iso(0)), T("d", "Cuatro", iso(0))] },
  ], [H("h1", "Leer"), H("h2", "Correr"), H("h3", "Meditar")]]);
  await page.goto("/?app");
  await page.waitForSelector(".hoy-section--today .today-item", { timeout: 15000 });
  await page.waitForTimeout(600);
}

const textosHoy = (page) => page.locator(".hoy-section--today .hoy-section-list > .today-item .today-text").allInnerTexts();
const textosHab = (page) => page.locator(".hoy-section--habits .hoy-section-list > .today-item .today-text").allInnerTexts();

test.describe("ordenador", () => {
  test.use({ viewport: { width: 1280, height: 860 } });

  test("arrastrar con el ratón reordena «Para hoy» y se guarda", async ({ page }) => {
    await preparar(page);
    expect(await textosHoy(page)).toEqual(["Uno", "Dos", "Tres", "Cuatro"]);
    const filas = page.locator(".hoy-section--today .hoy-section-list > .today-item");
    const a = await filas.nth(3).boundingBox();
    const b = await filas.nth(0).boundingBox();
    // Desde la zona del texto, no sobre la casilla.
    await page.mouse.move(a.x + a.width * 0.5, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width * 0.5, a.y + a.height / 2 - 10, { steps: 3 });
    await page.mouse.move(b.x + b.width * 0.5, b.y + 4, { steps: 12 });
    await page.mouse.up();
    await expect.poll(() => textosHoy(page)).toEqual(["Cuatro", "Uno", "Dos", "Tres"]);
    // No abre el detalle al soltar.
    await expect(page.locator("#task-detail-wrap")).not.toHaveClass(/task-detail-wrap--open/);
    await page.reload();
    await page.waitForSelector(".hoy-section--today .today-item");
    expect(await textosHoy(page)).toEqual(["Cuatro", "Uno", "Dos", "Tres"]);
  });

  test("un clic sin mover sigue abriendo el detalle", async ({ page }) => {
    await preparar(page);
    await page.locator(".hoy-section--today .today-item .today-text", { hasText: "Dos" }).click();
    await expect(page.locator("#task-detail-wrap")).toHaveClass(/task-detail-wrap--open/);
    expect(await textosHoy(page)).toEqual(["Uno", "Dos", "Tres", "Cuatro"]);
  });

  test("Alt + flechas mueve la fila enfocada; también los hábitos", async ({ page }) => {
    await preparar(page);
    await page.locator(".hoy-section--today .today-item", { hasText: "Uno" }).focus();
    await page.keyboard.press("Alt+ArrowDown");
    await expect.poll(() => textosHoy(page)).toEqual(["Dos", "Uno", "Tres", "Cuatro"]);
    await page.keyboard.press("Alt+ArrowDown");
    await expect.poll(() => textosHoy(page)).toEqual(["Dos", "Tres", "Uno", "Cuatro"]);

    expect(await textosHab(page)).toEqual(["Leer", "Correr", "Meditar"]);
    await page.locator(".hoy-section--habits .today-item", { hasText: "Meditar" }).focus();
    await page.keyboard.press("Alt+ArrowUp");
    await expect.poll(() => textosHab(page)).toEqual(["Leer", "Meditar", "Correr"]);
    const orden = await page.evaluate(() => JSON.parse(localStorage.getItem("antrack-habits")).map((h) => h.name));
    expect(orden).toEqual(["Leer", "Meditar", "Correr"]);
  });
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  // Una sola sesión por página: con una nueva en cada toque se pierde el dedo.
  const sesiones = new WeakMap();
  async function toque(page, tipo, x, y) {
    if (!sesiones.has(page)) sesiones.set(page, await page.context().newCDPSession(page));
    await sesiones.get(page).send("Input.dispatchTouchEvent", { type: tipo, touchPoints: tipo === "touchEnd" ? [] : [{ x, y }] });
  }

  test("mantener pulsado y mover reordena", async ({ page }) => {
    await preparar(page);
    const filas = page.locator(".hoy-section--today .hoy-section-list > .today-item");
    const a = await filas.nth(0).boundingBox();
    const c = await filas.nth(2).boundingBox();
    const x = a.x + a.width * 0.55;
    await toque(page, "touchStart", x, a.y + a.height / 2);
    await page.waitForTimeout(550);
    for (let i = 1; i <= 10; i++) await toque(page, "touchMove", x, a.y + a.height / 2 + (c.y + c.height * 0.8 - a.y - a.height / 2) * i / 10);
    await toque(page, "touchEnd", x, 0);
    await expect.poll(() => textosHoy(page)).toEqual(["Dos", "Tres", "Uno", "Cuatro"]);
    // Ni hoja abierta ni la tarea borrada/movida por el gesto de deslizar.
    await page.waitForTimeout(400);
    await expect(page.locator(".hoja-tarea").filter({ visible: true })).toHaveCount(0);
  });

  test("mantener pulsado sin mover abre la hoja, como antes", async ({ page }) => {
    await preparar(page);
    const a = await page.locator(".hoy-section--today .hoy-section-list > .today-item").nth(1).boundingBox();
    await toque(page, "touchStart", a.x + a.width * 0.55, a.y + a.height / 2);
    await page.waitForTimeout(700);
    await toque(page, "touchEnd", 0, 0);
    await page.waitForTimeout(500);
    await expect(page.locator(".hoja-tarea").first()).toBeVisible();
    expect(await textosHoy(page)).toEqual(["Uno", "Dos", "Tres", "Cuatro"]);
  });
});
