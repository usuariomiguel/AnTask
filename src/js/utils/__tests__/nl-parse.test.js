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
      text: "", dueDate: null, priority: null, recurDays: null,
    });
  });

  it("devuelve el texto sin modificar si no hay tokens", () => {
    const res = parseNaturalLanguage("Comprar leche");
    expect(res.text).toBe("Comprar leche");
    expect(res.dueDate).toBeNull();
    expect(res.priority).toBeNull();
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

  it("no destruye texto que solo contiene tokens (devuelve original)", () => {
    // Un input que solo es tokens debería devolver el texto original
    const res = parseNaturalLanguage("hoy p1");
    expect(res.text).toBe("hoy p1");
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
  it('"p1" → high (importante)', () => {
    expect(parseNaturalLanguage("Fix crítico p1").priority).toBe("high");
  });

  it('"p2" ya no se reconoce — no hay niveles', () => {
    const res = parseNaturalLanguage("Mejora p2");
    expect(res.priority).toBeNull();
    expect(res.text).toBe("Mejora p2");
  });

  it('"p3" ya no se reconoce — no hay niveles', () => {
    const res = parseNaturalLanguage("Documentar p3");
    expect(res.priority).toBeNull();
    expect(res.text).toBe("Documentar p3");
  });

  it('"p10" no se extrae (no es prioridad válida)', () => {
    expect(parseNaturalLanguage("Pantalla p10 diseño").priority).toBeNull();
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
  it("fecha + prioridad en un solo input", () => {
    const res = parseNaturalLanguage("Informe trimestral mañana p1");
    expect(res.text).toBe("Informe trimestral");
    expect(res.dueDate).toBe("2026-05-25");
    expect(res.priority).toBe("high");
  });

  it("recurrencia + día de semana → texto sin ambos prefijos", () => {
    const res = parseNaturalLanguage("Stand-up todos los viernes");
    expect(res.recurDays).toBe(7);
    expect(res.dueDate).toBe("2026-05-29");
    expect(res.text).toBe("Stand-up");
  });
});

// Referencia: domingo 24-05-2026.
describe("parseNaturalLanguage — inglés", () => {
  const casos = [
    ["Call mom today",                 "Call mom",     "2026-05-24", null],
    ["Take out the trash tonight",     "Take out the trash", "2026-05-24", null],
    ["Call mom tomorrow",              "Call mom",     "2026-05-25", null],
    ["Dentist the day after tomorrow", "Dentist",      "2026-05-26", null],
    ["Renew passport in 3 days",       "Renew passport", "2026-05-27", null],
    ["Review budget in 2 weeks",       "Review budget", "2026-06-07", null],
    ["Send invoice friday",            "Send invoice", "2026-05-29", null],
    ["Send invoice on Friday",         "Send invoice", "2026-05-29", null],
    ["Groceries next sunday",          "Groceries",    "2026-05-31", null],
    ["Water plants every 2 days",      "Water plants", null,         2],
    ["Backup every 3 weeks",           "Backup",       null,         21],
    ["Pay rent every month",           "Pay rent",     null,         30],
    ["Run every other day",            "Run",          null,         2],
    ["Stretch every day",              "Stretch",      null,         1],
    ["Stand-up every monday",          "Stand-up",     "2026-05-25", 7],
  ];
  for (const [entrada, texto, fecha, rep] of casos) {
    it(entrada, () => {
      const res = parseNaturalLanguage(entrada);
      expect(res.text).toBe(texto);
      expect(res.dueDate).toBe(fecha);
      expect(res.recurDays).toBe(rep);
    });
  }

  it('"3/15" no vale como día/mes → se lee como 15 de marzo', () => {
    expect(parseNaturalLanguage("Taxes 3/15").dueDate).toBe("2027-03-15");
  });

  it('"3/4" sigue siendo 3 de abril', () => {
    expect(parseNaturalLanguage("Cita 3/4").dueDate).toBe("2027-04-03");
  });

  it('los adjetivos sueltos no se comen el título ("Daily con el equipo")', () => {
    const res = parseNaturalLanguage("Daily con el equipo");
    expect(res.text).toBe("Daily con el equipo");
    expect(res.recurDays).toBeNull();
  });

  it("inglés y prioridad juntos", () => {
    const res = parseNaturalLanguage("Quarterly report tomorrow p1");
    expect(res.text).toBe("Quarterly report");
    expect(res.dueDate).toBe("2026-05-25");
    expect(res.priority).toBe("high");
  });
});
