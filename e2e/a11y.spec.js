// @ts-check
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

const REPORT_DIR = "test-results/a11y-reports";
fs.mkdirSync(REPORT_DIR, { recursive: true });

function critical(violations) {
  return violations.filter(v => v.impact === "critical" || v.impact === "serious");
}

function writeReport(name, results) {
  const issues = critical(results.violations);
  const simplified = issues.map(v => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    helpUrl: v.helpUrl,
    nodes: v.nodes.map(n => ({
      target: n.target,
      html: n.html.slice(0, 200),
      failureSummary: n.failureSummary,
    })),
  }));
  fs.writeFileSync(path.join(REPORT_DIR, name + ".json"), JSON.stringify(simplified, null, 2));
  return issues;
}

/**
 * Espera a que acaben las animaciones finitas (las infinitas, como un
 * spinner, no acaban nunca y se ignoran).
 *
 * axe mide el color que hay en pantalla en ese instante, mezclando la
 * opacidad de los ancestros. Nada más cargar siguen en marcha el fundido
 * del splash y la entrada escalonada de la cabecera, y a mitad de camino
 * el oliva del filtro activo salía #717951 en vez de #707850: 4,48:1
 * frente al 4,5:1 exigido. El test fallaba según la carga de la máquina,
 * no por el color final, que es el que ve el usuario.
 */
async function esperarAnimaciones(page) {
  await page.waitForFunction(() => document.getAnimations().every((a) =>
    a.playState !== "running" || a.effect?.getComputedTiming().endTime === Infinity
  ), null, { timeout: 5_000 });
}

/** Pasa axe a la página entera con las animaciones ya terminadas. */
async function auditar(page) {
  await esperarAnimaciones(page);
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
}

async function loadFresh(page, seed) {
  await page.goto("/");
  await page.evaluate((seed) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    // El tour de onboarding taparía la pantalla auditada
    localStorage.setItem("antrack-onboarded", "1");
    // Idioma fijo: la config de Playwright no fija locale, así que sin
    // esto los tests que buscan por texto dependerían de la máquina.
    localStorage.setItem("antrack_lang", "es");
    if (seed) {
      localStorage.setItem("anso-projects", JSON.stringify([
        { id: "__inbox__", name: "Inbox", createdAt: new Date().toISOString(),
          sectionId: null, archived: false, icon: "", color: "", tasks: [] },
        { id: "p1", name: "Buceo", createdAt: new Date().toISOString(),
          sectionId: null, archived: false, icon: "", color: "", tasks: [
            { id: "t1", text: "Tarea de prueba", done: false,
              createdAt: new Date().toISOString(), subtasks: [], notes: "" },
          ] },
      ]));
    }
  }, seed);
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
  await page.evaluate(() => {
    const b = document.getElementById("consent-banner");
    if (b) b.style.display = "none";
  });
}

/**
 * Audita SOLO el diálogo abierto.
 *
 * El overlay atenúa el fondo pero no lo oculta, así que analizar la
 * página entera hacía que axe midiese el contraste del contenido de
 * detrás contra un fondo que ya no es el suyo: ruido, y ajeno a lo que
 * se quiere comprobar. Las pantallas de fondo ya tienen sus tres tests.
 */
async function auditModal(page, nombre) {
  await page.waitForSelector(".modal-overlay.modal-visible .modal-box", { timeout: 5_000 });
  // Espera al fundido: a medio camino el contraste medido no es el final.
  await esperarAnimaciones(page);
  const results = await new AxeBuilder({ page })
    .include(".modal-overlay")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const issues = writeReport(nombre, results);
  expect(issues, "Violaciones critical/serious en " + nombre).toEqual([]);
}

/** Abre el menú contextual de la lista "Buceo" y pulsa una entrada. */
async function ctxMenu(page, texto) {
  await page.click(".project-item[data-project-id='p1']", { button: "right" });
  await page.waitForSelector(".ctx-item", { state: "visible", timeout: 5_000 });
  await page.locator(".ctx-item").filter({ hasText: texto }).first().click();
}

test("a11y: pantalla inicial", async ({ page }) => {
  await loadFresh(page);
  const results = await auditar(page);
  const issues = writeReport("initial-screen", results);
  expect(issues, "Violaciones critical/serious en pantalla inicial").toEqual([]);
});

test("a11y: Inbox con tareas", async ({ page }) => {
  await loadFresh(page);
  await page.click(".project-item-inbox");
  // En escritorio la creación va por la captura rápida (prototipo Tierra).
  await page.waitForSelector("#capture-bar", { state: "visible" });
  await page.click("#capture-bar");
  await page.waitForSelector(".quick-capture-input", { state: "visible" });
  await page.fill(".quick-capture-input", "Tarea a11y");
  await page.press(".quick-capture-input", "Enter");
  await page.waitForSelector("#task-list .task-item");

  const results = await auditar(page);
  const issues = writeReport("inbox-tasks", results);
  expect(issues, "Violaciones critical/serious en Inbox con tareas").toEqual([]);
});

test("a11y: menú de perfil abierto", async ({ page }) => {
  await loadFresh(page);
  const profileBtn = page.locator("#profile-btn");
  if (await profileBtn.isVisible().catch(() => false)) {
    await profileBtn.click({ force: true });
    await page.waitForTimeout(300);
  }
  const results = await auditar(page);
  const issues = writeReport("profile-menu", results);
  expect(issues, "Violaciones critical/serious en menú de perfil").toEqual([]);
});

// ═══════════════════════════════════════════════════════════════
// VENTANAS EMERGENTES
//
// El rediseño v1 dejó el contraste de los botones sólidos ajustado
// (el principal ronda 4.6:1 sobre blanco en tema oscuro). Se comprobó
// a mano una vez; estos tests lo vigilan a partir de ahora, junto con
// nombres accesibles, roles y foco.
// ═══════════════════════════════════════════════════════════════

// Renombrar una lista ya no abre ningún diálogo: se edita sobre la propia
// fila de la sidebar (mismo gesto que los títulos de subtarea). Aquí había
// un audit del diálogo con campo de texto que entraba por ahí; se retira
// porque ese diálogo ya NO es alcanzable en escritorio —crear una lista
// también es inline, y #new-project-btn está oculto a propósito—, y solo
// queda como recambio en móvil, donde montar el arranque cuesta más de lo
// que aporta el audit.
//
// Lo que cubría no se pierde del todo: el armazón del diálogo (overlay,
// .modal-box, .modal-btn) lo sigue auditando "confirmar borrado", y un
// campo de texto dentro de una capa lo auditan "captura rápida" y
// "búsqueda global". Lo que ya nadie mira es esa combinación exacta.

test("a11y: historial de hábitos", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const hoy = new Date();
    const menos = (n) => new Date(hoy.getTime() - n * 864e5).toISOString().slice(0, 10);
    const log = {};
    for (let i = 0; i < 20; i++) if (i % 4 !== 0) log[menos(i)] = 1;
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: new Date().toISOString(),
        sectionId: null, archived: false, icon: "", color: "", tasks: [] },
    ]));
    localStorage.setItem("antrack-habits", JSON.stringify([
      { id: "h1", name: "Correr", schedule: "daily", everyNDays: null,
        createdAt: new Date(hoy.getTime() - 20 * 864e5).toISOString(),
        archived: false, log: log },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
  await page.evaluate(() => {
    const b = document.getElementById("consent-banner");
    if (b) b.style.display = "none";
  });
  await page.click(".project-item-today");
  await page.click(".hoy-section--habits .hoy-section-action");
  await auditModal(page, "historial-habitos");
});

test("a11y: renombrar una lista en línea", async ({ page }) => {
  await loadFresh(page, true);
  await page.dblclick(".project-item[data-project-id='p1'] .project-item-name");
  await page.waitForSelector("input.project-inline-edit", { state: "visible", timeout: 5_000 });
  const results = await auditar(page);
  const issues = writeReport("rename-inline", results);
  expect(issues, "Violaciones critical/serious en renombrar en línea").toEqual([]);
});

test("a11y: diálogo de confirmar borrado", async ({ page }) => {
  // Cubre el botón de peligro, el único que no aparece en los demás.
  await loadFresh(page, true);
  await ctxMenu(page, /Eliminar|Delete/);
  await auditModal(page, "modal-confirm-borrado");
});

test("a11y: diálogo de perfil", async ({ page }) => {
  await loadFresh(page);
  await page.evaluate(() => window.showProfileModal && window.showProfileModal());
  await auditModal(page, "modal-perfil");
});

test("a11y: selector de color de lista", async ({ page }) => {
  await loadFresh(page, true);
  await ctxMenu(page, /color/i);
  await auditModal(page, "modal-selector-color");
});

test("a11y: captura rápida", async ({ page }) => {
  await loadFresh(page);
  await page.click("#capture-bar");
  await auditModal(page, "modal-captura-rapida");
});

test("a11y: búsqueda global", async ({ page }) => {
  await loadFresh(page, true);
  await page.keyboard.press("Control+k");
  await auditModal(page, "modal-busqueda");
});

test("a11y: atajos de teclado", async ({ page }) => {
  // Hereda la caja v1 sin haberse rediseñado por dentro: es el que más
  // papeletas tiene de descolgarse.
  await loadFresh(page);
  await page.keyboard.press("?");
  await auditModal(page, "modal-atajos");
});

test("a11y: ajustes", async ({ page }) => {
  await loadFresh(page);
  await page.click("#profile-btn", { force: true });
  await page.waitForTimeout(300);
  await page.click("#pf-settings-btn");
  await auditModal(page, "modal-ajustes");
});

// ═══════════════════════════════════════════════════════════════
// MODO OSCURO
//
// Todo lo de arriba corre en claro (el tema por defecto del navegador
// de Playwright). En oscuro había tres contrastes rotos que nadie vio:
// el «Ctrl + K» del buscador, el nombre de lista en la fila activa del
// buscador y las tareas hechas, atenuadas con opacity hasta 2,6:1.
// Se cubren en el PC, que desde la v2.39 tiene su propia paleta cálida.
// ═══════════════════════════════════════════════════════════════

test.describe("modo oscuro", () => {
  test.use({ colorScheme: "dark" });

  async function cargarOscuro(page) {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("antrack_consent", "essential");
      localStorage.setItem("antrack-onboarded", "1");
      localStorage.setItem("antrack_lang", "es");
      localStorage.setItem("mis-tareas-theme", "dark");
      const hoy = new Date().toISOString().slice(0, 10);
      const T = (id, text, done, dueDate) => ({ id, text, done, dueDate: dueDate || null,
        createdAt: new Date().toISOString(), subtasks: [], notes: "" });
      localStorage.setItem("anso-projects", JSON.stringify([
        { id: "__inbox__", name: "Inbox", createdAt: new Date().toISOString(),
          sectionId: null, archived: false, icon: "", color: "", tasks: [] },
        { id: "p1", name: "Buceo", createdAt: new Date().toISOString(),
          sectionId: null, archived: false, icon: "", color: "", tasks: [
            T("t1", "Tarea hecha", true), T("t2", "Tarea de hoy", false, hoy), T("t3", "Tarea vencida", false, "2026-01-01"),
          ] },
      ]));
      localStorage.setItem("anso-active-project", "p1");
    });
    await page.goto("/");
    await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
    await page.evaluate(() => {
      const b = document.getElementById("consent-banner");
      if (b) b.style.display = "none";
    });
  }

  test("a11y oscuro: lista", async ({ page }) => {
    await cargarOscuro(page);
    await page.click(".project-item[data-project-id='p1']");
    await page.waitForSelector("#task-list .task-item");
    const issues = writeReport("oscuro-lista", await auditar(page));
    expect(issues, "Violaciones critical/serious en la lista (oscuro)").toEqual([]);
  });

  test("a11y oscuro: buscador con una tarea hecha seleccionada", async ({ page }) => {
    await cargarOscuro(page);
    await page.keyboard.press("Control+k");
    await page.waitForSelector(".search-result-done");
    // Lleva la selección a la tarea hecha: es la combinación más apagada.
    for (let i = 0; i < 4; i++) {
      if (await page.locator(".search-result-item--sel.search-result-done").count()) break;
      await page.keyboard.press("ArrowDown");
    }
    await expect(page.locator(".search-result-item--sel.search-result-done")).toHaveCount(1);
    await auditModal(page, "oscuro-buscador");
  });
});
