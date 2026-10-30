// La primera tarea creada al abrir la app, antes de que la sesión de
// sincronización esté lista, no debe perderse cuando llega la nube.
// Firebase se carga aparte y tarda: lo creado en ese rato no estaba en la
// caché de la cuenta, y al conectar la nube (o esa caché) lo sustituía.
import { test, expect } from "@playwright/test";

const UID = "u-test";
const inbox = (tasks) => ({ id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks });
const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

for (const caso of ["nube más nueva", "caché más nueva"]) {
  test("la tarea creada antes de conectar sobrevive (" + caso + ")", async ({ page }) => {
    // Sin red hacia Firebase: la conexión la simula el test.
    await page.route(/googleapis|gstatic|firebase/, (r) => r.abort());
    await page.goto("/");
    await page.evaluate(([uid, base, cacheNueva]) => {
      localStorage.clear();
      localStorage.setItem("antrack_consent", "essential");
      localStorage.setItem("antrack-onboarded", "1");
      localStorage.setItem("antrack_lang", "es");
      localStorage.setItem("antrack_swipe_hinted", "1");
      localStorage.setItem("anso-projects", JSON.stringify(base));
      localStorage.setItem("anso-projects-" + uid, JSON.stringify(base));
      const hace = new Date(Date.now() - (cacheNueva ? 1000 : 3600e3)).toISOString();
      localStorage.setItem("anso-meta-" + uid, JSON.stringify({ lastSavedAt: hace }));
    }, [UID, [inbox([T("a", "Tarea de siempre")])], caso === "caché más nueva"]);
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Se crea la tarea mientras la app aún no ve la sesión.
    await page.locator("#mobile-fab").tap();
    await page.locator(".quick-capture-input").fill("Llamar al fontanero");
    await page.locator(".quick-capture-input").press("Enter");
    await page.waitForTimeout(400);

    // Llega la sesión y, con ella, la nube (sin la tarea nueva).
    const textos = await page.evaluate(([uid, nube, nubeNueva]) => {
      window.AnsoSync = { getUser: () => ({ uid }), scheduleSave: () => {} };
      const ms = Date.now() + (nubeNueva ? 60000 : -7200e3);
      window._ansoSyncCallbacks.onFirstConnect({ projects: nube, habits: [], updatedAt: { toMillis: () => ms } });
      return JSON.parse(localStorage.getItem("anso-projects")).flatMap((p) => p.tasks.map((t) => t.text));
    }, [UID, [inbox([T("a", "Tarea de siempre")])], caso === "nube más nueva"]);

    expect(textos).toContain("Llamar al fontanero");
    expect(textos).toContain("Tarea de siempre");
    expect(textos.filter((x) => x === "Llamar al fontanero")).toHaveLength(1);
  });
}
