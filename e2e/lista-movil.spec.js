// Animaciones de la lista en móvil: deslizar una fila (a hoy o para borrar)
// convive con el cierre de filas y bloques sin dejar copias ni transform
// colgando.
import { test, expect } from "@playwright/test";
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

const hoy = new Date().toISOString().slice(0, 10);
const T = (id, text, extra) => Object.assign({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] }, extra);

async function carga(page, tareas) {
  await page.goto("/");
  await page.evaluate((tareas) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    localStorage.setItem("antrack_swipe_hinted", "1");
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: tareas }]));
  }, tareas);
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(800);
}

// Desliza una fila dx píxeles con eventos táctiles del DOM y espera a que
// terminen la salida y el repintado.
function deslizar(page, texto, dx) {
  return page.evaluate(async ([texto, dx]) => {
    const fila = [...document.querySelectorAll(".today-item")].find((el) => el.textContent.includes(texto));
    const r = fila.getBoundingClientRect();
    const x0 = r.left + r.width / 2, y = r.top + r.height / 2;
    const toque = (x) => new Touch({ identifier: 1, target: fila, clientX: x, clientY: y });
    fila.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [toque(x0)], changedTouches: [toque(x0)] }));
    for (let i = 1; i <= 8; i++) {
      const x = x0 + (dx * i) / 8;
      fila.dispatchEvent(new TouchEvent("touchmove", { bubbles: true, cancelable: true, touches: [toque(x)], changedTouches: [toque(x)] }));
    }
    fila.dispatchEvent(new TouchEvent("touchend", { bubbles: true, touches: [], changedTouches: [toque(x0 + dx)] }));
    await new Promise((r) => setTimeout(r, 700));
  }, [texto, dx]);
}

const restos = (page) => page.evaluate(() => ({
  copias: document.querySelectorAll("#task-list .fila-saliendo").length,
  transformadas: [...document.querySelectorAll("#task-list .today-item")].filter((el) => el.style.transform && el.style.transform !== "none").length,
}));

test("móvil: deslizar a hoy mueve la fila y cierra Vencidas", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page, [T("v", "Atrasada", { dueDate: "2026-01-02" }), T("a", "Una"), T("b", "Dos")]);
  await deslizar(page, "Atrasada", 160);
  await page.waitForTimeout(500);
  expect(await page.locator(".hoy-section--overdue").count()).toBe(0);
  expect(await restos(page)).toEqual({ copias: 0, transformadas: 0 });
  expect(errores).toEqual([]);
});

test("móvil: deslizar para borrar cierra la fila", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page, [T("a", "Una"), T("b", "Dos"), T("c", "Tres")]);
  await deslizar(page, "Dos", -160);
  await page.waitForTimeout(500);
  expect(await page.locator(".today-item", { hasText: "Dos" }).count()).toBe(0);
  expect(await restos(page)).toEqual({ copias: 0, transformadas: 0 });
  expect(errores).toEqual([]);
});

