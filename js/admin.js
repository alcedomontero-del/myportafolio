/**
 * admin.js — lógica compartida de admin.html
 * ---------------------------------------------------------
 * Panel de UNA SOLA página: cambiar de área nunca navega a otra
 * URL, solo muestra/oculta secciones. La sesión se confirma una
 * sola vez al entrar, con onAuthChange() — nunca getCurrentUser()
 * suelto (ver LECCIONES.md, caso #6).
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const appAdmin = document.getElementById("app-admin");
  const verificando = document.getElementById("verificando");
  let yaInicializado = false;

  window.DB.onAuthChange((user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    verificando.hidden = true;
    appAdmin.hidden = false;
    window.pintarBadgeModo("badge-modo");
    if (yaInicializado) return;
    yaInicializado = true;
    inicializarNavegacion();
    if (window.inicializarAreaPortafolio) window.inicializarAreaPortafolio();
    if (window.inicializarAreaCanales) window.inicializarAreaCanales();
    if (window.inicializarAreaHerramientas) window.inicializarAreaHerramientas();
    if (window.inicializarAreaDescargables) window.inicializarAreaDescargables();
    // Centro de Control NO se inicializa aquí: arranca oculto (hidden)
    // y su propio handler de navegación ya lo carga/recalcula cada vez
    // que se entra a esa pestaña (ver más abajo, línea ~59). Llamarlo
    // también aquí generaba una carrera entre dos renderizados
    // concurrentes que reseteaba el estado abierto/cerrado de una
    // tarjeta a mitad de interacción — ver LECCIONES.md, caso #20.
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await window.DB.logout();
    window.location.href = "login.html";
  });

  function inicializarNavegacion() {
    const botones = document.querySelectorAll(".lcars-nav-btn[data-area]");
    const secciones = document.querySelectorAll(".area-admin");
    const titulo = document.getElementById("titulo-area");

    botones.forEach((boton) => {
      boton.addEventListener("click", () => mostrarArea(boton.dataset.area));
    });

    function mostrarArea(nombre) {
      secciones.forEach((seccion) => {
        const activa = seccion.id === "area-" + nombre;
        seccion.hidden = !activa;
        if (activa) titulo.textContent = seccion.dataset.titulo;
      });
      botones.forEach((boton) => {
        boton.classList.toggle("activo", boton.dataset.area === nombre);
      });
      // El Centro de Control depende de datos de otras áreas (PayPal,
      // canales, etc.) — se recalcula cada vez que se entra a la
      // pestaña, no solo la primera vez.
      if (nombre === "control" && window.inicializarAreaControl) {
        window.inicializarAreaControl();
      }
    }
  }
});
