// Enlaces adjuntos en el detalle de tarea: se añaden escribiendo o
// pegando, se abren en otra pestaña, se quitan, y se guardan con la tarea.
import { test, expect } from "@playwright/test";

async function carga(page, modo = "full", links = []) {
  await page.goto("/");
  await page.evaluate(([modo, links]) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", modo);
    localStorage.setItem("antrack_swipe_hinted", "1");
    const T = (id, text, extra = {}) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [], ...extra });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("a", "Informe", { links })] },
    ]));
  }, [modo, links]);
  await page.goto("/");
  await page.waitForTimeout(1000);
}
const guardados = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[1].tasks[0].links || []);

test.describe("PC", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  async function abrir(page) {
    await page.click("li[data-project-id='p1']");
    await page.waitForTimeout(400);
    await page.locator(".task-item", { hasText: "Informe" }).locator(".task-text").click();
    await page.waitForTimeout(500);
  }

  test("añadir escribiendo, abrir en otra pestaña y quitar", async ({ page }) => {
    const errores = []; page.on("pageerror", (e) => errores.push(e.message));
    await carga(page);
    await abrir(page);
    const input = page.locator("#task-detail-link-input");
    await input.fill("github.com/usuario/mi-proyecto");
    await input.press("Enter");
    const fila = page.locator(".task-link").first();
    await expect(fila.locator(".task-link-titulo")).toHaveText("Mi proyecto");
    await expect(fila.locator(".task-link-dominio")).toHaveText("github.com");
    await expect(fila.locator("a")).toHaveAttribute("href", "https://github.com/usuario/mi-proyecto");
    await expect(fila.locator("a")).toHaveAttribute("target", "_blank");
    await expect(fila.locator("a")).toHaveAttribute("rel", /noopener/);
    await expect(input).toHaveValue("");
    await expect(page.locator("#task-detail-link-count")).toHaveText(" · 1");
    expect((await guardados(page)).map((l) => l.url)).toEqual(["https://github.com/usuario/mi-proyecto"]);
    // La fila de la lista lo indica tras el título.
    const ind = page.locator(".task-item", { hasText: "Informe" }).locator(".title-links");
    await expect(ind).toHaveText("1");
    await expect(ind).toHaveAttribute("aria-label", "1 enlace");

    await fila.locator(".task-link-quitar").click();
    await page.waitForTimeout(400);
    await expect(page.locator(".task-link")).toHaveCount(0);
    expect(await guardados(page)).toEqual([]);
    expect(errores).toEqual([]);
  });

  test("lo que no es un enlace no se añade y se marca el campo", async ({ page }) => {
    await carga(page);
    await abrir(page);
    const input = page.locator("#task-detail-link-input");
    for (const malo of ["hola que tal", "javascript:alert(1)"]) {
      await input.fill(malo);
      await input.press("Enter");
      await expect(input).toHaveClass(/campo-no-valido/);
      await expect(input).toHaveValue(malo);
    }
    expect(await guardados(page)).toEqual([]);
  });

  test("pegar un enlace en el campo lo añade directamente, y sobrevive a recargar", async ({ page }) => {
    await carga(page);
    await abrir(page);
    await page.locator("#task-detail-link-input").focus();
    await page.evaluate(() => {
      const dt = new DataTransfer(); dt.setData("text/plain", "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit");
      document.getElementById("task-detail-link-input").dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
    });
    // Un id de documento no es un nombre: sale el dominio, y no repetido.
    await expect(page.locator(".task-link .task-link-titulo")).toHaveText("docs.google.com");
    await expect(page.locator(".task-link .task-link-dominio")).toHaveCount(0);
    await page.reload(); await page.waitForTimeout(1000);
    await abrir(page);
    await expect(page.locator(".task-link")).toHaveCount(1);
  });
});

test.describe("móvil", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("se ven y se abren en la pantalla de detalle", async ({ page }) => {
    await carga(page, "full", [{ id: "l1", url: "https://www.figma.com/file/xyz/diseno-app", title: "Diseno app" }]);
    await page.locator("#bnav-inbox-btn").tap(); await page.waitForTimeout(500);
    await page.locator(".task-item", { hasText: "Informe" }).evaluate((el) => {
      const r = el.getBoundingClientRect();
      el.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: r.left + 120, clientY: r.top + r.height / 2 }));
    });
    await page.waitForTimeout(300);
    await page.locator(".ctx-item", { hasText: "Ver detalles" }).tap();
    await page.waitForTimeout(600);
    await expect(page.locator(".task-link .task-link-titulo")).toHaveText("Diseno app");
    await expect(page.locator(".task-link .task-link-dominio")).toHaveText("figma.com");
    await expect(page.locator(".task-link a")).toHaveAttribute("href", "https://www.figma.com/file/xyz/diseno-app");
  });
});
