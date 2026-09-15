// @ts-check
import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeLsSet } from "../storage.js";

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
