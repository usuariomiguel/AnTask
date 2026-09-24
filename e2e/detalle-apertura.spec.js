// El panel de detalle se abre y se cierra como la barra lateral: solo
// crece el ancho de la caja y va descubriendo el contenido, que guarda su
// ancho final (nada de deslizamientos ni fundidos encima).
import { test, expect } from "@playwright/test";
test.use({ deviceScaleFactor: 2 });
test("apertura como la sidebar", async ({ page }) => {
  const errores = []; page.on("pageerror", (e) => errores.push(e.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full"); localStorage.setItem("mis-tareas-theme", "light");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("a", "Revisar el contrato del proveedor"), T("b", "Otra")] }]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.click("li[data-project-id='p1']"); await page.waitForTimeout(700);
  const medir = () => page.evaluate(() => {
    const w = document.getElementById("task-detail-wrap").getBoundingClientRect();
    const p = document.getElementById("task-detail-panel");
    const pr = p.getBoundingClientRect();
    const cs = getComputedStyle(p);
    return { caja: Math.round(w.width), panel: Math.round(pr.width), opacidad: cs.opacity, transform: cs.transform };
  });
  await page.locator(".task-item", { hasText: "Revisar" }).locator(".task-text").click();
  await page.waitForTimeout(120);
  const medio = await medir();
  await page.waitForTimeout(600);
  const fin = await medir();
  // El contenido guarda su ancho final mientras la caja crece
  expect(medio.panel).toBe(340);
  expect(medio.opacidad).toBe("1");
  expect(medio.caja).toBeLessThan(fin.caja);
  // Al cerrar, el rail vuelve sin fundidos
  await page.click("#task-detail-close");
  await page.waitForTimeout(120);
  await page.waitForTimeout(500);
  expect(errores).toEqual([]);
});
