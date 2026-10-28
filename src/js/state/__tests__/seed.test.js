// @ts-check
import { describe, it, expect, beforeEach } from "vitest";

import { hayQueSembrar, construirSemilla, sembrar, soloHayMuestra } from "../seed.js";
import { ONBOARDED_KEY, SEMILLA_KEY } from "../keys.js";

const INBOX = "__inbox__";

function inboxVacio() {
  return [{ id: INBOX, name: "Inbox", tasks: [] }];
}

describe("¿a quién se le siembra?", () => {
  beforeEach(() => { localStorage.clear(); });

  it("a un perfil recién estrenado", () => {
    expect(hayQueSembrar(inboxVacio(), [])).toBe(true);
  });

  it("a nadie que ya haya visto el tour", () => {
    localStorage.setItem(ONBOARDED_KEY, "1");
    expect(hayQueSembrar(inboxVacio(), [])).toBe(false);
  });

  it("a nadie que ya tenga una tarea", () => {
    const proyectos = [{ id: INBOX, name: "Inbox", tasks: [{ id: "t1", text: "mía" }] }];
    expect(hayQueSembrar(proyectos, [])).toBe(false);
  });

  it("a nadie que ya tenga un hábito, aunque no tenga tareas", () => {
    expect(hayQueSembrar(inboxVacio(), [{ id: "h1", name: "Correr" }])).toBe(false);
  });

  it("solo una vez: tras sembrar queda apuntado", () => {
    const proyectos = inboxVacio();
    const habitos = [];
    expect(hayQueSembrar(proyectos, habitos)).toBe(true);
    sembrar(proyectos, habitos, INBOX);
    // Aunque se borrara todo lo sembrado, no se vuelve a sembrar.
    expect(hayQueSembrar(inboxVacio(), [])).toBe(false);
  });
});

describe("la muestra", () => {
  beforeEach(() => { localStorage.clear(); });

  it("trae tareas y hábitos con la forma del modelo", () => {
    const { tareas, habitos } = construirSemilla();
    expect(tareas.length).toBeGreaterThan(0);
    expect(habitos.length).toBeGreaterThan(0);
    tareas.forEach((tk) => {
      expect(typeof tk.id).toBe("string");
      expect(tk.text.length).toBeGreaterThan(0);
      expect(tk.done).toBe(false);
      expect(Array.isArray(tk.subtasks)).toBe(true);
    });
    habitos.forEach((h) => {
      expect(typeof h.id).toBe("string");
      expect(h.name.length).toBeGreaterThan(0);
      expect(["daily", "everyN"]).toContain(h.schedule);
    });
  });

  it("deja algo para hoy, para que la vista Hoy no arranque vacía", () => {
    const d = new Date();
    const hoy = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") +
      "-" + String(d.getDate()).padStart(2, "0");
    const { tareas } = construirSemilla();
    expect(tareas.some((tk) => tk.dueDate === hoy)).toBe(true);
  });

  it("enseña lo que hace la app: subtareas, importante y un hábito no diario", () => {
    const { tareas, habitos } = construirSemilla();
    expect(tareas.some((tk) => tk.subtasks.length > 0)).toBe(true);
    expect(tareas.some((tk) => tk.priority === "high")).toBe(true);
    expect(habitos.some((h) => h.schedule === "everyN" && h.everyNDays > 1)).toBe(true);
  });

  it("va al Inbox y no a una lista nueva (el tour se saltaría)", () => {
    const proyectos = [{ id: INBOX, name: "Inbox", tasks: [] }, { id: "p1", name: "Casa", tasks: [] }];
    const habitos = [];
    expect(sembrar(proyectos, habitos, INBOX)).toBe(true);
    expect(proyectos[0].tasks.length).toBeGreaterThan(0);
    expect(proyectos[1].tasks.length).toBe(0);
    expect(habitos.length).toBeGreaterThan(0);
  });

  it("no siembra si no hay Inbox donde dejarla", () => {
    const proyectos = [{ id: "p1", name: "Casa", tasks: [] }];
    expect(sembrar(proyectos, [], INBOX)).toBe(false);
    expect(localStorage.getItem(SEMILLA_KEY)).toBeNull();
  });
});

describe("la muestra no cuenta como datos propios al sincronizar", () => {
  beforeEach(() => { localStorage.clear(); });

  it("recién sembrada, aquí no hay nada de nadie", () => {
    const proyectos = inboxVacio();
    const habitos = [];
    sembrar(proyectos, habitos, INBOX);
    expect(soloHayMuestra(proyectos, habitos)).toBe(true);
  });

  it("una tarea propia ya es algo que perder", () => {
    const proyectos = inboxVacio();
    const habitos = [];
    sembrar(proyectos, habitos, INBOX);
    proyectos[0].tasks.push({ id: "mia", text: "Pagar el seguro" });
    expect(soloHayMuestra(proyectos, habitos)).toBe(false);
  });

  it("un hábito propio también", () => {
    const proyectos = inboxVacio();
    const habitos = [];
    sembrar(proyectos, habitos, INBOX);
    habitos.push({ id: "mio", name: "Meditar" });
    expect(soloHayMuestra(proyectos, habitos)).toBe(false);
  });

  it("borrar parte de la muestra no la convierte en datos propios", () => {
    const proyectos = inboxVacio();
    const habitos = [];
    sembrar(proyectos, habitos, INBOX);
    proyectos[0].tasks.splice(0, 2);
    habitos.splice(0, 1);
    expect(soloHayMuestra(proyectos, habitos)).toBe(true);
  });

  it("sin siembra apuntada, lo que haya son datos propios", () => {
    const proyectos = [{ id: INBOX, name: "Inbox", tasks: [{ id: "t1", text: "mía" }] }];
    expect(soloHayMuestra(proyectos, [])).toBe(false);
  });

  it("un perfil vacío no es «solo muestra» (no hay nada que adoptar)", () => {
    const proyectos = inboxVacio();
    const habitos = [];
    sembrar(proyectos, habitos, INBOX);
    proyectos[0].tasks.length = 0;
    habitos.length = 0;
    expect(soloHayMuestra(proyectos, habitos)).toBe(false);
  });
});
