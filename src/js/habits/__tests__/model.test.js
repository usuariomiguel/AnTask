// @ts-check
import { describe, it, expect } from "vitest";
import {
  addDays,
  startDate,
  isDueOn,
  isDoneOn,
  setDoneOn,
  computeStreak,
  statsBetween,
  mergeLogs,
  mergeHabits,
} from "../model.js";

/** Hábito de prueba con valores por defecto sensatos. */
function h(over) {
  return Object.assign({
    id: "h1",
    name: "Correr",
    icon: "",
    color: "",
    schedule: "daily",
    everyNDays: null,
    createdAt: "2026-01-01T08:00:00.000Z",
    archived: false,
    log: {},
  }, over || {});
}

/** Log a partir de una lista de fechas. */
function log(...fechas) {
  const o = {};
  fechas.forEach(f => { o[f] = 1; });
  return o;
}

// ────────────────────────────────────────────────────────────────
describe("addDays", () => {
  it("suma y resta días", () => {
    expect(addDays("2026-01-10", 1)).toBe("2026-01-11");
    expect(addDays("2026-01-10", -1)).toBe("2026-01-09");
    expect(addDays("2026-01-10", 0)).toBe("2026-01-10");
  });

  it("cruza fin de mes y fin de año", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("respeta los años bisiestos", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29");
  });

  it("no se descuadra al cruzar el cambio de hora", () => {
    // Último domingo de marzo y de octubre en la UE: días de 23 h y 25 h.
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-24", 1)).toBe("2026-10-25");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
  });
});

// ────────────────────────────────────────────────────────────────
describe("startDate", () => {
  it("saca la parte de fecha de createdAt", () => {
    expect(startDate(h({ createdAt: "2026-05-20T23:30:00.000Z" }))).toBe("2026-05-20");
  });

  it("cae a hoy si createdAt no sirve", () => {
    const hoy = new Date().toISOString().slice(0, 10);
    expect(startDate(h({ createdAt: "ayer" }))).toBe(hoy);
    expect(startDate(h({ createdAt: null }))).toBe(hoy);
  });
});

// ────────────────────────────────────────────────────────────────
describe("isDueOn", () => {
  it("diario toca todos los días desde su creación", () => {
    const x = h({ createdAt: "2026-01-10T00:00:00.000Z" });
    expect(isDueOn(x, "2026-01-10")).toBe(true);
    expect(isDueOn(x, "2026-01-11")).toBe(true);
    expect(isDueOn(x, "2026-02-01")).toBe(true);
  });

  it("nunca tocaba antes de existir", () => {
    const x = h({ createdAt: "2026-01-10T00:00:00.000Z" });
    expect(isDueOn(x, "2026-01-09")).toBe(false);
    expect(isDueOn(x, "2025-12-31")).toBe(false);
  });

  it("everyN toca cada N días contando desde createdAt", () => {
    const x = h({ schedule: "everyN", everyNDays: 3, createdAt: "2026-01-01T00:00:00.000Z" });
    expect(isDueOn(x, "2026-01-01")).toBe(true);
    expect(isDueOn(x, "2026-01-02")).toBe(false);
    expect(isDueOn(x, "2026-01-03")).toBe(false);
    expect(isDueOn(x, "2026-01-04")).toBe(true);
    expect(isDueOn(x, "2026-01-07")).toBe(true);
  });

  it("everyN sigue cuadrando meses después (sin deriva)", () => {
    const x = h({ schedule: "everyN", everyNDays: 7, createdAt: "2026-01-01T00:00:00.000Z" });
    expect(isDueOn(x, "2026-04-02")).toBe(true);  // 91 días = 13 semanas
    expect(isDueOn(x, "2026-04-03")).toBe(false);
  });

  it("un hábito archivado no toca nunca", () => {
    expect(isDueOn(h({ archived: true }), "2026-06-01")).toBe(false);
  });

  it("rechaza fechas con formato inválido", () => {
    expect(isDueOn(h(), "2026-6-1")).toBe(false);
    expect(isDueOn(h(), "mañana")).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────
describe("isDoneOn / setDoneOn", () => {
  it("marca y desmarca un día", () => {
    const x = h();
    expect(isDoneOn(x, "2026-01-05")).toBe(false);
    setDoneOn(x, "2026-01-05", true);
    expect(isDoneOn(x, "2026-01-05")).toBe(true);
    setDoneOn(x, "2026-01-05", false);
    expect(isDoneOn(x, "2026-01-05")).toBe(false);
  });

  it("desmarcar un día que no estaba no rompe nada", () => {
    const x = h();
    setDoneOn(x, "2026-01-05", false);
    expect(x.log).toEqual({});
  });

  it("ignora fechas con formato inválido", () => {
    const x = h();
    setDoneOn(x, "ayer", true);
    expect(x.log).toEqual({});
  });
});

// ────────────────────────────────────────────────────────────────
describe("computeStreak", () => {
  it("cuenta días consecutivos hacia atrás", () => {
    const x = h({ log: log("2026-01-10", "2026-01-09", "2026-01-08") });
    expect(computeStreak(x, "2026-01-10")).toBe(3);
  });

  it("hoy sin marcar NO rompe la racha", () => {
    const x = h({ log: log("2026-01-09", "2026-01-08") });
    expect(computeStreak(x, "2026-01-10")).toBe(2);
  });

  it("un hueco anterior sí la rompe", () => {
    //                     falta el 09  ↓
    const x = h({ log: log("2026-01-10", "2026-01-08", "2026-01-07") });
    expect(computeStreak(x, "2026-01-10")).toBe(1);
  });

  it("sin nada marcado es 0", () => {
    expect(computeStreak(h(), "2026-01-10")).toBe(0);
  });

  it("los días que no tocaban ni suman ni cortan", () => {
    // Cada 3 días desde el 1: tocan 01, 04, 07, 10.
    const x = h({
      schedule: "everyN", everyNDays: 3,
      createdAt: "2026-01-01T00:00:00.000Z",
      log: log("2026-01-10", "2026-01-07", "2026-01-04"),
    });
    expect(computeStreak(x, "2026-01-10")).toBe(3);
  });

  it("no cuenta más allá de la creación del hábito", () => {
    const x = h({
      createdAt: "2026-01-08T00:00:00.000Z",
      log: log("2026-01-10", "2026-01-09", "2026-01-08", "2026-01-07"),
    });
    // El 07 es anterior al hábito: no cuenta aunque esté en el log.
    expect(computeStreak(x, "2026-01-10")).toBe(3);
  });

  it("racha larga que cruza el cambio de año", () => {
    const fechas = [];
    for (let i = 0; i < 40; i++) fechas.push(addDays("2027-01-15", -i));
    const x = h({ createdAt: "2026-01-01T00:00:00.000Z", log: log(...fechas) });
    expect(computeStreak(x, "2027-01-15")).toBe(40);
  });
});

// ────────────────────────────────────────────────────────────────
describe("statsBetween", () => {
  it("cuenta días que tocaban y días cumplidos", () => {
    const x = h({
      createdAt: "2026-01-01T00:00:00.000Z",
      log: log("2026-01-02", "2026-01-04"),
    });
    expect(statsBetween(x, "2026-01-01", "2026-01-05")).toEqual({ due: 5, done: 2 });
  });

  it("con everyN solo cuenta los días que tocaban", () => {
    const x = h({
      schedule: "everyN", everyNDays: 2,
      createdAt: "2026-01-01T00:00:00.000Z",
      log: log("2026-01-03"),
    });
    // Tocan 01, 03, 05 → 3 días; cumplido 1.
    expect(statsBetween(x, "2026-01-01", "2026-01-05")).toEqual({ due: 3, done: 1 });
  });

  it("una ventana anterior al hábito da 0", () => {
    const x = h({ createdAt: "2026-06-01T00:00:00.000Z" });
    expect(statsBetween(x, "2026-01-01", "2026-01-31")).toEqual({ due: 0, done: 0 });
  });
});

// ────────────────────────────────────────────────────────────────
describe("mergeLogs", () => {
  it("une días de ambos lados", () => {
    expect(mergeLogs({ "2026-09-01": 1 }, { "2026-09-02": 1 }))
      .toEqual({ "2026-09-01": 1, "2026-09-02": 1 });
  });

  it("es conmutativa (da igual quién sincronice primero)", () => {
    const a = { "2026-09-01": 1, "2026-09-03": 1 };
    const b = { "2026-09-02": 1, "2026-09-03": 1 };
    expect(mergeLogs(a, b)).toEqual(mergeLogs(b, a));
  });

  it("no pierde nada si un lado está vacío o falta", () => {
    expect(mergeLogs({ "2026-09-01": 1 }, {})).toEqual({ "2026-09-01": 1 });
    expect(mergeLogs(undefined, { "2026-09-01": 1 })).toEqual({ "2026-09-01": 1 });
    expect(mergeLogs({ "2026-09-01": 1 }, null)).toEqual({ "2026-09-01": 1 });
  });

  it("ante cuentas distintas del mismo día gana la mayor", () => {
    expect(mergeLogs({ "2026-09-01": 2 }, { "2026-09-01": 5 })).toEqual({ "2026-09-01": 5 });
    expect(mergeLogs({ "2026-09-01": 5 }, { "2026-09-01": 2 })).toEqual({ "2026-09-01": 5 });
  });

  it("descarta basura por los dos lados", () => {
    expect(mergeLogs({ "ayer": 1, "2026-09-01": 0 }, { "2026-09-02": 1 }))
      .toEqual({ "2026-09-02": 1 });
  });

  it("no muta los originales", () => {
    const a = { "2026-09-01": 1 };
    const b = { "2026-09-02": 1 };
    mergeLogs(a, b);
    expect(a).toEqual({ "2026-09-01": 1 });
    expect(b).toEqual({ "2026-09-02": 1 });
  });
});

describe("mergeHabits", () => {
  const hab = (id, log, over) => Object.assign({
    id, name: id, schedule: "daily", everyNDays: null,
    createdAt: "2026-01-01T00:00:00.000Z", archived: false, log: log || {},
  }, over || {});

  it("une el historial de un hábito que está en ambos lados", () => {
    const locales = [hab("h1", { "2026-09-01": 1 })];
    const remotos = [hab("h1", { "2026-09-02": 1 })];
    const out = mergeHabits(locales, remotos);
    expect(out).toHaveLength(1);
    expect(out[0].log).toEqual({ "2026-09-01": 1, "2026-09-02": 1 });
  });

  it("NO pierde la marca local cuando llega un snapshot remoto sin ella", () => {
    // El caso que motiva todo esto: dos dispositivos abiertos marcando.
    const locales = [hab("h1", { "2026-09-04": 1 })];
    const remotos = [hab("h1", {})];
    expect(mergeHabits(locales, remotos)[0].log).toEqual({ "2026-09-04": 1 });
  });

  it("un hábito borrado en otro dispositivo NO resucita", () => {
    const locales = [hab("h1"), hab("h2")];
    const remotos = [hab("h1")];
    expect(mergeHabits(locales, remotos).map((h) => h.id)).toEqual(["h1"]);
  });

  it("un hábito nuevo del remoto entra tal cual", () => {
    const out = mergeHabits([], [hab("h9", { "2026-09-01": 1 })]);
    expect(out.map((h) => h.id)).toEqual(["h9"]);
    expect(out[0].log).toEqual({ "2026-09-01": 1 });
  });

  it("el resto de campos los manda el remoto", () => {
    const locales = [hab("h1", {}, { name: "viejo" })];
    const remotos = [hab("h1", {}, { name: "nuevo" })];
    expect(mergeHabits(locales, remotos)[0].name).toBe("nuevo");
  });

  it("no muta los hábitos de entrada", () => {
    const locales = [hab("h1", { "2026-09-01": 1 })];
    const remotos = [hab("h1", { "2026-09-02": 1 })];
    mergeHabits(locales, remotos);
    expect(locales[0].log).toEqual({ "2026-09-01": 1 });
    expect(remotos[0].log).toEqual({ "2026-09-02": 1 });
  });

  it("aguanta listas vacías o ausentes", () => {
    expect(mergeHabits(undefined, undefined)).toEqual([]);
    expect(mergeHabits([hab("h1")], [])).toEqual([]);
  });
});
