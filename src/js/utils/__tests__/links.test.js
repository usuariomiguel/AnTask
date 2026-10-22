// @ts-check
import { describe, it, expect } from "vitest";
import { normalizarEnlace, tituloDe, dominioDe, sanitizeLinks, ENLACES_MAX } from "../links.js";

describe("normalizarEnlace", () => {
  it("acepta http y https", () => {
    expect(normalizarEnlace("https://docs.google.com/document/d/abc/edit")).toBe("https://docs.google.com/document/d/abc/edit");
    expect(normalizarEnlace("  http://ejemplo.com  ")).toBe("http://ejemplo.com/");
  });

  it("pone https a lo que parece un dominio sin esquema", () => {
    expect(normalizarEnlace("www.ejemplo.com/ruta")).toBe("https://www.ejemplo.com/ruta");
    expect(normalizarEnlace("github.com/antrack")).toBe("https://github.com/antrack");
  });

  it("rechaza esquemas peligrosos y lo que no es un enlace", () => {
    expect(normalizarEnlace("javascript:alert(1)")).toBeNull();
    expect(normalizarEnlace("data:text/html,hola")).toBeNull();
    expect(normalizarEnlace("file:///C:/secreto.txt")).toBeNull();
    expect(normalizarEnlace("hola que tal")).toBeNull();
    expect(normalizarEnlace("comprar")).toBeNull();
    expect(normalizarEnlace("")).toBeNull();
    expect(normalizarEnlace("https://localhost")).toBeNull();
  });

  it("en modo estricto (pegado suelto) solo con esquema o www", () => {
    expect(normalizarEnlace("ejemplo.com", { estricto: true })).toBeNull();
    expect(normalizarEnlace("www.ejemplo.com", { estricto: true })).toBe("https://www.ejemplo.com/");
    expect(normalizarEnlace("https://ejemplo.com", { estricto: true })).toBe("https://ejemplo.com/");
  });
});

describe("nombre legible", () => {
  it("el último tramo con sentido de la ruta; si no hay, el dominio", () => {
    expect(dominioDe("https://www.ejemplo.com/a")).toBe("ejemplo.com");
    expect(tituloDe("https://github.com/usuario/mi-proyecto")).toBe("Mi proyecto");
    expect(tituloDe("https://ejemplo.com/informe%20final.pdf")).toBe("Informe final");
    expect(tituloDe("https://www.ejemplo.com/")).toBe("ejemplo.com");
    // Un id de documento no es un nombre
    expect(tituloDe("https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")).toBe("docs.google.com");
  });
});

describe("sanitizeLinks", () => {
  it("limpia, quita duplicados y enlaces no válidos", () => {
    const r = sanitizeLinks([
      { id: "a", url: "https://ejemplo.com/x", title: "Mi doc" },
      { id: "b", url: "https://ejemplo.com/x" },
      { id: "c", url: "javascript:alert(1)" },
      { url: "github.com/antrack" },
      null, "texto",
    ]);
    expect(r).toHaveLength(2);
    expect(r[0]).toEqual({ id: "a", url: "https://ejemplo.com/x", title: "Mi doc" });
    expect(r[1].url).toBe("https://github.com/antrack");
    expect(r[1].title).toBe("Antrack");
    expect(typeof r[1].id).toBe("string");
  });

  it("como mucho ENLACES_MAX", () => {
    const muchos = Array.from({ length: ENLACES_MAX + 5 }, (_, i) => ({ url: "https://e" + i + ".com" }));
    expect(sanitizeLinks(muchos)).toHaveLength(ENLACES_MAX);
  });

  it("lo que no es un array, lista vacía", () => {
    expect(sanitizeLinks(undefined)).toEqual([]);
    expect(sanitizeLinks("x")).toEqual([]);
  });
});
