// Conmutador Tareas/Hábitos con su progreso, el resaltado deslizante de los
// filtros (PC y móvil) y las estadísticas de hábitos como pantalla en móvil.
import { test, expect } from "@playwright/test";

const iso = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

async function carga(page, modo) {
  await page.goto("/");
  await page.evaluate(([modo, hoy]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", modo);
    localStorage.setItem("antrack_swipe_hinted", "1");
    const T = (id, text, due, done) => ({ id, text, comment: "", done: !!done, priority: null, dueDate: due, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [
      T("a", "Una", hoy), T("b", "Dos", hoy, true), T("c", "Tres", null), T("d", "Cuatro", null, true)] }]));
    const H = (id, name, log) => ({ id, name, schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - 5 * 864e5).toISOString(), archived: false, log });
    localStorage.setItem("antrack-habits", JSON.stringify([H("h1", "Leer", { [hoy]: 1 }), H("h2", "Correr", { [hoy]: 1 })]));
  }, [modo, iso(0)]);
  await page.goto("/");
  await page.waitForTimeout(1200);
}

// Posición del resaltado fotograma a fotograma.
const recorrido = (page, sel, ms) => page.evaluate(([sel, ms]) => new Promise((res) => {
  const xs = []; const t0 = performance.now();
  (function paso() {
    const el = document.querySelector(sel);
    if (el) xs.push(Math.round(el.getBoundingClientRect().left));
    if (performance.now() - t0 < ms) requestAnimationFrame(paso); else res(xs);
  })();
}), [sel, ms]);

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("cada pestaña de Hoy enseña su progreso del día", async ({ page }) => {
    await carga(page, "simple");
    await expect(page.locator('[data-hoy-count="tasks"]')).toHaveText("1/2");
    const hab = page.locator('[data-hoy-count="habits"]');
    await expect(hab).toHaveText("2/2");
    await expect(hab).toHaveClass(/hoy-tab-count--hecho/);
  });

  test("los filtros del Inbox deslizan el resaltado y la lista entra por su lado", async ({ page }) => {
    const errores = []; page.on("pageerror", (e) => errores.push(e.message));
    await carga(page, "simple");
    await page.locator("#bnav-inbox-btn").tap();
    await page.waitForTimeout(600);
    const ind = page.locator("#filter-segments .seg-indicador");
    const pos = () => page.evaluate(() => ({
      ind: Math.round(document.querySelector("#filter-segments .seg-indicador").getBoundingClientRect().left),
      act: Math.round(document.querySelector("#filter-segments .filter-opt--active").getBoundingClientRect().left),
    }));
    await expect(ind).toBeVisible();
    const inicio = await pos();
    expect(inicio.ind).toBe(inicio.act);
    await page.evaluate(() => {
      window.__anims = [];
      const orig = Element.prototype.animate;
      Element.prototype.animate = function (k, o) { window.__anims.push({ id: this.id, k: JSON.stringify(k) }); return orig.call(this, k, o); };
    });
    const viaje = recorrido(page, "#filter-segments .seg-indicador", 900);
    await page.locator('.filter-segment[data-filter="done"]').tap();
    const xs = await viaje;
    const fin = await pos();
    expect(fin.ind).toBe(fin.act);
    expect(xs.some((x) => x > inicio.ind && x < fin.ind)).toBe(true);
    // Hechas está a la derecha: la lista llega desde la derecha.
    const lista = await page.evaluate(() => window.__anims.find((a) => a.id === "task-list"));
    expect(lista.k).toContain("translateX(28px)");
    await expect(page.locator(".task-item", { hasText: "Cuatro" })).toBeVisible();
    expect(errores).toEqual([]);
  });

  test("las estadísticas de hábitos son una pantalla con «atrás»", async ({ page }) => {
    await carga(page, "simple");
    await page.locator("[data-hoy-tab='habits']").tap();
    await page.waitForTimeout(400);
    await page.locator("#hoy-tabs-hist").tap();
    await page.waitForTimeout(600);
    const caja = page.locator(".hist-modal");
    const r = await caja.evaluate((el) => { const b = el.getBoundingClientRect(); return [b.left, b.width]; });
    expect(r[0]).toBe(0);
    expect(r[1]).toBe(390);
    await expect(page.locator("#hist-back")).toBeVisible();
    await page.locator("#hist-back").tap();
    await expect(page.locator(".hist-modal")).toHaveCount(0, { timeout: 2000 });
  });
});

test("en PC el resaltado de los filtros también llega a «Otros»", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await carga(page, "full");
  await page.locator(".project-item-inbox").first().click();
  await page.waitForTimeout(500);
  await page.locator("#filter-trigger-btn").click();
  await page.locator('#filter-panel .filter-opt[data-filter="nodate"]').click();
  await page.waitForTimeout(600);
  const m = await page.evaluate(() => {
    const i = document.querySelector("#filter-segments .seg-indicador").getBoundingClientRect();
    const b = document.getElementById("filter-trigger-btn");
    const r = b.getBoundingClientRect();
    return { d: Math.abs(i.left - r.left) + Math.abs(i.width - r.width), color: getComputedStyle(b).color, fondo: getComputedStyle(document.querySelector("#filter-segments .seg-indicador")).backgroundColor };
  });
  expect(m.d).toBeLessThan(2);
  // El texto del activo no puede ser del color del resaltado.
  expect(m.color).not.toBe(m.fondo);
});

test("en PC el resaltado queda alineado, también en pantallas grandes con zoom", async ({ page }) => {
  // 1920: a partir de 1600 la app pone zoom 1.1 al html, y medir con
  // getBoundingClientRect daba píxeles con zoom en un translate sin él.
  await page.setViewportSize({ width: 1920, height: 1080 });
  await carga(page, "full");
  const desfase = () => page.evaluate(() => {
    const i = document.querySelector("#filter-segments .seg-indicador").getBoundingClientRect();
    const a = document.querySelector("#filter-segments .filter-opt--active").getBoundingClientRect();
    return Math.abs(i.left - a.left) + Math.abs(i.top - a.top) + Math.abs(i.width - a.width);
  });
  for (const sel of [".project-item-inbox", ".project-item-today"]) {
    await page.locator(sel).first().click();
    await page.waitForTimeout(700);
    expect(await desfase()).toBeLessThan(2);
  }
  // Y tras pulsar un filtro y volver.
  await page.locator('.filter-segment[data-filter="pending"]').click();
  await page.waitForTimeout(500);
  await page.locator('.filter-segment[data-filter="all"]').click();
  await page.waitForTimeout(500);
  expect(await desfase()).toBeLessThan(2);
});
