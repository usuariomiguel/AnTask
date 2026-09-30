// En móvil, las tareas con píldora de fecha («3 oct», «Ayer →», «Mover a
// hoy») medían 4px más que las demás: la píldora era más alta que el hueco
// de la fila. Todas tienen que medir lo mismo, en Hoy y en listas.
import { test, expect } from "@playwright/test";
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
for (const estilo of ["tarjetas", "limpio"]) for (const modo of ["simple", "full"]) test(`alto ${estilo} ${modo}`, async ({ page }) => {
  await page.goto("/");
  await page.evaluate(([estilo, modo]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", modo); localStorage.setItem("mis-tareas-theme", "light"); localStorage.setItem("antrack-row-style", estilo); localStorage.setItem("antrack_swipe_hinted", "1");
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    const T = (id, text, due, extra) => Object.assign({ id, text, comment: "", done: false, priority: null, dueDate: due, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] }, extra || {});
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [
      T("a", "Sin fecha", null), T("b", "Con fecha futura", d(3)), T("c", "Vencida", d(-1)), T("d", "De hoy", d(0)), T("e", "Con repetir", null, { recurDays: 2 }) ] }]));
  }, [estilo, modo]);
  await page.goto("/");
  await page.waitForSelector(".today-item, .task-item", { timeout: 15000 });
  await page.waitForTimeout(600);
  const hoy = await page.evaluate(() => [...document.querySelectorAll(".today-item")].map((el) => el.querySelector(".today-text, .task-text, .title-ink")?.textContent.trim().slice(0, 16) + "=" + Math.round(el.getBoundingClientRect().height)));
  await page.locator("#bnav-inbox-btn").tap();
  await page.waitForTimeout(600);
  const lista = await page.evaluate(() => [...document.querySelectorAll(".task-item")].map((el) => el.querySelector(".task-text")?.textContent.trim().slice(0, 16) + "=" + Math.round(el.getBoundingClientRect().height)));
  const alturas = (xs) => new Set(xs.map((x) => x.split("=").pop()));
  expect(alturas(hoy).size).toBe(1);
  expect(alturas(lista).size).toBe(1);
});
