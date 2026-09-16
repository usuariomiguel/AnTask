// @ts-check
import { describe, it, expect } from "vitest";
import { detectarPistas, sugerenciasPara } from "../title-hints.js";

describe("detectarPistas", () => {
  it("lee los adjetivos que el parser de creación no entiende", () => {
    // Títulos reales del usuario, que salían todos con recurDays: null.
    expect(detectarPistas("Revisar Informe Mensual Seguridad").recurDays).toBe(30);
    expect(detectarPistas("Revisar eventos SIEM/Bitdefender semanal").recurDays).toBe(7);
    expect(detectarPistas("Revisar informes de seguridad Semanales").recurDays).toBe(7);
    expect(detectarPistas("Informe quincenal de ventas").recurDays).toBe(14);
  });

  it("cubre el resto de frecuencias, en español y en inglés", () => {
    expect(detectarPistas("Lectura diaria").recurDays).toBe(1);
    expect(detectarPistas("Backups diarios").recurDays).toBe(1);
    expect(detectarPistas("Cierre trimestral").recurDays).toBe(90);
    expect(detectarPistas("Renovación anual del dominio").recurDays).toBe(365);
    expect(detectarPistas("Weekly sync").recurDays).toBe(7);
    expect(detectarPistas("Monthly report").recurDays).toBe(30);
  });

  it("también recoge las frases explícitas del parser", () => {
    expect(detectarPistas("Regar las plantas cada 3 días").recurDays).toBe(3);
    expect(detectarPistas("Sacar la basura cada semana").recurDays).toBe(7);
  });

  it("no ve frecuencias donde no las hay", () => {
    // "diario" a secas es sobre todo un sustantivo.
    expect(detectarPistas("Diario de viaje").recurDays).toBeNull();
    expect(detectarPistas("Leer el diario").recurDays).toBeNull();
    // \b no parte palabras: "manual" no es "anual".
    expect(detectarPistas("Actualizar el manual").recurDays).toBeNull();
    expect(detectarPistas("Revisar cifrado pcs").recurDays).toBeNull();
  });

  it("biweekly es quincenal, no semanal", () => {
    expect(detectarPistas("Biweekly review").recurDays).toBe(14);
  });

  it("detecta la importancia por palabra", () => {
    expect(detectarPistas("URGENTE: renovar certificado").importante).toBe(true);
    expect(detectarPistas("Tema importante con RRHH").importante).toBe(true);
    expect(detectarPistas("Pagar alquiler p1").importante).toBe(true);
    expect(detectarPistas("Comprar pan").importante).toBe(false);
    // "p10" no es "p1".
    expect(detectarPistas("Ticket p10").importante).toBe(false);
  });

  it("aguanta entradas vacías o raras", () => {
    expect(detectarPistas("")).toEqual({ recurDays: null, importante: false });
    // @ts-expect-error — a propósito
    expect(detectarPistas(null)).toEqual({ recurDays: null, importante: false });
  });
});

describe("sugerenciasPara", () => {
  const tarea = (over) => Object.assign({ text: "", done: false, recurDays: null, priority: null }, over);

  it("sugiere la repetición que falta", () => {
    expect(sugerenciasPara(tarea({ text: "Informe mensual" }))).toEqual([
      { campo: "recur", valor: 30, clave: "recur:30" },
    ]);
  });

  it("no contradice una repetición ya puesta", () => {
    expect(sugerenciasPara(tarea({ text: "Informe mensual", recurDays: 3 }))).toEqual([]);
  });

  it("no sugiere importante si ya lo es", () => {
    expect(sugerenciasPara(tarea({ text: "Urgente", priority: "high" }))).toEqual([]);
  });

  it("nada para tareas hechas", () => {
    expect(sugerenciasPara(tarea({ text: "Informe mensual urgente", done: true }))).toEqual([]);
  });

  it("puede sugerir las dos cosas a la vez", () => {
    const s = sugerenciasPara(tarea({ text: "Informe mensual urgente" }));
    expect(s.map((x) => x.campo)).toEqual(["recur", "importante"]);
  });

  it("respeta lo descartado", () => {
    expect(sugerenciasPara(tarea({ text: "Informe mensual" }), ["recur:30"])).toEqual([]);
    expect(sugerenciasPara(tarea({ text: "Urgente" }), ["importante"])).toEqual([]);
  });

  it("descartar la semanal no silencia la mensual si cambia el título", () => {
    expect(sugerenciasPara(tarea({ text: "Informe mensual" }), ["recur:7"])).toEqual([
      { campo: "recur", valor: 30, clave: "recur:30" },
    ]);
  });
});
