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

async function loadFresh(page, seed) {
  await page.goto("/");
  await page.evaluate((seed) => {
    localStorage.clear();
    localStorage.setItem("antask_consent", "essential");
    // El tour de onboarding taparía la pantalla auditada
    localStorage.setItem("antask-onboarded", "1");
    // Idioma fijo: la config de Playwright no fija locale, así que sin
    // esto los tests que buscan por texto dependerían de la máquina.
    localStorage.setItem("antask_lang", "es");
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
  await page.waitForTimeout(400);
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
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
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

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
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
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
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

test("a11y: diálogo de renombrar lista", async ({ page }) => {
  await loadFresh(page, true);
  await ctxMenu(page, /Renombrar|Rename/);
  await auditModal(page, "modal-prompt-renombrar");
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
