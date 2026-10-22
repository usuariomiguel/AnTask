// Barra lateral (PC): con muchas listas se enseñan las 6 primeras y un
// «Mostrar N más» que despliega el resto; se recuerda al recargar.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

async function carga(page, n) {
  await page.goto("/");
  await page.evaluate((n) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    const L = (i) => ({ id: "p" + i, name: "Lista " + i, createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      ...Array.from({ length: n }, (_, i) => L(i + 1)),
    ]));
  }, n);
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { timeout: 15000 });
  await page.waitForTimeout(500);
}
const listas = (page) => page.locator(".project-item[data-project-id]:not(.project-item-pinned)");

test("con 12 listas enseña 6 y despliega el resto, y se recuerda", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await carga(page, 12);
  await expect(listas(page)).toHaveCount(6);
  const btn = page.locator(".sidebar-more-btn");
  await expect(btn).toHaveText("Mostrar 6 más");
  await expect(btn).toHaveAttribute("aria-expanded", "false");

  await btn.click();
  await expect(listas(page)).toHaveCount(12);
  await expect(btn).toHaveText("Mostrar menos");
  await expect(btn).toHaveAttribute("aria-expanded", "true");

  await page.reload(); await page.waitForTimeout(800);
  await expect(listas(page)).toHaveCount(12);

  await page.locator(".sidebar-more-btn").click();
  await page.waitForTimeout(400);
  await expect(listas(page)).toHaveCount(6);
  expect(errores).toEqual([]);
});

test("la lista abierta se ve aunque esté entre las ocultas", async ({ page }) => {
  await carga(page, 12);
  await page.locator(".sidebar-more-btn").click();
  await page.locator(".project-item[data-project-id='p10']").click();
  await page.waitForTimeout(300);
  await page.locator(".sidebar-more-btn").click();
  await page.waitForTimeout(400);
  await expect(listas(page)).toHaveCount(7);
  await expect(page.locator(".project-item[data-project-id='p10']")).toHaveClass(/active/);
  await expect(page.locator(".sidebar-more-btn")).toHaveText("Mostrar 5 más");
});

test("con 7 listas o menos no hay botón (no tiene sentido «Mostrar 1 más»)", async ({ page }) => {
  await carga(page, 7);
  await expect(listas(page)).toHaveCount(7);
  await expect(page.locator(".sidebar-more-btn")).toHaveCount(0);
});
