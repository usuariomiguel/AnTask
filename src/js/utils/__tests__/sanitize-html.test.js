// @ts-check
import { describe, it, expect } from "vitest";
import { sanitizeRichHtml } from "../sanitize-html.js";

describe("sanitizeRichHtml — entradas especiales", () => {
  it("devuelve '' para null", () => {
    expect(sanitizeRichHtml(null)).toBe("");
  });

  it("devuelve '' para undefined", () => {
    expect(sanitizeRichHtml(undefined)).toBe("");
  });

  it("devuelve '' para cadena vacía", () => {
    expect(sanitizeRichHtml("")).toBe("");
  });

  it("devuelve '' para no-string", () => {
    // @ts-ignore — prueba de robustez
    expect(sanitizeRichHtml(42)).toBe("");
  });
});

describe("sanitizeRichHtml — tags permitidos", () => {
  it("preserva <b>", () => {
    expect(sanitizeRichHtml("<b>negrita</b>")).toContain("<b>negrita</b>");
  });

  it("preserva <strong>", () => {
    expect(sanitizeRichHtml("<strong>fuerte</strong>")).toContain("<strong>fuerte</strong>");
  });

  it("preserva <i>", () => {
    expect(sanitizeRichHtml("<i>cursiva</i>")).toContain("<i>cursiva</i>");
  });

  it("preserva <em>", () => {
    expect(sanitizeRichHtml("<em>énfasis</em>")).toContain("<em>énfasis</em>");
  });

  it("preserva <ul><li>", () => {
    const html = "<ul><li>item</li></ul>";
    const out = sanitizeRichHtml(html);
    expect(out).toContain("<ul>");
    expect(out).toContain("<li>item</li>");
  });

  it("preserva <br>", () => {
    expect(sanitizeRichHtml("línea1<br>línea2")).toContain("<br>");
  });

  it("preserva <img> con src http", () => {
    const html = '<img src="https://example.com/img.png" alt="test">';
    const out = sanitizeRichHtml(html);
    expect(out).toContain("<img");
    expect(out).toContain('src="https://example.com/img.png"');
  });

  it("preserva <img> con src data:image/png (base64)", () => {
    const html = '<img src="data:image/png;base64,abc123" alt="paste">';
    const out = sanitizeRichHtml(html);
    expect(out).toContain("<img");
    expect(out).toContain("data:image/png;base64,abc123");
  });
});

describe("sanitizeRichHtml — XSS bloqueado", () => {
  it("elimina <script>", () => {
    const out = sanitizeRichHtml('<script>alert("xss")</script>texto');
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("alert");
    expect(out).toContain("texto");
  });

  it("elimina onerror en img", () => {
    const out = sanitizeRichHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain("onerror");
  });

  it("elimina onclick en span", () => {
    const out = sanitizeRichHtml('<span onclick="stealCookies()">click</span>');
    expect(out).not.toContain("onclick");
    expect(out).toContain("click");
  });

  it("bloquea javascript: en src de img", () => {
    const out = sanitizeRichHtml('<img src="javascript:alert(1)">');
    expect(out).not.toContain("javascript:");
  });

  it("bloquea data:text/html en src", () => {
    const out = sanitizeRichHtml('<img src="data:text/html,<script>alert(1)</script>">');
    expect(out).not.toContain("data:text/html");
  });

  it("elimina <iframe>", () => {
    const out = sanitizeRichHtml('<iframe src="https://evil.com"></iframe>');
    expect(out).not.toContain("<iframe");
  });

  it("elimina <object>", () => {
    const out = sanitizeRichHtml('<object data="evil.swf"></object>');
    expect(out).not.toContain("<object");
  });

  it("elimina onmouseover", () => {
    const out = sanitizeRichHtml('<div onmouseover="pwn()">hover</div>');
    expect(out).not.toContain("onmouseover");
    expect(out).toContain("hover");
  });

  it("el texto plano pasa sin cambios", () => {
    const text = "Hola mundo, sin HTML";
    expect(sanitizeRichHtml(text)).toBe(text);
  });
});
