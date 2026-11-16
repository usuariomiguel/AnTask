// En «Editar perfil» se puede cambiar el avatar que toca por defecto:
// se elige entre caras generadas, «Otras caras» saca otra tanda sin perder
// la elegida, y al guardar la nueva cara sale en la barra inferior.
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("elegir otro avatar en Editar perfil", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-profile", JSON.stringify({ name: "Miguel", avatarSeed: "semilla-inicial" }));
  });
  await page.goto("/");
  await page.waitForSelector("#mobile-bottom-nav", { timeout: 15000 });
  await expect(page.locator("#bnav-avatar img")).toHaveCount(1, { timeout: 10000 });
  const srcAntes = await page.locator("#bnav-avatar img").getAttribute("src");

  await page.locator("#bnav-settings-btn").tap();
  await page.locator("#settings-edit-profile-btn").tap();

  const opciones = page.getByRole("radio");
  await expect(opciones).toHaveCount(8);
  // La actual sale la primera y marcada.
  await expect(opciones.first()).toHaveAttribute("aria-checked", "true");
  await expect(opciones.first()).toHaveAttribute("data-seed", "semilla-inicial");
  await expect(opciones.nth(3).locator("img")).toHaveCount(1);

  // Elegir la cuarta y barajar: la elegida se queda la primera.
  await opciones.nth(3).tap();
  const elegida = await opciones.nth(3).getAttribute("data-seed");
  await page.getByRole("button", { name: "Otras caras" }).tap();
  await expect(opciones.first()).toHaveAttribute("data-seed", elegida);
  await expect(opciones.first()).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);

  await page.getByRole("button", { name: "Guardar" }).tap();
  const perfil = await page.evaluate(() => JSON.parse(localStorage.getItem("antrack-profile")));
  expect(perfil.avatarSeed).toBe(elegida);
  expect(perfil.name).toBe("Miguel");
  await expect.poll(() => page.locator("#bnav-avatar img").getAttribute("src")).not.toBe(srcAntes);
  expect(errores).toEqual([]);
});
