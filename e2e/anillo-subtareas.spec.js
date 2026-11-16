// Anillo de subtareas en la casilla: hasta 8 subtareas se dibuja; con más,
// los arcos no se leen y queda la casilla normal. Con 0 hechas no asoma el
// punto del arco de acento vacío. Al marcar una subtarea el anillo avanza.
import { test, expect } from "@playwright/test";

const subs = (n, hechas) => Array.from({ length: n }, (_, i) => ({ id: `s${n}-${i}`, text: `sub ${i}`, done: i < hechas }));

test("anillo hasta 8 subtareas, casilla normal con más", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto("/");
  await page.evaluate((proyectos) => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("anso-projects", JSON.stringify(proyectos));
    localStorage.setItem("anso-active-project", "__inbox__");
  }, [{ id: "__inbox__", name: "Inbox", tasks: [
    { id: "a", text: "Ocho subtareas", done: false, subtasks: subs(8, 0) },
    { id: "b", text: "Nueve subtareas", done: false, subtasks: subs(9, 3) },
  ] }]);
  await page.goto("/");
  const ocho = page.locator(".task-item", { hasText: "Ocho subtareas" });
  const nueve = page.locator(".task-item", { hasText: "Nueve subtareas" });
  await expect(ocho).toBeVisible({ timeout: 15000 });

  await expect(ocho.locator(".task-subring")).toHaveCount(1);
  await expect(ocho.locator(".task-toggle-wrap")).toHaveClass(/con-subtareas/);
  await expect(ocho.locator(".task-subring-fill")).toHaveCSS("visibility", "hidden");

  await expect(nueve.locator(".task-subring")).toHaveCount(0);
  await expect(nueve.locator(".task-toggle-wrap")).not.toHaveClass(/con-subtareas/);

  // Marcar una subtarea desde el detalle: el arco de acento aparece.
  await ocho.locator(".task-text").click();
  const sub = page.locator(".task-detail-wrap").getByRole("checkbox").nth(1);
  await sub.check();
  await expect(ocho.locator(".task-toggle-wrap")).toHaveAttribute("data-subtareas", "1/8");
  await expect(ocho.locator(".task-subring-fill").first()).toHaveCSS("visibility", "visible");
  expect(errores).toEqual([]);
});
