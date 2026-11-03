// @ts-check
// Tema: por defecto sigue al dispositivo, también en directo. El botón del
// sol fija el contrario y, pulsado otra vez, vuelve a automático. En
// Ajustes se elige Automático / Claro / Oscuro.
import { test, expect } from "@playwright/test";

const tema = (page) => page.evaluate(() => document.documentElement.dataset.theme);
const guardado = (page) => page.evaluate(() => localStorage.getItem("mis-tareas-theme"));

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/?app");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
  });
  await page.goto("/?app");
  await page.waitForSelector(".project-item-inbox", { state: "attached", timeout: 15000 });
  await page.waitForTimeout(500);
});

test("automático: cambia con el dispositivo sin recargar", async ({ page }) => {
  expect(await tema(page)).toBe("light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect.poll(() => tema(page)).toBe("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect.poll(() => tema(page)).toBe("light");
  expect(await guardado(page)).toBeNull();
});

test("el sol fija el contrario y, otra vez, vuelve a automático", async ({ page }) => {
  await page.locator("#theme-toggle-btn").click();
  await expect.poll(() => tema(page)).toBe("dark");
  expect(await guardado(page)).toBe("dark");
  // Fijo: el dispositivo ya no manda.
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForTimeout(200);
  expect(await tema(page)).toBe("dark");
  await page.locator("#theme-toggle-btn").click();
  await expect.poll(() => tema(page)).toBe("light");
  expect(await guardado(page)).toBeNull();
});

test.describe("en el móvil", () => {
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test("Ajustes: Automático, Claro y Oscuro", async ({ page }) => {
  await page.locator("#bnav-settings-btn").tap();
  const seg = page.locator("#settings-theme-seg");
  await expect(seg.locator('[data-theme-value="auto"]')).toHaveClass(/active/);

  await seg.locator('[data-theme-value="dark"]').click();
  await expect.poll(() => tema(page)).toBe("dark");
  expect(await guardado(page)).toBe("dark");
  await expect(seg.locator('[data-theme-value="dark"]')).toHaveClass(/active/);

  await seg.locator('[data-theme-value="auto"]').click();
  await expect.poll(() => tema(page)).toBe("light");
  expect(await guardado(page)).toBeNull();
  await expect(seg.locator('[data-theme-value="auto"]')).toHaveClass(/active/);
});
});
