// En móvil, el tercer botón de la barra inferior lleva el avatar en vez de
// la rueda dentada, pero sigue abriendo Ajustes (y así lo dice su nombre
// accesible).
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("el tercer botón muestra el avatar y abre Ajustes", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-profile", JSON.stringify({ name: "Miguel" }));
  });
  await page.goto("/");
  await page.waitForSelector("#mobile-bottom-nav", { timeout: 15000 });
  await page.waitForTimeout(700);

  const btn = page.locator("#bnav-settings-btn");
  await expect(btn).toBeVisible();
  await expect(btn.locator(".bnav-avatar")).toBeVisible();
  expect(await btn.locator("i[data-lucide='settings'], svg").count()).toBe(0);
  await expect(page.getByRole("button", { name: "Ajustes" })).toBeVisible();

  await btn.tap();
  await expect(page.locator("#settings-overlay")).toBeVisible();
  expect(errores).toEqual([]);
});
