// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseNaturalLanguage } from "../nl-parse.js";

// Fija la fecha de referencia a 2026-05-24 (domingo, día 0)
const FIXED_DATE = new Date("2026-05-24T12:00:00");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_DATE);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("parseNaturalLanguage — texto limpio", () => {
  it("devuelve texto vacío para input nulo", () => {
    expect(parseNaturalLanguage(null)).toEqual({
      text: "", dueDate: null, priority: null, labels: [], recurDays: null,
    });
  });

  it("devuelve el texto sin modificar si no hay tokens", () => {
    const res = parseNaturalLanguage("Comprar leche");
    expect(res.text).toBe("Comprar leche");
    expect(res.dueDate).toBeNull();
    expect(res.priority).toBeNull();
    expect(res.labels).toEqual([]);
    expect(res.recurDays).toBeNull();
  });

  it("elimina el token de fecha del texto limpio", () => {
    const res = parseNaturalLanguage("Reunión hoy con equipo");
    expect(res.text).toBe("Reunión con equipo");
  });

  it("elimina prioridad del texto limpio", () => {
    const res = parseNaturalLanguage("Fix bug p1");
    expect(res.text).toBe("Fix bug");
  });

  it("elimina etiquetas del texto limpio", () => {
    const res = parseNaturalLanguage("Leer libro #personal");
    expect(res.text).toBe("Leer libro");
  });

  it("no destruye texto que solo contiene tokens (devuelve original)", () => {
    // Un input que solo es tokens debería devolver el texto original
    const res = parseNaturalLanguage("hoy p1 #trabajo");
    expect(res.text).toBe("hoy p1 #trabajo");
  });
});

describe("parseNaturalLanguage — fechas relativas", () => {
  it('"hoy" → fecha de hoy (2026-05-24)', () => {
    expect(parseNaturalLanguage("Tarea hoy").dueDate).toBe("2026-05-24");
  });

  it('"mañana" → 2026-05-25', () => {
    expect(parseNaturalLanguage("Llamar mañana").dueDate).toBe("2026-05-25");
  });

  it('"pasado mañana" → 2026-05-26', () => {
    expect(parseNaturalLanguage("Comprar pasado mañana").dueDate).toBe("2026-05-26");
  });

  it('"en 3 días" → 2026-05-27', () => {
    expect(parseNaturalLanguage("Revisión en 3 días").dueDate).toBe("2026-05-27");
  });

  it('"en 1 semana" → 2026-05-31', () => {
    expect(parseNaturalLanguage("Entrega en 1 semana").dueDate).toBe("2026-05-31");
  });

  it('"en 2 semanas" → 2026-06-07', () => {
    expect(parseNaturalLanguage("Demo en 2 semanas").dueDate).toBe("2026-06-07");
  });
});

describe("parseNaturalLanguage — días de la semana", () => {
  // Hoy es domingo (0). Próximo lunes = mañana (+1 día = 2026-05-25).
  it('"lunes" desde domingo → próximo lunes (2026-05-25)', () => {
    expect(parseNaturalLanguage("Tarea lunes").dueDate).toBe("2026-05-25");
  });

  // Próximo domingo desde domingo = +7 días = 2026-05-31
  it('"próximo domingo" → 2026-05-31', () => {
    expect(parseNaturalLanguage("Descanso próximo domingo").dueDate).toBe("2026-05-31");
  });

  it('"viernes" desde domingo → 2026-05-29', () => {
    expect(parseNaturalLanguage("Reunión viernes").dueDate).toBe("2026-05-29");
  });
});

describe("parseNaturalLanguage — fechas explícitas", () => {
  it('"15/6" → 2026-06-15', () => {
    expect(parseNaturalLanguage("Cita 15/6").dueDate).toBe("2026-06-15");
  });

  it('"01-07-2026" → 2026-07-01', () => {
    expect(parseNaturalLanguage("Vacaciones 01-07-2026").dueDate).toBe("2026-07-01");
  });

  it('"15.3" en el pasado → asume año siguiente (2027-03-15)', () => {
    // 15/3 ya pasó en 2026 (hoy es mayo 2026)
    expect(parseNaturalLanguage("Evento 15.3").dueDate).toBe("2027-03-15");
  });
});

describe("parseNaturalLanguage — prioridad", () => {
  it('"p1" → high', () => {
    expect(parseNaturalLanguage("Fix crítico p1").priority).toBe("high");
  });

  it('"p2" → medium', () => {
    expect(parseNaturalLanguage("Mejora p2").priority).toBe("medium");
  });

  it('"p3" → low', () => {
    expect(parseNaturalLanguage("Documentar p3").priority).toBe("low");
  });

  it('"p10" no se extrae (no es prioridad válida)', () => {
    expect(parseNaturalLanguage("Pantalla p10 diseño").priority).toBeNull();
  });
});

describe("parseNaturalLanguage — etiquetas", () => {
  it("extrae una etiqueta", () => {
    expect(parseNaturalLanguage("Leer #personal").labels).toEqual(["personal"]);
  });

  it("extrae múltiples etiquetas", () => {
    expect(parseNaturalLanguage("Reunión #trabajo #cliente").labels).toEqual(["trabajo", "cliente"]);
  });

  it("no duplica etiquetas repetidas", () => {
    expect(parseNaturalLanguage("Tarea #dev #dev").labels).toEqual(["dev"]);
  });

  it("ignora # sin texto válido", () => {
    expect(parseNaturalLanguage("Tarea con # suelta").labels).toEqual([]);
  });
});

describe("parseNaturalLanguage — recurrencia", () => {
  it('"diariamente" → recurDays=1', () => {
    expect(parseNaturalLanguage("Ejercicio diariamente").recurDays).toBe(1);
  });

  it('"cada día" → recurDays=1', () => {
    expect(parseNaturalLanguage("Meditar cada día").recurDays).toBe(1);
  });

  it('"cada semana" → recurDays=7', () => {
    expect(parseNaturalLanguage("Revisión cada semana").recurDays).toBe(7);
  });

  it('"semanalmente" → recurDays=7', () => {
    expect(parseNaturalLanguage("Backup semanalmente").recurDays).toBe(7);
  });

  it('"mensualmente" → recurDays=30', () => {
    expect(parseNaturalLanguage("Factura mensualmente").recurDays).toBe(30);
  });

  it('"cada 2 días" → recurDays=2', () => {
    expect(parseNaturalLanguage("Regar plantas cada 2 días").recurDays).toBe(2);
  });

  it('"cada 3 semanas" → recurDays=21', () => {
    expect(parseNaturalLanguage("Revisión médica cada 3 semanas").recurDays).toBe(21);
  });

  it('"quincenalmente" → recurDays=14', () => {
    expect(parseNaturalLanguage("Pago quincenalmente").recurDays).toBe(14);
  });

  it('"todos los lunes" → recurDays=7 y dueDate=próximo lunes', () => {
    const res = parseNaturalLanguage("Stand-up todos los lunes");
    expect(res.recurDays).toBe(7);
    expect(res.dueDate).toBe("2026-05-25");
  });

  it('"todos los días" → recurDays=1', () => {
    expect(parseNaturalLanguage("Yoga todos los días").recurDays).toBe(1);
  });

  it("cap a 3650 días para valores extremos", () => {
    expect(parseNaturalLanguage("Tarea cada 9999 días").recurDays).toBe(3650);
  });
});

describe("parseNaturalLanguage — combinaciones", () => {
  it("fecha + prioridad + etiqueta en un solo input", () => {
    const res = parseNaturalLanguage("Informe trimestral mañana p1 #trabajo");
    expect(res.text).toBe("Informe trimestral");
    expect(res.dueDate).toBe("2026-05-25");
    expect(res.priority).toBe("high");
    expect(res.labels).toEqual(["trabajo"]);
  });

  it("recurrencia + día de semana → texto sin ambos prefijos", () => {
    const res = parseNaturalLanguage("Stand-up todos los viernes #equipo");
    expect(res.recurDays).toBe(7);
    expect(res.dueDate).toBe("2026-05-29");
    expect(res.labels).toEqual(["equipo"]);
    expect(res.text).toBe("Stand-up");
  });
});
