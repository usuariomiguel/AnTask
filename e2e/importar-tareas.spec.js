// Importar un archivo de tareas sueltas: pide confirmación y AÑADE las
// tareas a la lista abierta, sin tocar las que ya tiene. Antes las
// sustituía sin preguntar (importar con el Inbox abierto lo vaciaba).
import { test, expect } from "@playwright/test";

const archivo = {
  name: "tareas.json",
  mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify({
    tasks: [
      { id: "imp-1", text: "Importada uno", comment: "Texto largo del comentario" },
      { id: "imp-2", text: "Importada dos", subtasks: [{ text: "Paso" }] },
    ],
  })),
};

async function carga(page) {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Ya estaba A"), T("b", "Ya estaba B")] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { timeout: 15000 });
  await page.click(".project-item-inbox");
  await page.waitForTimeout(400);
}
const tareas = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[0].tasks);

test("añade las tareas tras confirmar y conserva las que había", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page);
  await page.setInputFiles("#import-file", archivo);
  await expect(page.getByText("Se añadirán 2 tareas a «Inbox»")).toBeVisible();
  await page.getByRole("button", { name: "Añadir", exact: true }).click();
  await page.waitForTimeout(300);
  let lista = await tareas(page);
  expect(lista.map((t) => t.text)).toEqual(["Ya estaba A", "Ya estaba B", "Importada uno", "Importada dos"]);
  expect(lista[2].comment).toBe("Texto largo del comentario");
  expect(lista[3].subtasks.length).toBe(1);

  // Importar el mismo archivo otra vez: sin ids repetidos.
  await page.setInputFiles("#import-file", archivo);
  await page.getByRole("button", { name: "Añadir", exact: true }).click();
  await page.waitForTimeout(300);
  lista = await tareas(page);
  expect(lista.length).toBe(6);
  expect(new Set(lista.map((t) => t.id)).size).toBe(6);
  expect(errores).toEqual([]);
});

test("cancelar no cambia nada", async ({ page }) => {
  await carga(page);
  await page.setInputFiles("#import-file", archivo);
  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.waitForTimeout(300);
  expect((await tareas(page)).map((t) => t.text)).toEqual(["Ya estaba A", "Ya estaba B"]);
});
