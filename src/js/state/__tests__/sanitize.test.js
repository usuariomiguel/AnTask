// @ts-check
import { describe, it, expect } from "vitest";
import {
  sanitizeSubtasks,
  sanitizeTasks,
  sanitizeProject,
  sanitizeStandaloneNote,
  sanitizeSmartList,
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
      dueDate: "2026-06-01", labels: ["work"],
    }]);
    expect(t.id).toBe("t1");
    expect(t.text).toBe("Tarea");
    expect(t.done).toBe(false);
    expect(t.priority).toBe("high");
    expect(t.dueDate).toBe("2026-06-01");
    expect(t.labels).toEqual(["work"]);
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

  it("filtra labels que no son string", () => {
    const [t] = sanitizeTasks([{ text: "x", labels: [1, null, "ok"] }]);
    expect(t.labels).toEqual(["ok"]);
  });

  it("limita labels a 10 máximo", () => {
    const labels = Array.from({ length: 15 }, (_, i) => `l${i}`);
    const [t] = sanitizeTasks([{ text: "x", labels }]);
    expect(t.labels).toHaveLength(10);
  });

  it("status 'progress' y 'waiting' son válidos, otros → null", () => {
    const tasks = sanitizeTasks([
      { text: "a", status: "progress" },
      { text: "b", status: "waiting" },
      { text: "c", status: "activo" },
    ]);
    expect(tasks[0].status).toBe("progress");
    expect(tasks[1].status).toBe("waiting");
    expect(tasks[2].status).toBeNull();
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
      id: "p1", name: " Mi proyecto ", tasks: [], notes: "<b>Nota</b>",
      labels: ["dev"], sectionId: "sec1", archived: false,
    });
    expect(p.id).toBe("p1");
    expect(p.name).toBe("Mi proyecto");
    expect(p.labels).toEqual(["dev"]);
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

  it("notas con XSS son sanitizadas", () => {
    const p = sanitizeProject({ notes: '<script>alert(1)</script><b>ok</b>' });
    expect(p.notes).not.toContain("<script>");
    expect(p.notes).toContain("<b>ok</b>");
  });

  it("archived coerciona truthy correctamente", () => {
    expect(sanitizeProject({ archived: 1 }).archived).toBe(true);
    expect(sanitizeProject({ archived: 0 }).archived).toBe(false);
    expect(sanitizeProject({}).archived).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
// sanitizeStandaloneNote
// ────────────────────────────────────────────────────────────────
describe("sanitizeStandaloneNote", () => {
  it("normaliza nota válida", () => {
    const n = sanitizeStandaloneNote({
      id: "n1", name: "Mis ideas", content: "<p>texto</p>",
    });
    expect(n.id).toBe("n1");
    expect(n.name).toBe("Mis ideas");
    expect(n.content).toContain("texto");
  });

  it("content con XSS es sanitizado", () => {
    const n = sanitizeStandaloneNote({ content: '<img onerror="pwn()" src="x">' });
    expect(n.content).not.toContain("onerror");
  });

  it("nombre por defecto si falta", () => {
    const n = sanitizeStandaloneNote({});
    expect(n.name).toBe("Sin título");
  });
});

// ────────────────────────────────────────────────────────────────
// sanitizeSmartList
// ────────────────────────────────────────────────────────────────
describe("sanitizeSmartList", () => {
  it("devuelve null para input no-objeto", () => {
    expect(sanitizeSmartList(null)).toBeNull();
    expect(sanitizeSmartList("string")).toBeNull();
  });

  it("normaliza smart list válida", () => {
    const sl = sanitizeSmartList({
      id: "sl1", name: "Urgentes", icon: "🔥",
      filters: { status: "pending", priority: "high", dueDate: "today", label: "dev" },
    });
    expect(sl).not.toBeNull();
    expect(sl?.filters.status).toBe("pending");
    expect(sl?.filters.priority).toBe("high");
    expect(sl?.filters.dueDate).toBe("today");
    expect(sl?.filters.label).toBe("dev");
  });

  it("valores de filtro inválidos → defaults", () => {
    const sl = sanitizeSmartList({
      filters: { status: "xD", priority: "ultra", dueDate: "ayer" },
    });
    expect(sl?.filters.status).toBe("pending");
    expect(sl?.filters.priority).toBe("any");
    expect(sl?.filters.dueDate).toBe("any");
  });

  it("label vacío → null", () => {
    const sl = sanitizeSmartList({ filters: { label: "" } });
    expect(sl?.filters.label).toBeNull();
  });
});
