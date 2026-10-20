// @ts-check
import { describe, it, expect } from "vitest";
import {
  registrarCompletado, anularCompletado, unirActividad, visibles,
  agruparPorDia, sanitizeActividad, podar, diaLocal, ACTIVIDAD_MAX,
} from "../model.js";

const AHORA = new Date("2026-10-20T15:30:00").getTime();
const HORA = 36e5, DIA = 864e5;
const tarea = (ref, texto, extra = {}) => ({ tipo: /** @type {"tarea"} */ ("tarea"), ref, texto, ...extra });

describe("registro de actividad", () => {
  it("apunta un completado con su día y hora", () => {
    const ev = registrarCompletado([], tarea("t1", "Revisar contrato", { lista: "Trabajo", color: "#b0473f" }), AHORA);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ tipo: "tarea", ref: "t1", texto: "Revisar contrato", lista: "Trabajo", color: "#b0473f", ts: AHORA, dia: "2026-10-20" });
  });

  it("no duplica si ya está completado ese día", () => {
    let ev = registrarCompletado([], tarea("t1", "A"), AHORA);
    ev = registrarCompletado(ev, tarea("t1", "A"), AHORA + HORA);
    expect(ev).toHaveLength(1);
  });

  it("un hábito cuenta para el día marcado, aunque sea pasado", () => {
    const ev = registrarCompletado([], { tipo: "habito", ref: "h1", texto: "Leer", dia: "2026-10-19" }, AHORA);
    expect(ev[0].dia).toBe("2026-10-19");
    expect(ev[0].ts).toBe(AHORA);
  });

  it("desmarcar lo anula (no lo borra) y volver a marcar crea otro", () => {
    let ev = registrarCompletado([], tarea("t1", "A"), AHORA);
    ev = anularCompletado(ev, "tarea", "t1", "2026-10-20");
    expect(ev).toHaveLength(1);
    expect(ev[0].anulado).toBe(true);
    expect(visibles(ev, {}, AHORA)).toHaveLength(0);
    ev = registrarCompletado(ev, tarea("t1", "A"), AHORA + HORA);
    expect(ev).toHaveLength(2);
    expect(visibles(ev, {}, AHORA + HORA)).toHaveLength(1);
  });
});

describe("reabrir una tarea", () => {
  it("sin día, anula el último completado aunque fuera otro día", () => {
    let ev = registrarCompletado([], tarea("t1", "A"), AHORA - DIA);
    ev = anularCompletado(ev, "tarea", "t1", null);
    expect(visibles(ev, {}, AHORA)).toHaveLength(0);
  });
});

describe("límites", () => {
  it("se queda con los últimos 90 días", () => {
    const viejo = { id: "v", tipo: "tarea", ts: AHORA - 91 * DIA, dia: diaLocal(AHORA - 91 * DIA), ref: "x", texto: "Viejo" };
    const nuevo = { id: "n", tipo: "tarea", ts: AHORA - 89 * DIA, dia: diaLocal(AHORA - 89 * DIA), ref: "y", texto: "Nuevo" };
    expect(podar(/** @type {any} */ ([viejo, nuevo]), AHORA).map((e) => e.id)).toEqual(["n"]);
  });

  it("como mucho ACTIVIDAD_MAX, quedándose con los más recientes", () => {
    const muchos = Array.from({ length: ACTIVIDAD_MAX + 20 }, (_, i) => ({ id: "e" + i, tipo: "tarea", ts: AHORA - (ACTIVIDAD_MAX + 20 - i) * 1000, dia: "2026-10-20", ref: "r" + i, texto: "T" }));
    const r = podar(/** @type {any} */ (muchos), AHORA);
    expect(r).toHaveLength(ACTIVIDAD_MAX);
    expect(r[r.length - 1].id).toBe("e" + (ACTIVIDAD_MAX + 19));
  });
});

describe("sincronización", () => {
  it("une por id y lo anulado gana", () => {
    const base = registrarCompletado([], tarea("t1", "A"), AHORA);
    const local = anularCompletado(base, "tarea", "t1", "2026-10-20");
    const remoto = registrarCompletado(base, tarea("t2", "B"), AHORA + HORA);
    const u = unirActividad(local, remoto, AHORA + HORA);
    expect(u).toHaveLength(2);
    expect(u.find((e) => e.ref === "t1").anulado).toBe(true);
    expect(visibles(u, {}, AHORA + HORA).map((e) => e.ref)).toEqual(["t2"]);
  });
});

describe("lectura", () => {
  const ev = [
    { id: "1", tipo: "tarea", ts: AHORA - DIA, dia: diaLocal(AHORA - DIA), ref: "a", texto: "Ayer", lista: "Casa" },
    { id: "2", tipo: "habito", ts: AHORA - HORA, dia: "2026-10-20", ref: "h", texto: "Leer" },
    { id: "3", tipo: "tarea", ts: AHORA, dia: "2026-10-20", ref: "b", texto: "Hoy", lista: "Trabajo" },
  ];

  it("ordena del más reciente al más antiguo y agrupa por día", () => {
    const g = agruparPorDia(visibles(/** @type {any} */ (ev), {}, AHORA));
    expect(g.map((x) => x.dia)).toEqual(["2026-10-20", "2026-10-19"]);
    expect(g[0].eventos.map((e) => e.texto)).toEqual(["Hoy", "Leer"]);
  });

  it("filtra por tipo, lista y rango de días", () => {
    expect(visibles(/** @type {any} */ (ev), { tipo: "habito" }, AHORA).map((e) => e.id)).toEqual(["2"]);
    expect(visibles(/** @type {any} */ (ev), { lista: "Casa" }, AHORA).map((e) => e.id)).toEqual(["1"]);
    expect(visibles(/** @type {any} */ (ev), { dias: 1 }, AHORA).map((e) => e.id)).toEqual(["3", "2"]);
  });

  it("sanea lo que venga de fuera", () => {
    const r = sanitizeActividad([
      { id: "ok", tipo: "tarea", ts: AHORA, dia: "2026-10-20", ref: "a", texto: "Bien", color: "#abc" },
      { id: "x", tipo: "otro", ts: AHORA, dia: "2026-10-20", ref: "a" },
      { id: "y", tipo: "tarea", ts: "ayer", dia: "2026-10-20", ref: "a" },
      { id: "z", tipo: "tarea", ts: AHORA, dia: "20/10", ref: "a" },
      { id: "c", tipo: "tarea", ts: AHORA, dia: "2026-10-20", ref: "a", color: "rojo" },
      null, "texto",
    ], AHORA);
    expect(r.map((e) => e.id)).toEqual(["ok", "c"]);
    expect(r[1].color).toBeUndefined();
    expect(sanitizeActividad("nada")).toEqual([]);
  });
});
