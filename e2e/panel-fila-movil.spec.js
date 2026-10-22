// Hoja de tarea en móvil (ver _abrirHojaTarea): tocar una tarea —o
// mantenerla pulsada— abre una hoja desde abajo con título, fecha,
// repetir, enlaces, duplicar y eliminar (lo demás es de escritorio).
// Fondo opaco también en oscuro.
import { test, expect } from "@playwright/test";
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

async function carga(page, tema) {
  await page.goto("/");
  await page.evaluate(([tema, hoy]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("mis-tareas-theme", tema);
    localStorage.setItem("antrack_swipe_hinted", "1");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Revisar contrato"), T("b", "Llamar al proveedor"), T("c", "Pedir facturas")] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [] },
    ]));
  }, [tema, iso(0)]);
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(700);
}
const tarea = (page, id) => page.evaluate((id) => JSON.parse(localStorage.getItem("anso-projects"))[0].tasks.find((t) => t.id === id), id);

for (const tema of ["light", "dark"]) test(`hoja de tarea en móvil (${tema})`, async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page, tema);
  await page.locator(".today-item").nth(1).locator(".today-text").tap();
  const hoja = page.locator(".hoja-tarea");
  await expect(hoja).toBeVisible();
  // Opaca: en oscuro dejaba ver la lista por detrás.
  const fondo = await hoja.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(fondo).not.toMatch(/rgba\([^)]*,\s*0(\.\d+)?\)$/);
  await expect(page.locator(".hoja-chip[data-fecha]").first()).toHaveClass(/hoja-chip--on/);   // Hoy

  // Solo lo del móvil: nada de importante, listas ni detalle completo.
  await expect(page.locator(".hoja-tarea [data-accion]")).toHaveCount(3);   // repetir, duplicar y eliminar

  // Título, enlace y repetir a medida, sin cerrar la hoja.
  await page.locator(".hoja-tarea-titulo").fill("Llamar al proveedor hoy");
  await page.locator(".hoja-enlace-input").fill("github.com/usuario/mi-proyecto");
  await page.locator(".hoja-enlace-input").press("Enter");
  await expect(page.locator(".hoja-tarea .task-link-titulo")).toHaveText("Mi proyecto");
  await page.locator(".hoja-fila[data-accion='repetir']").tap();
  await page.locator(".modal-sheet-opt[data-value='otro']").tap();
  await page.locator(".modal-input").fill("4");
  await page.locator(".modal-btn-confirm").tap();
  await expect(page.locator(".hoja-fila[data-accion='repetir'] .hoja-fila-valor")).toHaveText("Cada 4 días");
  let t = await tarea(page, "b");
  expect(t.text).toBe("Llamar al proveedor hoy");
  expect(t.recurDays).toBe(4);
  expect(t.links.map((l) => l.url)).toEqual(["https://github.com/usuario/mi-proyecto"]);

  // Quitar el enlace desde la hoja.
  await page.locator(".hoja-tarea .task-link-quitar").tap();
  await expect(page.locator(".hoja-tarea .task-link")).toHaveCount(0);

  // Una fecha rápida guarda y cierra.
  await page.locator(".hoja-chip[data-fecha='" + iso(1) + "']").tap();
  await expect(hoja).toHaveCount(0, { timeout: 2000 });
  t = await tarea(page, "b");
  expect(t.dueDate).toBe(iso(1));
  expect(errores).toEqual([]);
});

test("mantener pulsado abre la misma hoja, y duplicar funciona", async ({ page }) => {
  await carga(page, "light");
  await page.locator("#bnav-inbox-btn").tap(); await page.waitForTimeout(500);
  await page.locator(".task-item", { hasText: "Pedir facturas" }).evaluate((el) => {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left + 120, clientY: r.top + r.height / 2 }));
  });
  await expect(page.locator(".hoja-tarea")).toBeVisible();
  await expect(page.locator(".ctx-menu")).toHaveCount(0);   // ya no el menú flotante

  await page.locator(".hoja-accion[data-accion='duplicar']").tap();
  await page.waitForTimeout(400);
  await expect(page.locator(".hoja-tarea")).toHaveCount(0);
  const textos = await page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[0].tasks.map((t) => t.text));
  expect(textos.filter((x) => x === "Pedir facturas")).toHaveLength(2);
});

test("eliminar desde la hoja, con deshacer", async ({ page }) => {
  await carga(page, "light");
  await page.locator(".today-item", { hasText: "Pedir facturas" }).locator(".today-text").tap();
  await page.locator(".hoja-accion[data-accion='eliminar']").tap();
  await expect(page.locator(".hoja-tarea")).toHaveCount(0, { timeout: 2000 });
  await expect(page.locator(".today-item", { hasText: "Pedir facturas" })).toHaveCount(0);
  const ids = await page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[0].tasks.map((t) => t.id));
  expect(ids).not.toContain("c");
});

test("en Hoy, cambiar la fecha lleva el calendario a ese día", async ({ page }) => {
  await carga(page, "light");
  await page.locator(".today-item", { hasText: "Pedir facturas" }).locator(".today-text").tap();
  await page.locator(".hoja-chip[data-fecha='" + iso(7) + "']").tap();
  await expect(page.locator(".hoja-tarea")).toHaveCount(0, { timeout: 2000 });
  // El día queda elegido en la tira, y la tarea se ve en la lista de ese día.
  await expect(page.locator('[data-cal-day="' + iso(7) + '"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".today-item", { hasText: "Pedir facturas" })).toBeVisible();
  // Volver a hoy desde la hoja deja la vista de Hoy normal.
  await page.locator(".today-item", { hasText: "Pedir facturas" }).locator(".today-text").tap();
  await page.locator(".hoja-chip[data-fecha='" + iso(0) + "']").tap();
  await expect(page.locator('[data-cal-day="' + iso(0) + '"]')).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".today-item", { hasText: "Revisar contrato" })).toBeVisible();
});

test("subtareas en la hoja: se añaden, se marcan y la casilla de la fila hace el anillo", async ({ page }) => {
  await carga(page, "light");
  await page.locator(".today-item", { hasText: "Revisar contrato" }).locator(".today-text").tap();
  for (const txt of ["Leer cláusulas", "Firmar"]) {
    await page.locator(".hoja-subtarea-input").fill(txt);
    await page.locator(".hoja-subtarea-input").press("Enter");
  }
  await expect(page.locator(".hoja-subtareas .subtask-item")).toHaveCount(2);
  await page.locator(".hoja-subtareas .subtask-item", { hasText: "Firmar" }).locator(".subtask-checkbox").check({ force: true });
  await expect(page.locator(".hoja-tarea-subtareas .hoja-tarea-rotulo")).toHaveText("Subtareas · 1/2");
  const t = await tarea(page, "a");
  expect(t.subtasks.map((s) => [s.text, s.done])).toEqual([["Firmar", true], ["Leer cláusulas", false]]);
  await page.keyboard.press("Escape");
  await expect(page.locator(".today-item", { hasText: "Revisar contrato" }).locator(".task-subring")).toHaveCount(1);
});
