// Entrada de las páginas públicas (/inicio, /privacidad, /terminos): solo
// las fuentes. Sin la app, sin Firebase y sin analítica.
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/jetbrains-mono";

// Botón de tema: alterna claro/oscuro y lo recuerda en la misma clave que la
// app (mismo origen), así que la preferencia vale para las dos.
const raiz = document.documentElement;
document.querySelectorAll("[data-tema-toggle]").forEach(function (boton) {
  boton.addEventListener("click", function () {
    const nuevo = raiz.dataset.theme === "dark" ? "light" : "dark";
    raiz.dataset.theme = nuevo;
    try { localStorage.setItem("mis-tareas-theme", nuevo); } catch (e) { /* sin almacenamiento: solo esta visita */ }
  });
});
