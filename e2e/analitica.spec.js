// Analítica anónima sin cookies: se carga por defecto, sin banner que
// responder, y el interruptor de Ajustes la apaga y lo recuerda.
import { test, expect } from "@playwright/test";

const script = (page) => page.locator('script[data-sdkn^="@vercel/analytics"]');

test("primera visita: analítica cargada, sin banner y el tour sale solo", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("antrack_lang", "es"); });
  await page.goto("/");
  await expect(script(page)).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator("#consent-banner")).toHaveCount(0);
  // Antes el tour esperaba a que se respondiera el banner.
  await expect(page.locator(".modal-box-onb")).toBeVisible({ timeout: 5000 });
  // Nada de cookies.
  expect(await page.context().cookies()).toEqual([]);
  expect(errores).toEqual([]);
});

test("desactivarla en Ajustes retira el script y se respeta al volver", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "simple");
  });
  await page.goto("/");
  await page.waitForSelector("#bnav-settings-btn", { timeout: 15000 });
  await expect(script(page)).toHaveCount(1);
  await page.waitForTimeout(600);
  await page.locator("#bnav-settings-btn").click();
  const sw = page.locator("#settings-analytics-btn");
  await expect(sw).toHaveAttribute("aria-pressed", "true");
  await sw.click();
  await expect(sw).toHaveAttribute("aria-pressed", "false");
  await expect(script(page)).toHaveCount(0);

  await page.reload();
  await page.waitForSelector("#bnav-settings-btn", { timeout: 15000 });
  await page.waitForTimeout(500);
  await expect(script(page)).toHaveCount(0);

  // Y se puede volver a activar.
  await page.locator("#bnav-settings-btn").click();
  await sw.click();
  await expect(sw).toHaveAttribute("aria-pressed", "true");
  await expect(script(page)).toHaveCount(1);
});
