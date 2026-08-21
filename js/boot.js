/**
 * boot.js
 * ---------------------------------------------------------
 * Punto de entrada que arma window.DB con la implementación
 * correcta según el entorno (env.js ya definió ES_LOCAL).
 *
 * El resto de las páginas (store.js, admin.js, auth.js) solo
 * usan window.DB.algo(...) — nunca les importa si por dentro
 * es la demo local o Firebase real.
 * ---------------------------------------------------------
 */
(function () {
  // OJO: hay que capturar la URL de este propio script ANTES de
  // cualquier código async — document.currentScript deja de apuntar
  // aquí en cuanto el navegador sigue con la siguiente tarea. Se usa
  // para construir rutas relativas a boot.js (no a la página que lo
  // incluye), así funciona igual desde la raíz que desde
  // herramientas/algo.html.
  const carpetaDeJs = document.currentScript.src.replace(/boot\.js(\?.*)?$/, "");

  function cargarScriptClasico(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error("No se pudo cargar " + src));
      document.head.appendChild(script);
    });
  }

  async function iniciar() {
    if (window.ES_LOCAL) {
      await cargarScriptClasico(carpetaDeJs + "local-db.js");
      window.DB = window.LocalDB;
    } else {
      await import(carpetaDeJs + "firebase-real.js");
      window.DB = window.FirebaseDB;
    }
    window.dispatchEvent(new Event("db-listo"));
  }

  iniciar().catch((error) => {
    console.error("Error iniciando la base de datos:", error);
    window.dispatchEvent(new CustomEvent("db-error", { detail: error }));
  });

  // Utilidad para que las páginas esperen a que window.DB exista,
  // sin importar si el evento ya pasó o no.
  window.cuandoDBListo = function (callback) {
    if (window.DB) {
      callback();
    } else {
      window.addEventListener("db-listo", () => callback(), { once: true });
    }
  };
})();
