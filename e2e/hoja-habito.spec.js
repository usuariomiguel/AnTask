// Hoja de hábito en móvil (ver _abrirHojaHabito): la misma hoja que las
// tareas, con los detalles del hábito. En PC el hábito sigue con su menú.
import { test, expect } from "@playwright/test";

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

async function carga(page) {
  await page.goto("/");
  await page.evaluate(([a1, a2, a3]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack_swipe_hinted", "1");
    localStorage.setItem("antrack-habits", JSON.stringify([
      { id: "h1", name: "Leer", schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - 20 * 864e5).toISOString(), archived: false, log: { [a1]: 1, [a2]: 1, [a3]: 1 } },
    ]));
  }, [iso(-1), iso(-2), iso(-3)]);
  await page.goto("/");
  await page.waitForTimeout(1000);
}
const habito = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("antrack-habits"))[0] || null);

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("tocar un hábito abre su hoja con detalles; renombrar y frecuencia", async ({ page }) => {
    const errores = []; page.on("pageerror", (e) => errores.push(e.message));
    await carga(page);
    await page.locator("[data-hoy-tab='habits']").tap(); await page.waitForTimeout(400);
    await page.locator(".today-item--habit", { hasText: "Leer" }).locator(".today-text").tap();
    const hoja = page.locator(".hoja-habito");
    await expect(hoja).toBeVisible();
    await expect(page.locator(".ctx-menu")).toHaveCount(0);
    // Detalles: racha de 3 y la tira de 14 días.
    await expect(hoja.locator(".hoja-habito-dato").first().locator(".hoja-habito-valor")).toHaveText("3");
    await expect(hoja.locator(".hoja-habito-dia")).toHaveCount(14);
    await expect(hoja.locator(".hoja-habito-dia--hecho")).toHaveCount(3);

    await page.locator(".hoja-tarea-titulo").fill("Leer 20 minutos");
    await page.locator(".hoja-fila[data-accion='frecuencia']").tap();
    await page.locator(".modal-sheet-opt[data-value='3']").tap();
    await expect(page.locator(".hoja-fila[data-accion='frecuencia'] .hoja-fila-valor")).toHaveText("Cada 3 días");
    const h = await habito(page);
    expect(h.name).toBe("Leer 20 minutos");
    expect([h.schedule, h.everyNDays]).toEqual(["everyN", 3]);
    expect(errores).toEqual([]);
  });

  test("eliminar desde la hoja pide confirmación", async ({ page }) => {
    await carga(page);
    await page.locator("[data-hoy-tab='habits']").tap(); await page.waitForTimeout(400);
    await page.locator(".today-item--habit", { hasText: "Leer" }).locator(".today-text").tap();
    await page.locator(".hoja-accion[data-accion='eliminar']").tap();
    await page.locator(".modal-btn-danger").tap();
    await page.waitForTimeout(400);
    expect(await habito(page)).toBeNull();
    await expect(page.locator(".hoja-habito")).toHaveCount(0);
  });
});

test("en PC el hábito sigue con su menú", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await carga(page);
  await page.locator(".today-item--habit", { hasText: "Leer" }).locator(".today-text").click();
  await expect(page.locator(".ctx-menu")).toBeVisible();
  await expect(page.locator(".hoja-habito")).toHaveCount(0);
});
