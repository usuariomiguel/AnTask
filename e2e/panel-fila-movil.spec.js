// Panel de fecha y repetir de una fila en móvil: los ✓ de guardar solo
// aparecen con un cambio, y guardar el título (que repinta la lista) no
// deja el panel descolocado.
import { test, expect } from "@playwright/test";
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const hoy = new Date().toISOString().slice(0, 10);

for (const tema of ["light", "dark"]) test(`panel de fila en móvil (${tema})`, async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate(([tema, hoy]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "simple");
    localStorage.setItem("mis-tareas-theme", tema);
    localStorage.setItem("antrack_swipe_hinted", "1");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Revisar contrato"), T("b", "Llamar al proveedor"), T("c", "Pedir facturas")] }]));
  }, [tema, hoy]);
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(700);
  await page.locator(".today-item").nth(1).locator(".today-text").tap();
  await page.waitForTimeout(450);

  const opacidad = (sel) => page.evaluate((sel) => getComputedStyle(document.querySelector(sel)).opacity, sel);
  const caja = () => page.evaluate(() => { const r = document.querySelector(".field-popover--fixed").getBoundingClientRect(); return [r.left, r.top, r.width].map(Math.round); });
  expect(await opacidad(".field-popover-title-confirm")).toBe("0");
  expect(await opacidad(".field-popover-custom-confirm")).toBe("0");
  const antes = await caja();

  // Cambiar el título y pasar a otro campo: el panel se queda en su sitio.
  await page.locator(".field-popover-title-input").fill("Llamar al proveedor hoy");
  await page.waitForTimeout(200);
  expect(await opacidad(".field-popover-title-confirm")).not.toBe("0");
  await page.locator(".field-popover-custom-input").fill("4");
  await page.waitForTimeout(250);
  const despues = await caja();
  expect(despues[2]).toBeGreaterThan(300);
  expect(Math.abs(despues[1] - antes[1])).toBeLessThan(4);
  expect(await opacidad(".field-popover-custom-confirm")).toBe("1");

  await page.locator(".field-popover-custom-confirm").tap();
  await page.waitForTimeout(300);
  const t = await page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[0].tasks[1]);
  expect(t.text).toBe("Llamar al proveedor hoy");
  expect(t.recurDays).toBe(4);
  expect(errores).toEqual([]);
});
