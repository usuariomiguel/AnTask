// @ts-check
import { describe, it, expect } from "vitest";
import {
  sanitizeSubtasks,
  sanitizeTasks,
  sanitizeProject,
  sanitizeCompletionLog,
  sanitizeHabit,
  sanitizeHabits,
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

  it("log ausente → {}", () => {
    const [t] = sanitizeTasks([{ text: "x" }]);
    expect(t.log).toEqual({});
  });

  it("conserva el log de completados entre cargas", () => {
    const [t] = sanitizeTasks([{ text: "x", log: { "2026-08-20": 1 } }]);
    expect(t.log).toEqual({ "2026-08-20": 1 });
  });
});

// ────────────────────────────────────────────────────────────────
// sanitizeCompletionLog
// ────────────────────────────────────────────────────────────────
describe("sanitizeCompletionLog", () => {
  it("devuelve {} para input que no es objeto", () => {
    expect(sanitizeCompletionLog(null)).toEqual({});
    expect(sanitizeCompletionLog("2026-08-20")).toEqual({});
    expect(sanitizeCompletionLog(42)).toEqual({});
  });

  it("un array no cuela como objeto de fechas", () => {
    expect(sanitizeCompletionLog(["2026-08-20"])).toEqual({});
  });

  it("conserva las entradas con fecha ISO y valor positivo", () => {
    expect(sanitizeCompletionLog({ "2026-08-20": 1, "2026-08-21": 3 }))
      .toEqual({ "2026-08-20": 1, "2026-08-21": 3 });
  });

  it("descarta claves que no son fechas ISO", () => {
    expect(sanitizeCompletionLog({ "ayer": 1, "2026-8-1": 1, "2026-08-20": 1 }))
      .toEqual({ "2026-08-20": 1 });
  });

  it("descarta valores no positivos o no numéricos", () => {
    expect(sanitizeCompletionLog({
      "2026-08-20": 0,
      "2026-08-21": -1,
      "2026-08-22": "sí",
      "2026-08-23": 1,
    })).toEqual({ "2026-08-23": 1 });
  });

  it("acepta valor numérico en texto (viene así de algunos backups)", () => {
    expect(sanitizeCompletionLog({ "2026-08-20": "2" })).toEqual({ "2026-08-20": 2 });
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

// ────────────────────────────────────────────────────────────────
// sanitizeHabit / sanitizeHabits
// ────────────────────────────────────────────────────────────────
describe("sanitizeHabit", () => {
  it("normaliza un hábito válido", () => {
    const h = sanitizeHabit({
      id: "h1", name: "  Correr  ", icon: "🏃", color: "#8a9a5b",
      schedule: "daily", createdAt: "2026-01-01T00:00:00.000Z",
    });
    expect(h.id).toBe("h1");
    expect(h.name).toBe("Correr");
    expect(h.icon).toBe("🏃");
    expect(h.schedule).toBe("daily");
    expect(h.everyNDays).toBeNull();
    expect(h.log).toEqual({});
  });

  it("schedule desconocido → daily", () => {
    expect(sanitizeHabit({ name: "x", schedule: "lunar" }).schedule).toBe("daily");
  });

  it("everyN con N válido se conserva", () => {
    const h = sanitizeHabit({ name: "x", schedule: "everyN", everyNDays: 3 });
    expect(h.schedule).toBe("everyN");
    expect(h.everyNDays).toBe(3);
  });

  it("everyN sin N usable degrada a daily", () => {
    ["ninguno", null, 0, -4].forEach((n) => {
      const h = sanitizeHabit({ name: "x", schedule: "everyN", everyNDays: n });
      expect(h.schedule).toBe("daily");
      expect(h.everyNDays).toBeNull();
    });
  });

  it("everyN de 1 día es lo mismo que daily, y se colapsa", () => {
    const h = sanitizeHabit({ name: "x", schedule: "everyN", everyNDays: 1 });
    expect(h.schedule).toBe("daily");
    expect(h.everyNDays).toBeNull();
  });

  it("acota everyNDays a 365", () => {
    expect(sanitizeHabit({ name: "x", schedule: "everyN", everyNDays: 99999 }).everyNDays).toBe(365);
  });

  it("createdAt inválido → ahora", () => {
    const h = sanitizeHabit({ name: "x", createdAt: "el martes" });
    expect(isNaN(Date.parse(h.createdAt))).toBe(false);
  });

  it("trunca el nombre a 60 caracteres", () => {
    expect(sanitizeHabit({ name: "a".repeat(90) }).name.length).toBe(60);
  });

  it("limpia el log igual que en las tareas", () => {
    const h = sanitizeHabit({ name: "x", log: { "2026-01-01": 1, "ayer": 1, "2026-01-02": 0 } });
    expect(h.log).toEqual({ "2026-01-01": 1 });
  });

  it("no explota con entradas basura", () => {
    expect(sanitizeHabit(null).name).toBe("");
    expect(sanitizeHabit("texto").name).toBe("");
  });
});

describe("sanitizeHabits", () => {
  it("devuelve [] para input no-array", () => {
    expect(sanitizeHabits(null)).toEqual([]);
    expect(sanitizeHabits({})).toEqual([]);
  });

  it("descarta los que se quedan sin nombre", () => {
    const res = sanitizeHabits([{ name: "Correr" }, { name: "   " }, {}, { name: "Leer" }]);
    expect(res.map((h) => h.name)).toEqual(["Correr", "Leer"]);
  });

  it("genera id a los que no lo traen", () => {
    const [h] = sanitizeHabits([{ name: "Correr" }]);
    expect(typeof h.id).toBe("string");
    expect(h.id.length).toBeGreaterThan(0);
  });
});
