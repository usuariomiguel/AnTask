// Barra de navegación inferior en móvil: botones con nombre accesible, la
// pastilla simétrica y centrada con el +, la última tarea sin quedar tapada
// y el resaltado del activo que se desliza al cambiar de vista.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function carga(page, n) {
  await page.goto("/");
  await page.evaluate((n) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: Array.from({ length: n }, (_, i) => T("t" + i, "Tarea " + (i + 1))) }]));
  }, n);
  await page.goto("/");
  await page.waitForSelector("#mobile-bottom-nav", { timeout: 15000 });
  await page.waitForTimeout(700);
}

test("los botones se anuncian por su nombre y el activo como página actual", async ({ page }) => {
  await carga(page, 2);
  await page.click("#bnav-inbox-btn");
  await expect(page.getByRole("button", { name: "Hoy" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();
  await expect(page.locator("#bnav-inbox-btn")).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#bnav-today-btn")).not.toHaveAttribute("aria-current", "page");
});

test("pastilla simétrica, centrada con el + y sin tapar la última tarea", async ({ page }) => {
  await carga(page, 20);
  await page.click("#bnav-inbox-btn");
  await page.waitForTimeout(500);
  const m = await page.evaluate(() => {
    const nav = document.getElementById("mobile-bottom-nav").getBoundingClientRect();
    const b = document.getElementById("bnav-inbox-btn").getBoundingClientRect();
    const fab = document.getElementById("mobile-fab").getBoundingClientRect();
    return { arriba: b.top - nav.top, abajo: nav.bottom - b.bottom, centroNav: (nav.top + nav.bottom) / 2, centroFab: (fab.top + fab.bottom) / 2 };
  });
  expect(Math.abs(m.arriba - m.abajo)).toBeLessThan(1);
  expect(Math.abs(m.centroNav - m.centroFab)).toBeLessThan(1);

  await page.evaluate(() => { const s = document.querySelector(".task-list-scroll"); s.scrollTop = s.scrollHeight; });
  await page.waitForTimeout(400);
  const solape = await page.evaluate(() => {
    const filas = document.querySelectorAll("#task-list .task-item");
    return filas[filas.length - 1].getBoundingClientRect().bottom - document.getElementById("mobile-bottom-nav").getBoundingClientRect().top;
  });
  expect(solape).toBeLessThanOrEqual(0);
});

test("el resaltado se desliza hasta el botón nuevo", async ({ page }) => {
  await carga(page, 2);
  const pos = () => page.evaluate(() => {
    const i = document.querySelector(".bnav-indicador").getBoundingClientRect();
    const a = document.querySelector(".mobile-bottom-btn.active").getBoundingClientRect();
    return { ind: Math.round(i.left), act: Math.round(a.left) };
  });
  const inicio = await pos();
  expect(inicio.ind).toBe(inicio.act);
  await page.click("#bnav-inbox-btn");
  await page.waitForTimeout(80);
  const enViaje = await pos();
  await page.waitForTimeout(500);
  const fin = await pos();
  expect(fin.ind).toBe(fin.act);
  expect(enViaje.ind).toBeGreaterThan(inicio.ind);
  expect(enViaje.ind).toBeLessThan(fin.ind);
});
