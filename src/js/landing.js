// Entrada de las páginas públicas (/inicio, /en, /privacidad, /terminos): solo
// las fuentes. Sin la app, sin Firebase y sin analítica.
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource-variable/jetbrains-mono";

// Desde la landing en inglés, la app se abre en inglés aunque el navegador
// esté en otro idioma. Solo si no se ha elegido ya uno en la app.
document.querySelectorAll("[data-app-en]").forEach(function (enlace) {
  enlace.addEventListener("click", function () {
    try { if (!localStorage.getItem("antrack_lang")) localStorage.setItem("antrack_lang", "en"); } catch (e) { /* sin almacenamiento: manda el navegador */ }
  });
});

// Botón de tema: alterna claro/oscuro y lo recuerda en la misma clave que la
// app (mismo origen), así que la preferencia vale para las dos. Por defecto
// la página sigue el modo del dispositivo.
const raiz = document.documentElement;
const oscuroSistema = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const temaSistema = () => (oscuroSistema && oscuroSistema.matches ? "dark" : "light");
document.querySelectorAll("[data-tema-toggle]").forEach(function (boton) {
  boton.addEventListener("click", function () {
    const nuevo = raiz.dataset.theme === "dark" ? "light" : "dark";
    raiz.dataset.theme = nuevo;
    // Igual que en la app: si coincide con el del dispositivo vuelve a
    // automático (sin clave); si no, se queda fijo.
    try {
      if (nuevo === temaSistema()) localStorage.removeItem("mis-tareas-theme");
      else localStorage.setItem("mis-tareas-theme", nuevo);
    } catch (e) { /* sin almacenamiento: solo esta visita */ }
  });
});

// En automático, la página cambia sola si el dispositivo cambia de modo.
if (oscuroSistema && oscuroSistema.addEventListener) {
  oscuroSistema.addEventListener("change", function () {
    let fijo = null;
    try { fijo = localStorage.getItem("mis-tareas-theme"); } catch (e) { /* */ }
    if (fijo !== "light" && fijo !== "dark") raiz.dataset.theme = temaSistema();
  });
}
