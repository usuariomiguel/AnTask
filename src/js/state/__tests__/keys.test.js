// @ts-check
import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * La migración corre al importar keys.js, así que cada caso siembra
 * localStorage ANTES de importarlo y resetea el registro de módulos para
 * que vuelva a evaluarse.
 */
async function importarKeysCon(seed) {
  localStorage.clear();
  Object.keys(seed).forEach((k) => localStorage.setItem(k, seed[k]));
  vi.resetModules();
  return import("../keys.js");
}

describe("migración del rebrand AnTask → AnTrack", () => {
  beforeEach(() => { localStorage.clear(); });

  it("copia los hábitos a la clave nueva", async () => {
    await importarKeysCon({ "antask-habits": '[{"id":"h1","name":"Leer"}]' });
    expect(localStorage.getItem("antrack-habits")).toBe('[{"id":"h1","name":"Leer"}]');
  });

  it("no borra la clave vieja: es la red de seguridad", async () => {
    await importarKeysCon({ "antask-habits": '[{"id":"h1"}]' });
    expect(localStorage.getItem("antask-habits")).toBe('[{"id":"h1"}]');
  });

  it("no pisa lo que ya exista en la clave nueva", async () => {
    await importarKeysCon({
      "antask-habits": '["viejo"]',
      "antrack-habits": '["nuevo"]',
    });
    expect(localStorage.getItem("antrack-habits")).toBe('["nuevo"]');
  });

  it("cubre las claves con sufijo variable y las de caché por cuenta", async () => {
    await importarKeysCon({
      "antask-habits-uid123": '["cache"]',
      "antask-reminder-t7": "2026-01-01T09:00",
    });
    expect(localStorage.getItem("antrack-habits-uid123")).toBe('["cache"]');
    expect(localStorage.getItem("antrack-reminder-t7")).toBe("2026-01-01T09:00");
  });

  it("respeta el separador, así que también migra las de guion bajo", async () => {
    await importarKeysCon({ "antask_consent": '{"analytics":false}' });
    expect(localStorage.getItem("antrack_consent")).toBe('{"analytics":false}');
  });

  it("no toca las claves ajenas al rebrand", async () => {
    await importarKeysCon({
      "anso-projects": '[{"id":"p1"}]',
      "mis-tareas-theme": "light",
    });
    expect(localStorage.getItem("antrack-projects")).toBeNull();
    expect(localStorage.getItem("anso-projects")).toBe('[{"id":"p1"}]');
    expect(localStorage.getItem("mis-tareas-theme")).toBe("light");
  });

  it("con el almacén vacío no hace nada ni revienta", async () => {
    const mod = await importarKeysCon({});
    expect(() => mod.migrateRebrandKeys()).not.toThrow();
    expect(localStorage.length).toBe(0);
  });
});
