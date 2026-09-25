// En móvil el estilo de fila ya no está forzado a «Tarjetas»: se elige en
// Ajustes › Apariencia y se aplica. Al deslizar una fila en «Limpio», el
// contenido que se mueve tapa las acciones que descubre (fondo opaco).
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function carga(page, estilo, modo) {
  await page.goto("/");
  await page.evaluate(([estilo, modo]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", modo);
    localStorage.setItem("antrack_swipe_hinted", "1");
    if (estilo) localStorage.setItem("antrack-row-style", estilo);
    const hoy = new Date().toISOString().slice(0, 10);
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: hoy, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([{ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Llamar al proveedor"), T("b", "Pedir facturas")] }]));
  }, [estilo, modo]);
  await page.goto("/");
  await page.waitForSelector(".today-item", { timeout: 15000 });
  await page.waitForTimeout(600);
}
const estiloAplicado = (page) => page.evaluate(() => document.getElementById("task-list").dataset.rowStyle);

test("el estilo elegido se aplica en móvil", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await carga(page, "limpio", "full");
  expect(await estiloAplicado(page)).toBe("limpio");
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".today-item")).backgroundColor)).toBe("rgba(0, 0, 0, 0)");

  // Y al deslizar, lo que se mueve no deja ver las acciones de debajo: su
  // fondo tiene que ser OPACO. Con el translúcido del lienzo se sumaba al
  // del contenedor y en oscuro se veía la caja de cada fila.
  const fondo = await page.evaluate(() => getComputedStyle(document.querySelector(".task-swipe-content")).backgroundColor);
  expect(fondo).not.toBe("rgba(0, 0, 0, 0)");
  expect(fondo).not.toMatch(/rgba([^)]*,s*0?.d+)/);
  expect(errores).toEqual([]);
});

test("en oscuro las filas de «Limpio» no enseñan su caja", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await carga(page, "limpio", "full");
  await page.evaluate(() => { document.documentElement.dataset.theme = "dark"; });
  await page.waitForTimeout(300);
  const fondo = await page.evaluate(() => getComputedStyle(document.querySelector(".task-swipe-content")).backgroundColor);
  expect(fondo).not.toMatch(/rgba([^)]*,s*0?.d+)/);
});

test("«Tarjetas» sigue siendo lo de siempre", async ({ page }) => {
  await carga(page, "tarjetas", "full");
  expect(await estiloAplicado(page)).toBe("tarjetas");
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".today-item")).backgroundColor)).not.toBe("rgba(0, 0, 0, 0)");
});

test("el ajuste se puede tocar desde el móvil, también en modo simple", async ({ page }) => {
  await carga(page, null, "simple");
  await page.locator("#bnav-settings-btn").tap();
  await page.waitForTimeout(600);
  const seg = page.locator("#settings-rowstyle-seg");
  await expect(seg).toBeVisible();
  await seg.locator("[data-rowstyle-value='limpio']").tap();
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => localStorage.getItem("antrack-row-style"))).toBe("limpio");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  expect(await estiloAplicado(page)).toBe("limpio");
});
