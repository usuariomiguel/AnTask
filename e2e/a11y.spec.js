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

async function loadFresh(page) {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antask_consent", "essential");
  });
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15_000 });
  await page.evaluate(() => {
    const b = document.getElementById("consent-banner");
    if (b) b.style.display = "none";
  });
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
  await page.waitForSelector("#task-input", { state: "visible" });
  await page.fill("#task-input", "Tarea a11y");
  await page.press("#task-input", "Enter");
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
