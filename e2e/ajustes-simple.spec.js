// En modo simple, Ajustes deja activar y desactivar el compartir datos de
// uso: el resto del panel «Datos» (exportar, importar, borrar todo) sigue
// siendo cosa del modo completo.
import { test, expect } from "@playwright/test";
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test("analítica en modo simple", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "simple");
  });
  await page.goto("/");
  await page.waitForSelector("#bnav-settings-btn", { timeout: 15000 });
  await page.waitForTimeout(700);
  await page.locator("#bnav-settings-btn").tap();
  await page.waitForTimeout(600);
  const sw = page.locator("#settings-analytics-btn");
  await expect(sw).toBeVisible();
  await expect(sw).toHaveAttribute("aria-pressed", "false");
  await sw.tap();
  await page.waitForTimeout(400);
  await expect(sw).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => localStorage.getItem("antrack_consent"))).toBe("all");
  await sw.tap();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => localStorage.getItem("antrack_consent"))).toBe("essential");
  expect(await page.locator("#pf-export-btn").isVisible()).toBe(false);
  expect(errores).toEqual([]);
});
