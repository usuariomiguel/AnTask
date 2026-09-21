// Las filas de hábito se alcanzan con Tab e Intro abre su menú, como las
// filas de tarea.
import { test, expect } from "@playwright/test";
test("hábitos con teclado", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
    localStorage.setItem("antrack-habits", JSON.stringify([{ id: "h1", name: "Leer", schedule: "daily", everyNDays: null, createdAt: new Date(Date.now() - 5 * 864e5).toISOString(), archived: false, log: {} }]));
  });
  await page.goto("/");
  await page.waitForSelector(".project-item-habits", { timeout: 15000 });
  await page.click(".project-item-habits");
  await page.waitForTimeout(500);
  const fila = page.locator(".today-item--habit").first();
  await fila.focus();
  expect(await fila.evaluate((el) => document.activeElement === el)).toBe(true);
  await page.keyboard.press("Enter");
  await expect(page.getByText("Renombrar", { exact: false }).first()).toBeVisible();
});
