// @ts-check
import { describe, it, expect } from "vitest";
import {
  sanitizeSubtasks,
  sanitizeTasks,
  sanitizeProject,
} from "../sanitize.js";

// ────────────────────────────────────────────────────────────────
// sanitizeSubtasks
// ────────────────────────────────────────────────────────────────
describe("sanitizeSubtasks", () => {
  it("devuelve [] para input no-array", () => {
    expect(sanitizeSubtasks(null)).toEqual([]);
    expect(sanitizeSubtasks("texto")).toEqual([]);
  });

  it("normaliza subtarea válida", () => {
    const [s] = sanitizeSubtasks([{ id: "s1", text: "  Subtarea  ", done: true }]);
    expect(s.id).toBe("s1");
    expect(s.text).toBe("Subtarea");
    expect(s.done).toBe(true);
  });

  it("genera id si falta", () => {
    const [s] = sanitizeSubtasks([{ text: "sin id" }]);
    expect(typeof s.id).toBe("string");
    expect(s.id.length).toBeGreaterThan(0);
  });

  it("filtra entradas sin text", () => {
    const res = sanitizeSubtasks([{ id: "x" }, { id: "y", text: "ok" }]);
    expect(res).toHaveLength(1);
    expect(res[0].text).toBe("ok");
  });

  it("trunca text a 120 caracteres", () => {
    const [s] = sanitizeSubtasks([{ text: "a".repeat(200) }]);
    expect(s.text.length).toBe(120);
  });
});

// ────────────────────────────────────────────────────────────────
// sanitizeTasks
// ────────────────────────────────────────────────────────────────
describe("sanitizeTasks", () => {
  it("devuelve [] para input no-array", () => {
    expect(sanitizeTasks(null)).toEqual([]);
  });

  it("normaliza tarea válida", () => {
    const [t] = sanitizeTasks([{
      id: "t1", text: " Tarea ", done: false, priority: "high",
      dueDate: "2026-06-01",
    }]);
    expect(t.id).toBe("t1");
    expect(t.text).toBe("Tarea");
    expect(t.done).toBe(false);
    expect(t.priority).toBe("high");
    expect(t.dueDate).toBe("2026-06-01");
  });

  it("reemplaza prioridad inválida con null", () => {
    const [t] = sanitizeTasks([{ text: "x", priority: "ultra" }]);
    expect(t.priority).toBeNull();
  });

  it("reemplaza dueDate con formato inválido con null", () => {
    const [t] = sanitizeTasks([{ text: "x", dueDate: "mañana" }]);
    expect(t.dueDate).toBeNull();
  });

  it("acepta dueDate con formato YYYY-MM-DD correcto", () => {
    const [t] = sanitizeTasks([{ text: "x", dueDate: "2026-12-31" }]);
    expect(t.dueDate).toBe("2026-12-31");
  });

  it("timeLogged negativo → 0", () => {
    const [t] = sanitizeTasks([{ text: "x", timeLogged: -5 }]);
    expect(t.timeLogged).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────
// sanitizeProject
// ────────────────────────────────────────────────────────────────
describe("sanitizeProject", () => {
  it("normaliza proyecto válido", () => {
    const p = sanitizeProject({
      id: "p1", name: " Mi proyecto ", tasks: [],
      sectionId: "sec1", archived: false,
    });
    expect(p.id).toBe("p1");
    expect(p.name).toBe("Mi proyecto");
    expect(p.sectionId).toBe("sec1");
    expect(p.archived).toBe(false);
  });

  it("nombre por defecto si falta", () => {
    const p = sanitizeProject({ id: "p1" });
    expect(p.name).toBe("Sin nombre");
  });

  it("trunca nombre a 60 caracteres", () => {
    const p = sanitizeProject({ name: "a".repeat(80) });
    expect(p.name.length).toBe(60);
  });

  it("archived coerciona truthy correctamente", () => {
    expect(sanitizeProject({ archived: 1 }).archived).toBe(true);
    expect(sanitizeProject({ archived: 0 }).archived).toBe(false);
    expect(sanitizeProject({}).archived).toBe(false);
  });
});
