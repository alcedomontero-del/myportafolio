/**
 * herramientas/contador-texto.js — contador de palabras y caracteres
 * ---------------------------------------------------------
 * Todo se recalcula en cada tecla — no hace falta un botón "contar".
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const textarea = document.getElementById('ct-texto');

  const elPalabras = document.getElementById('ct-palabras');
  const elCaracteres = document.getElementById('ct-caracteres');
  const elCaracteresSinEspacios = document.getElementById('ct-caracteres-sin-espacios');
  const elOraciones = document.getElementById('ct-oraciones');
  const elParrafos = document.getElementById('ct-parrafos');
  const elLectura = document.getElementById('ct-lectura');

  const PALABRAS_POR_MINUTO = 200; // promedio de lectura en español

  function recalcular() {
    const texto = textarea.value;

    const palabras = texto.trim() ? texto.trim().split(/\s+/).length : 0;
    const caracteres = texto.length;
    const caracteresSinEspacios = texto.replace(/\s/g, '').length;
    const oraciones = texto.trim()
      ? (texto.match(/[^.!?]+[.!?]+/g) || (texto.trim() ? [texto] : [])).length
      : 0;
    const parrafos = texto.trim()
      ? texto.split(/\n+/).filter((p) => p.trim() !== '').length
      : 0;
    const minutosLectura = Math.max(1, Math.ceil(palabras / PALABRAS_POR_MINUTO));

    elPalabras.textContent = palabras.toLocaleString('es');
    elCaracteres.textContent = caracteres.toLocaleString('es');
    elCaracteresSinEspacios.textContent = caracteresSinEspacios.toLocaleString('es');
    elOraciones.textContent = oraciones.toLocaleString('es');
    elParrafos.textContent = parrafos.toLocaleString('es');
    elLectura.textContent = (palabras === 0 ? '0' : minutosLectura) + ' min';
  }

  textarea.addEventListener('input', recalcular);
  recalcular();
});
