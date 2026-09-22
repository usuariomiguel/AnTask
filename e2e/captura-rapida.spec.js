// Captura rápida: los chips laten al detectar fecha, prioridad o lista en
// el texto; la lista de destino late en la barra lateral si no es la abierta;
// y la barra de captura desde Hoy lleva a la lista donde ha ido la tarea
// (antes, siempre al Inbox).
import { test, expect } from "@playwright/test";
async function carga(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [] }]));
  });
  await page.goto("/");
  await page.waitForSelector("#capture-bar", { timeout: 15000 });
  await page.waitForTimeout(500);
}
const animando = (page, sel) => page.evaluate((sel) => { const el = document.querySelector(sel); return !!el && el.getAnimations().some((a) => a.playState === "running"); }, sel);
const late = (page, id) => page.evaluate((id) => document.querySelector('.sidebar .project-item[data-project-id="' + id + '"]').classList.contains("lista-recibe"), id);

test("los chips laten al detectar el texto", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  await page.click("#capture-bar");
  await page.waitForTimeout(300);
  expect(await animando(page, ".qc-list-trigger")).toBe(false);
  const campo = page.locator(".quick-capture-input");
  await campo.pressSequentially("Llamar mañana");
  expect(await animando(page, ".qc-date-trigger")).toBe(true);
  await page.waitForTimeout(400);
  await campo.pressSequentially(" p1");
  expect(await animando(page, ".qc-chip--high")).toBe(true);
  await page.waitForTimeout(400);
  await campo.pressSequentially(" #Trabajo");
  expect(await animando(page, ".qc-list-trigger")).toBe(true);
  await page.waitForTimeout(400);
  await campo.pressSequentially(" ya");
  await page.waitForTimeout(40);
  expect(await animando(page, ".qc-date-trigger")).toBe(false);
  expect(await animando(page, ".qc-list-trigger")).toBe(false);
  expect(errores).toEqual([]);
});

test("con el atajo desde Hoy, la lista de destino late", async ({ page }) => {
  await carga(page);
  await page.keyboard.press("Control+Shift+Space");
  await page.locator(".quick-capture-input").fill("Al inbox");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(60);
  expect(await late(page, "__inbox__")).toBe(true);
  await page.waitForTimeout(600);
  await page.keyboard.press("Control+Shift+Space");
  await page.locator(".quick-capture-input").fill("A trabajo #Trabajo");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(60);
  expect(await late(page, "p1")).toBe(true);
});

test("la barra de captura desde Hoy lleva a la lista de destino", async ({ page }) => {
  await carga(page);
  await page.click("#capture-bar");
  await page.locator(".quick-capture-input").fill("Revisar #Trabajo");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  await expect(page.locator('.sidebar .project-item[data-project-id="p1"]')).toHaveClass(/active/);
  await expect(page.locator(".task-item", { hasText: "Revisar" })).toBeVisible();
});

test("con la lista abierta, no late: la fila entra en la lista", async ({ page }) => {
  await carga(page);
  await page.click('li[data-project-id="p1"]');
  await page.waitForTimeout(400);
  await page.click("#capture-bar");
  await page.locator(".quick-capture-input").fill("En la abierta");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(60);
  expect(await late(page, "p1")).toBe(false);
});
