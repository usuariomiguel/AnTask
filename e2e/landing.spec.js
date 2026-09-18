// @ts-check
// Primera visita: sin nada de AnTrack en el navegador, / manda a la landing;
// desde la landing (?app) o con datos se entra directo a la app.
import { test, expect } from "@playwright/test";
test("nuevo → landing; desde la landing → app; luego directo a la app", async ({ page }) => {
  await page.goto("/inicio/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await expect(page).toHaveURL(/\/inicio\/$/);
  await page.locator(".portada .boton--principal").click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForSelector(".project-item-inbox", { state: "attached", timeout: 15000 });
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});
test("con datos no redirige, con tema de la landing sí", async ({ page }) => {
  await page.goto("/inicio/");
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("mis-tareas-theme", "dark"); });
  await page.goto("/");
  await expect(page).toHaveURL(/\/inicio\/$/);
  await page.evaluate(() => localStorage.setItem("anso-projects", "[]"));
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
});
test("con parámetros (email de acceso) no redirige", async ({ page }) => {
  await page.goto("/inicio/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/?mode=signIn&oobCode=x");
  await expect(page).toHaveURL(/mode=signIn/);
});
