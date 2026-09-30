// Notas de hasta 3.000 palabras: se guardan enteras (antes se cortaban a
// 300 caracteres), lo que pasa del límite se recorta en el propio campo, la
// cuenta aparece solo cerca del tope y el campo crece con el texto.
import { test, expect } from "@playwright/test";

// Palabras de longitud normal (media de 5-6 letras en español).
const palabras = (n) => Array.from({ length: n }, (_, i) => ["casa", "mesa", "tarea", "lunes", "llamar", "presupuesto"][i % 6]).join(" ");

async function carga(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("a", "Informe")] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(400);
  await page.locator(".task-item", { hasText: "Informe" }).locator(".task-text").click();
  await page.waitForTimeout(500);
}
const guardada = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[1].tasks[0].comment || "");
const cuenta = (s) => (s.match(/\S+/g) || []).length;

test("una nota larga se guarda entera y la cuenta solo aparece cerca del límite", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  const campo = page.locator("#task-detail-comment");
  const contador = page.locator("#task-detail-note-count");

  // 800 palabras: antes se cortaba a 300 caracteres.
  const alto0 = await campo.evaluate((el) => el.offsetHeight);
  await campo.fill(palabras(800));
  await expect.poll(async () => cuenta(await guardada(page)), { timeout: 5000 }).toBe(800);
  await expect(contador).toBeHidden();
  // El campo crece con el texto.
  expect(await campo.evaluate((el) => el.offsetHeight)).toBeGreaterThan(alto0);

  // 2.600 palabras: por encima del 80 %, la cuenta aparece.
  await campo.fill(palabras(2600));
  await expect(contador).toBeVisible();
  // En español, cuatro cifras van sin punto de millares («2600»).
  await expect(contador).toHaveText("2600 / 3000 palabras");

  // Pegar 3.200: se recorta en el campo a 3.000 y la cuenta se marca.
  await campo.fill(palabras(3200));
  expect(cuenta(await campo.inputValue())).toBe(3000);
  await expect(contador).toHaveText("3000 / 3000 palabras");
  await expect(contador).toHaveClass(/nota-contador--tope/);
  await expect.poll(async () => cuenta(await guardada(page)), { timeout: 5000 }).toBe(3000);
  expect(errores).toEqual([]);
});

test("la nota larga sobrevive a recargar la página", async ({ page }) => {
  await carga(page);
  await page.locator("#task-detail-comment").fill(palabras(1500));
  await page.locator("#task-detail-title").click();   // salir del campo guarda
  await expect.poll(async () => cuenta(await guardada(page)), { timeout: 5000 }).toBe(1500);
  await page.reload();
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.click("li[data-project-id='p1']");
  await page.locator(".task-item", { hasText: "Informe" }).locator(".task-text").click();
  await page.waitForTimeout(500);
  expect(cuenta(await page.locator("#task-detail-comment").inputValue())).toBe(1500);
});
