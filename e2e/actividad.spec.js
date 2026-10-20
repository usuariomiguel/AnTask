// Registro de actividad: lo completado (tareas y hábitos) con día y hora.
// PC: vista «Actividad» en la barra lateral. Móvil: «Hechas este día» en
// el calendario y pestaña Actividad en Estadísticas.
import { test, expect } from "@playwright/test";

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

async function carga(page, modo, actividad = []) {
  await page.goto("/");
  await page.evaluate(([modo, hoy, actividad]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", modo);
    localStorage.setItem("antrack_swipe_hinted", "1");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Comprar fruta")] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("b", "Revisar el presupuesto")] },
    ]));
    localStorage.setItem("antrack-habits", JSON.stringify([{ id: "h1", name: "Leer", schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - 9e8).toISOString(), archived: false, log: {} }]));
    localStorage.setItem("antrack-activity", JSON.stringify(actividad));
  }, [modo, iso(0), actividad]);
  await page.goto("/");
  await page.waitForTimeout(1200);
}
const registro = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("antrack-activity") || "[]"));

test.describe("PC", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("completar una tarea la apunta con hora y lista; desmarcarla la quita", async ({ page }) => {
    const errores = []; page.on("pageerror", (e) => errores.push(e.message));
    await carga(page, "full");
    await page.locator(".today-item", { hasText: "Revisar el presupuesto" }).locator(".today-check").click({ force: true });
    await page.waitForTimeout(300);
    await page.locator(".project-item-activity").click();
    await page.waitForTimeout(500);
    const fila = page.locator(".act-fila", { hasText: "Revisar el presupuesto" });
    await expect(fila).toBeVisible();
    await expect(fila.locator(".act-hora")).toHaveText(/^\d{2}:\d{2}$/);
    await expect(fila.locator(".act-lista")).toHaveText("Trabajo");
    await expect(page.locator(".hoy-section--activity .hoy-section-title").first()).toHaveText("Hoy");

    // Desmarcar desde Hoy: deja de salir (queda anulado, no borrado).
    await page.locator(".project-item-today").click(); await page.waitForTimeout(400);
    await page.locator(".today-item", { hasText: "Revisar el presupuesto" }).locator(".today-check").click({ force: true });
    await page.waitForTimeout(300);
    await page.locator(".project-item-activity").click(); await page.waitForTimeout(400);
    await expect(page.locator(".act-fila", { hasText: "Revisar el presupuesto" })).toHaveCount(0);
    const r = await registro(page);
    expect(r).toHaveLength(1);
    expect(r[0].anulado).toBe(true);
    expect(errores).toEqual([]);
  });

  test("los hábitos también, y se filtra por tipo; sobrevive a recargar", async ({ page }) => {
    await carga(page, "full");
    await page.locator(".today-item", { hasText: "Comprar fruta" }).locator(".today-check").click({ force: true });
    await page.locator(".today-item--habit", { hasText: "Leer" }).locator(".today-check").click({ force: true });
    await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(1200);
    await page.locator(".project-item-activity").click(); await page.waitForTimeout(500);
    await expect(page.locator(".act-fila")).toHaveCount(2);
    await page.locator('[data-act-tipo="habito"]').click(); await page.waitForTimeout(300);
    await expect(page.locator(".act-fila")).toHaveCount(1);
    await expect(page.locator(".act-fila .act-lista")).toHaveText("Hábito");
  });

  test("sin actividad enseña el aviso", async ({ page }) => {
    await carga(page, "full");
    await page.locator(".project-item-activity").click(); await page.waitForTimeout(400);
    await expect(page.locator(".act-vacio")).toBeVisible();
  });
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const ayer = () => { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(18, 2, 0, 0); return d.getTime(); };
  const evento = () => [{ id: "e1", tipo: "tarea", ts: ayer(), dia: iso(-1), ref: "zz", texto: "Pagar la luz", lista: "Casa", color: "#8a9a5b" }];

  test("el día del calendario enseña lo hecho ese día", async ({ page }) => {
    // Lunes: «ayer» cae en la semana anterior y no está en la tira.
    test.skip(new Date().getDay() === 1, "ayer no está en la semana a la vista");
    await carga(page, "simple", evento());
    await page.locator(`[data-cal-day="${iso(-1)}"]`).tap(); await page.waitForTimeout(500);
    const sec = page.locator(".hoy-section--hechas");
    await expect(sec).toBeVisible();
    await expect(sec.locator(".act-fila", { hasText: "Pagar la luz" })).toBeVisible();
    await expect(sec.locator(".act-hora")).toHaveText("18:02");
  });

  test("Estadísticas tiene la pestaña Actividad", async ({ page }) => {
    await carga(page, "simple", evento());
    await page.locator("[data-hoy-tab='habits']").tap(); await page.waitForTimeout(400);
    await page.locator("#hoy-tabs-hist").tap(); await page.waitForTimeout(700);
    await page.locator('[data-pestana="actividad"]').tap(); await page.waitForTimeout(300);
    await expect(page.locator(".act-linea .act-fila", { hasText: "Pagar la luz" })).toBeVisible();
  });
});
