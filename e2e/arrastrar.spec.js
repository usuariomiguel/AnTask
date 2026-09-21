// @ts-check
// Arrastrar tareas: desde el Inbox también se sueltan en listas las tareas
// de otras listas que enseña, pero solo se reordena entre las de la lista abierta.
import { test, expect } from "@playwright/test";
test.setTimeout(120000);
async function carga(page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential"); localStorage.setItem("antrack-onboarded", "1"); localStorage.setItem("antrack_lang", "es"); localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("a", "Suelta")] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f", tasks: [T("t1", "Informe"), T("t2", "Correo"), T("t3", "Llamada")] },
      { id: "p2", name: "Casa", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#3d8fb0", tasks: [] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector(".project-item-inbox", { state: "visible", timeout: 15000 });
}
const estado = (page) => page.evaluate(() => Object.fromEntries(JSON.parse(localStorage.getItem("anso-projects")).map(p => [p.id, p.tasks.map(t => t.id).join(",")])));

test("desde Inbox: tarea de otra lista a una lista", async ({ page }) => {
  await carga(page);
  await page.click(".project-item-inbox"); await page.waitForTimeout(600);
  await page.locator(".task-item", { hasText: "Informe" }).dragTo(page.locator("li[data-project-id='p2']"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a", p1: "t2,t3", p2: "t1" });
  // a su propia lista: no hace nada
  await page.locator(".task-item", { hasText: "Correo" }).dragTo(page.locator("li[data-project-id='p1']"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a", p1: "t2,t3", p2: "t1" });
  // al Inbox fijado: pasa a vivir en el Inbox
  await page.locator(".task-item", { hasText: "Correo" }).dragTo(page.locator(".project-item-inbox"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a,t2", p1: "t3", p2: "t1" });
  // la tarea del propio Inbox también
  await page.locator(".task-item", { hasText: "Suelta" }).dragTo(page.locator("li[data-project-id='p1']"));
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "t2", p1: "t3,a", p2: "t1" });
});

test("reordenar: sí dentro de la lista, no con tareas ajenas en el Inbox", async ({ page }) => {
  await carga(page);
  await page.click("li[data-project-id='p1']"); await page.waitForTimeout(600);
  const llamada = page.locator(".task-item", { hasText: "Llamada" });
  const informe = page.locator(".task-item", { hasText: "Informe" });
  await llamada.dragTo(informe, { targetPosition: { x: 40, y: 4 } });
  await page.waitForTimeout(300);
  expect((await estado(page)).p1).toBe("t3,t1,t2");
  await page.click(".project-item-inbox"); await page.waitForTimeout(600);
  await page.locator(".task-item", { hasText: "Correo" }).dragTo(page.locator(".task-item", { hasText: "Suelta" }), { targetPosition: { x: 40, y: 4 } });
  await page.locator(".task-item", { hasText: "Suelta" }).dragTo(page.locator(".task-item", { hasText: "Correo" }), { targetPosition: { x: 40, y: 4 } });
  await page.waitForTimeout(300);
  expect(await estado(page)).toEqual({ __inbox__: "a", p1: "t3,t1,t2", p2: "" });
});

// ── Reordenar arrastrando dentro de una lista ──
// La línea de destino no se recrea en cada dragover (palpitaba) ni empuja
// las filas, y la tarea cae exactamente en el hueco que marca.

async function cargaLista(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
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
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f",
        tasks: [T("a", "A"), T("b", "B"), T("c", "C"), T("d", "D"), T("e", "E")] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(600);
}

// Arrastra `origen` y pasea el ratón por `destino` en las alturas dadas
// (relativas a su mitad), luego suelta en la última. Devuelve cuántas
// líneas distintas se crearon, cuántas veces se movió y el orden final.
function arrastrar(page, origen, destino, desplazamientos) {
  return page.evaluate(([origen, destino, desplazamientos]) => {
    const fila = (t) => [...document.querySelectorAll("#task-list .task-item")].find((el) => el.querySelector(".task-text").textContent.trim() === t);
    const src = fila(origen), dst = fila(destino);
    src.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    const dt = new DataTransfer();
    src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
    const r = dst.getBoundingClientRect();
    const mitad = r.top + r.height / 2;
    const lineas = new Set();
    let movimientos = 0, ultimoTop = null;
    for (const d of desplazamientos) {
      dst.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 40, clientY: mitad + d }));
      const l = document.querySelector("#task-list .drop-indicator");
      if (l) { lineas.add(l); if (l.style.top !== ultimoTop) { movimientos++; ultimoTop = l.style.top; } }
    }
    const filasMovidas = dst.getBoundingClientRect().top !== r.top;
    dst.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 40, clientY: mitad + desplazamientos[desplazamientos.length - 1] }));
    src.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
    return { lineas: lineas.size, movimientos, filasMovidas };
  }, [origen, destino, desplazamientos]);
}
const orden = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[1].tasks.map((t) => t.text).join(""));

test("cae exactamente donde marca la línea", async ({ page }) => {
  await cargaLista(page);
  // Hacia abajo, delante de D (mitad de arriba): A pasa entre C y D
  await arrastrar(page, "A", "D", [-15]);
  expect(await orden(page)).toBe("BCADE");
  await page.waitForTimeout(400);
  // Hacia abajo, detrás de D
  await arrastrar(page, "B", "D", [15]);
  expect(await orden(page)).toBe("CADBE");
  await page.waitForTimeout(400);
  // Hacia arriba, delante de C
  await arrastrar(page, "E", "C", [-15]);
  expect(await orden(page)).toBe("ECADB");
});

// ── Hueco al arrastrar ──
// En una lista normal las filas se apartan y dejan hueco (sin línea); en el
// Inbox con tareas de otras listas se mantiene la línea.

async function cargaHueco(page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("antrack_consent", "essential");
    localStorage.setItem("antrack-onboarded", "1");
    localStorage.setItem("antrack_lang", "es");
    localStorage.setItem("antrack-mode", "full");
    const T = (id, text) => ({ id, text, comment: "", done: false, priority: null, dueDate: null, recurDays: null, reminderAt: null, timeLogged: 0, log: {}, subtasks: [] });
    localStorage.setItem("anso-projects", JSON.stringify([
      { id: "__inbox__", name: "Inbox", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "", tasks: [T("x", "Suelta")] },
      { id: "p1", name: "Trabajo", createdAt: "2026-01-01T00:00:00.000Z", sectionId: null, archived: false, icon: "", color: "#b0473f",
        tasks: [T("a", "A"), T("b", "B"), T("c", "C"), T("d", "D"), T("e", "E")] },
    ]));
  });
  await page.goto("/");
  await page.waitForSelector("li[data-project-id='p1']", { timeout: 15000 });
  await page.click("li[data-project-id='p1']");
  await page.waitForTimeout(700);
}

// Arrastra `origen`, pasea el ratón por las alturas (relativas a la mitad de
// `sobre`) y suelta o cancela. Devuelve los transform en el último paso.
function arrastrarHueco(page, origen, sobre, desplazamientos, soltar) {
  return page.evaluate(async ([origen, sobre, desplazamientos, soltar]) => {
    const fila = (t) => [...document.querySelectorAll("#task-list .task-item")].find((el) => el.querySelector(".task-text").textContent.trim() === t);
    const lista = document.getElementById("task-list");
    const src = fila(origen), ref = fila(sobre);
    src.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    const dt = new DataTransfer();
    src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
    await new Promise((r) => setTimeout(r, 30));
    const r = ref.getBoundingClientRect();
    const mitad = r.top + r.height / 2;
    const conHueco = lista.classList.contains("lista-con-hueco");
    let cambios = 0, ultimo = null;
    for (const d of desplazamientos) {
      lista.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: dt, clientX: r.left + 40, clientY: mitad + d }));
      const firma = [...lista.querySelectorAll(".task-item")].map((el) => el.style.transform).join("|");
      if (firma !== ultimo) { cambios++; ultimo = firma; }
    }
    const transforms = [...lista.querySelectorAll(".task-item")].map((el) => el.querySelector(".task-text").textContent.trim() + ":" + (el.style.transform || "-"));
    const linea = !!lista.querySelector(".drop-indicator");
    if (soltar) lista.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: dt, clientY: mitad + desplazamientos[desplazamientos.length - 1] }));
    src.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
    return { conHueco, cambios, transforms, linea };
  }, [origen, sobre, desplazamientos, soltar]);
}
const ordenHueco = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("anso-projects"))[1].tasks.map((t) => t.text).join(""));
const restos = (page) => page.evaluate(() => [...document.querySelectorAll("#task-list .task-item")].filter((el) => el.style.transform || el.classList.contains("drag-oculta")).length);

test("las filas abren hueco y la tarea cae en él", async ({ page }) => {
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await cargaHueco(page);
  // A hacia abajo, a la mitad de abajo de C: B y C suben, hueco entre C y D.
  const r = await arrastrarHueco(page, "A", "C", [15], true);
    expect(r.conHueco).toBe(true);
  expect(r.linea).toBe(false);
  await page.waitForTimeout(500);
  expect(await ordenHueco(page)).toBe("BCADE");
  expect(await restos(page)).toBe(0);

  // E hacia arriba, a la mitad de arriba de C: C y D bajan.
  const r2 = await arrastrarHueco(page, "E", "C", [-15], true);
    await page.waitForTimeout(500);
  expect(await ordenHueco(page)).toBe("BECAD");
  expect(errores).toEqual([]);
});

test("sin rebotes cerca del límite y al cancelar vuelve todo", async ({ page }) => {
  await cargaHueco(page);
  const temblor = Array.from({ length: 30 }, (_, i) => (i % 2 ? 5 : -5));
  const r = await arrastrarHueco(page, "A", "D", temblor, false);
    expect(r.cambios).toBe(1);
  await page.waitForTimeout(400);
  expect(await ordenHueco(page)).toBe("ABCDE");
  expect(await restos(page)).toBe(0);
});

test("en el Inbox con tareas de otras listas sigue la línea", async ({ page }) => {
  await cargaHueco(page);
  await page.click(".project-item-inbox");
  await page.waitForTimeout(600);
  const hueco = await page.evaluate(() => {
    const src = document.querySelector("#task-list .task-item");
    src.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    const dt = new DataTransfer();
    src.dispatchEvent(new DragEvent("dragstart", { bubbles: true, dataTransfer: dt }));
    const res = document.getElementById("task-list").classList.contains("lista-con-hueco");
    src.dispatchEvent(new DragEvent("dragend", { bubbles: true, dataTransfer: dt }));
    return res;
  });
  expect(hueco).toBe(false);
});
