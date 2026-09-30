// @ts-check
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { analyticsAllowed, setAnalytics } from "../../consent.js";

// Analítica sin cookies: va por defecto y solo se apaga si el usuario la
// desactiva (o su navegador pide no compartir con Global Privacy Control).
describe("analítica por defecto con opción de desactivarla", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => { delete (/** @type {any} */ (navigator)).globalPrivacyControl; });

  it("sin elección previa, está activada", () => {
    expect(analyticsAllowed()).toBe(true);
  });

  it("desactivarla se recuerda", () => {
    setAnalytics(false);
    expect(localStorage.getItem("antrack_consent")).toBe("essential");
    expect(analyticsAllowed()).toBe(false);
    setAnalytics(true);
    expect(analyticsAllowed()).toBe(true);
  });

  it("quien eligió «Solo lo esencial» en el antiguo banner sigue sin analítica", () => {
    localStorage.setItem("antrack_consent", "essential");
    expect(analyticsAllowed()).toBe(false);
  });

  it("respeta Global Privacy Control salvo que se active a mano", () => {
    Object.defineProperty(navigator, "globalPrivacyControl", { value: true, configurable: true });
    expect(analyticsAllowed()).toBe(false);
    setAnalytics(true);
    expect(analyticsAllowed()).toBe(true);
  });
});
