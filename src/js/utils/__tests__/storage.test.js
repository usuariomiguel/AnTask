// @ts-check
import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeLsSet, getStorageUsagePct } from "../storage.js";

// jsdom incluye localStorage, pero tiene un límite muy alto en tests.
// Usamos vi.spyOn para simular el comportamiento que queremos probar.

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("safeLsSet — escritura normal", () => {
  it("escribe en localStorage y devuelve true", () => {
    const ok = safeLsSet("clave", "valor", vi.fn());
    expect(ok).toBe(true);
    expect(localStorage.getItem("clave")).toBe("valor");
  });

  it("sobreescribe una clave existente", () => {
    localStorage.setItem("clave", "viejo");
    safeLsSet("clave", "nuevo", vi.fn());
    expect(localStorage.getItem("clave")).toBe("nuevo");
  });
});

describe("safeLsSet — cuota superada", () => {
  it("llama a onQuota y devuelve false cuando se supera la cuota", () => {
    const err = new DOMException("QuotaExceededError", "QuotaExceededError");
    vi.spyOn(localStorage.__proto__, "setItem").mockImplementation(() => {
      throw err;
    });

    const onQuota = vi.fn();
    const ok = safeLsSet("k", "v", onQuota);

    expect(ok).toBe(false);
    expect(onQuota).toHaveBeenCalledOnce();
  });

  it("no lanza si onQuota no es función", () => {
    const err = new DOMException("QuotaExceededError", "QuotaExceededError");
    vi.spyOn(localStorage.__proto__, "setItem").mockImplementation(() => {
      throw err;
    });

    // @ts-ignore — prueba de robustez con callback inválido
    expect(() => safeLsSet("k", "v", null)).not.toThrow();
  });

  it("NO llama onQuota para errores que no son de cuota", () => {
    vi.spyOn(localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new Error("otro error");
    });

    const onQuota = vi.fn();
    safeLsSet("k", "v", onQuota);

    expect(onQuota).not.toHaveBeenCalled();
  });

  it("reconoce NS_ERROR_DOM_QUOTA_REACHED (nombre Firefox)", () => {
    const err = new DOMException("Quota exceeded", "NS_ERROR_DOM_QUOTA_REACHED");
    vi.spyOn(localStorage.__proto__, "setItem").mockImplementation(() => {
      throw err;
    });

    const onQuota = vi.fn();
    safeLsSet("k", "v", onQuota);

    expect(onQuota).toHaveBeenCalledOnce();
  });
});

describe("getStorageUsagePct", () => {
  it("devuelve 0 con localStorage vacío", () => {
    expect(getStorageUsagePct()).toBe(0);
  });

  it("devuelve un número entre 0 y 100", () => {
    localStorage.setItem("test", "a".repeat(1000));
    const pct = getStorageUsagePct();
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it("aumenta al añadir más datos", () => {
    const antes = getStorageUsagePct();
    localStorage.setItem("grande", "x".repeat(50_000));
    const despues = getStorageUsagePct();
    expect(despues).toBeGreaterThan(antes);
  });

  it("nunca supera 100 aunque localStorage esté lleno", () => {
    // Simula un estado que excedería el límite teórico
    vi.spyOn(localStorage.__proto__, "length", "get").mockReturnValue(1);
    vi.spyOn(localStorage.__proto__, "key").mockReturnValue("k");
    vi.spyOn(localStorage.__proto__, "getItem").mockReturnValue("x".repeat(5 * 1024 * 1024));

    expect(getStorageUsagePct()).toBe(100);
  });
});
