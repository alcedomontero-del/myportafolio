/**
 * herramientas/cargador-librerias.js — carga diferida de librerías
 * pesadas por CDN (jsPDF, pdf.js, Tesseract.js).
 * ---------------------------------------------------------
 * Estas 3 herramientas (imágenes→PDF, PDF→imágenes, OCR) son las
 * únicas del sitio que necesitan internet: no se vendorizan porque
 * son pesadas y de uso ocasional, así que solo se descargan cuando
 * el visitante realmente abre esa herramienta específica — nunca
 * junto con el resto de la página (ver RESUMEN-PORTAFOLIO.md).
 *
 * El archivo del visitante (imagen/PDF) nunca sale del navegador en
 * ninguna de las tres — internet solo hace falta para bajar el
 * código de la librería, no para procesar nada del usuario.
 * ---------------------------------------------------------
 */
window.cargarScriptCDN = function cargarScriptCDN(src, comprobarYaCargado) {
  if (comprobarYaCargado && comprobarYaCargado()) return Promise.resolve();

  // Evita pedir el mismo script dos veces si el usuario hace doble clic.
  const yaEnCurso = document.querySelector(`script[data-cdn-src="${src}"]`);
  if (yaEnCurso) {
    return new Promise((resolve, reject) => {
      yaEnCurso.addEventListener('load', resolve, { once: true });
      yaEnCurso.addEventListener('error', () => reject(new Error('No se pudo cargar la librería')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.dataset.cdnSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar la librería (revisa tu conexión a internet)'));
    document.head.appendChild(script);
  });
};
