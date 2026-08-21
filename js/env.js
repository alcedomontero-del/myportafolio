/**
 * env.js
 * ---------------------------------------------------------
 * Detecta automáticamente si la página está corriendo:
 *   - LOCAL: abierta desde VS Code (Live Server), doble clic
 *     en el archivo, o cualquier localhost/127.0.0.1.
 *     -> Se usa la base de datos falsa (local-db.js), sin
 *        tocar Firebase ni Cloudinary.
 *
 *   - PRODUCCIÓN: la página fue desplegada de verdad.
 *     -> Se activan las conexiones reales a Firebase y
 *        Cloudinary.
 *
 * No hay que tocar este archivo para desplegar: la detección
 * es automática según el dominio donde el navegador cargó
 * la página.
 * ---------------------------------------------------------
 */
(function () {
  const host = location.hostname;
  const esLocal =
    host === "" ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168.") ||
    location.protocol === "file:";

  window.ES_LOCAL = esLocal;

  // Utilidad genérica reutilizable en cualquier proyecto
  window.normalizarTexto = function (texto) {
    return (texto || "").trim();
  };
})();
