// @ts-check
import { test, expect } from "@playwright/test";

/**
 * Siembra de ejemplo en la primera ejecución (ver src/js/state/seed.js).
 *
 * Este fichero es el único que NO marca `antrack-onboarded`: justo esa
 * marca es la que apaga la siembra, y es lo que mantiene fuera de aquí a
 * los demás tests. Se entra por `/?app` porque un navegador sin nada de
 * AnTrack lo manda antes a la landing (ver el script del <head>).
 */

/** Perfil recién estrenado. El consentimiento se deja resuelto para que
 *  su banner no tape nada; no influye en la siembra. */
async function perfilNuevo(page) {
  await page.goto("/?app");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
  });
  await page.goto("/?app");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
}

const leer = (page, clave) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), clave);

test("a quien estrena la app se le dejan tareas y hábitos de ejemplo", async ({ page }) => {
  await perfilNuevo(page);

  const proyectos = await leer(page, "anso-projects");
  const inbox = proyectos.find((p) => p.id === "__inbox__");
  expect(inbox.tasks.length).toBeGreaterThan(0);

  // Van al Inbox: una lista aparte haría que el tour se diera por visto.
  expect(proyectos.filter((p) => p.id !== "__inbox__")).toHaveLength(0);

  // Algo para hoy, para que la vista Hoy tampoco arranque vacía.
  const hoy = await page.evaluate(() => {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  });
  expect(inbox.tasks.some((tk) => tk.dueDate === hoy)).toBe(true);
  expect(inbox.tasks.some((tk) => tk.subtasks.length > 0)).toBe(true);

  const habitos = await leer(page, "antrack-habits");
  expect(habitos.length).toBeGreaterThan(0);
  expect(habitos.some((h) => h.schedule === "everyN")).toBe(true);

  // Y queda apuntado qué se sembró, que es de lo que vive la guarda de
  // sincronización.
  const semilla = await leer(page, "antrack-semilla");
  expect(semilla.tareas).toHaveLength(inbox.tasks.length);
  expect(semilla.habitos).toHaveLength(habitos.length);

  // El tour de bienvenida sigue saliendo: la muestra no lo sustituye.
  await expect(page.locator(".onb-skip")).toBeVisible();
});

test("recargar no siembra otra vez", async ({ page }) => {
  await perfilNuevo(page);
  const antes = (await leer(page, "anso-projects")).find((p) => p.id === "__inbox__").tasks.length;
  const habitosAntes = (await leer(page, "antrack-habits")).length;

  await page.reload();
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });

  const despues = (await leer(page, "anso-projects")).find((p) => p.id === "__inbox__").tasks.length;
  expect(despues).toBe(antes);
  expect((await leer(page, "antrack-habits")).length).toBe(habitosAntes);
});

test("a quien ya tiene tareas no se le siembra encima", async ({ page }) => {
  await page.goto("/?app");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("anso-projects", JSON.stringify([{
      id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z",
      sectionId: null, archived: false, icon: "", color: "",
      tasks: [{ id: "t1", text: "Mi tarea de siempre", done: false, dueDate: null, subtasks: [], log: {} }],
    }]));
  });
  await page.goto("/?app");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });

  const inbox = (await leer(page, "anso-projects")).find((p) => p.id === "__inbox__");
  expect(inbox.tasks.map((tk) => tk.text)).toEqual(["Mi tarea de siempre"]);
  expect(await leer(page, "antrack-habits")).toBeNull();
  expect(await leer(page, "antrack-semilla")).toBeNull();
});
