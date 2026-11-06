// @ts-check
// El campo «Añadir una tarea para hoy…» no tiene atajos: lo que se escribe
// es el título y la tarea va a hoy. «mañana», «p1» o «cada 2 días» se quedan
// en el texto en vez de cambiar la fecha, la prioridad o la repetición.
import { test, expect } from "@playwright/test";

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };

for (const [nombre, opciones, modo] of [
  ["ordenador", { viewport: { width: 1280, height: 860 } }, "full"],
  ["móvil", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true }, "simple"],
]) {
  test.describe(nombre, () => {
    test.use(opciones);

    test("lo escrito se guarda tal cual y va a hoy", async ({ page }) => {
      await page.goto("/?app");
      await page.evaluate((modo) => {
        localStorage.clear();
        localStorage.setItem("antrack_consent", "essential");
        localStorage.setItem("antrack-onboarded", "1");
        localStorage.setItem("antrack_lang", "es");
        localStorage.setItem("antrack-mode", modo);
        localStorage.setItem("antrack_swipe_hinted", "1");
        localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] }]));
      }, modo);
      await page.goto("/?app");
      const campo = page.locator(".hoy-quickadd:not(.hoy-quickadd--habit) .hoy-quickadd-input").first();
      await campo.waitFor({ timeout: 15000 });
      await campo.fill("llamar a Ana mañana p1 cada 2 días");
      await campo.press("Enter");

      await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects") || "[]")[0].tasks.length)).toBe(1);
      const tarea = await page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[0].tasks[0]);
      expect(tarea.text).toBe("Llamar a Ana mañana p1 cada 2 días");
      expect(tarea.dueDate).toBe(iso(0));
      expect(tarea.priority).toBeNull();
      expect(tarea.recurDays).toBeNull();
    });
  });
}
