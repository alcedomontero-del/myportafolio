/**
 * herramientas/ocr.js — extrae texto de una imagen con Tesseract.js
 * (cargado por CDN vía cargador-librerias.js solo al abrir esta
 * herramienta; el propio Tesseract.js también descarga por su cuenta
 * los datos del idioma elegido la primera vez que se usa cada uno).
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const TESSERACT_URL = 'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.0.4/tesseract.min.js';

  const dropzone = document.getElementById('ocr-dropzone');
  const inputArchivo = document.getElementById('ocr-archivo');
  const controles = document.getElementById('ocr-controles');
  const vistaPrevia = document.getElementById('ocr-vista-previa');
  const selectIdioma = document.getElementById('ocr-idioma');
  const btnExtraer = document.getElementById('btn-ocr-extraer');
  const progreso = document.getElementById('ocr-progreso');
  const progresoRelleno = document.getElementById('ocr-progreso-relleno');
  const progresoTexto = document.getElementById('ocr-progreso-texto');
  const resultado = document.getElementById('resultado-ocr');
  const textoResultado = document.getElementById('ocr-texto-resultado');
  const btnCopiar = document.getElementById('btn-ocr-copiar');

  let archivoActual = null;

  function mostrarProgreso(porcentaje, texto) {
    progreso.classList.add('mostrar');
    progresoTexto.classList.add('mostrar');
    progresoRelleno.style.width = `${porcentaje}%`;
    progresoTexto.textContent = texto;
  }
  function ocultarProgreso() {
    progreso.classList.remove('mostrar');
    progresoTexto.classList.remove('mostrar');
  }

  function cargarArchivo(archivo) {
    if (!archivo || !archivo.type.startsWith('image/')) {
      window.mostrarToast('Elige un archivo de imagen válido', 'error');
      return;
    }
    archivoActual = archivo;
    vistaPrevia.src = URL.createObjectURL(archivo);
    controles.hidden = false;
    resultado.classList.remove('mostrar');
  }

  inputArchivo.addEventListener('change', () => {
    if (inputArchivo.files[0]) cargarArchivo(inputArchivo.files[0]);
  });

  ['dragover', 'dragenter'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('sobre-arrastre');
    });
  });
  ['dragleave', 'dragend'].forEach((evt) => {
    dropzone.addEventListener(evt, () => dropzone.classList.remove('sobre-arrastre'));
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('sobre-arrastre');
    const archivo = e.dataTransfer.files && e.dataTransfer.files[0];
    if (archivo) cargarArchivo(archivo);
  });

  btnExtraer.addEventListener('click', async () => {
    if (!archivoActual) return;
    btnExtraer.disabled = true;
    mostrarProgreso(3, 'Cargando el motor de reconocimiento…');

    let worker = null;
    try {
      await window.cargarScriptCDN(TESSERACT_URL, () => window.Tesseract);

      worker = await window.Tesseract.createWorker(selectIdioma.value, 1, {
        logger: (info) => {
          if (info.status === 'recognizing text') {
            mostrarProgreso(20 + Math.round(info.progress * 75), `Leyendo el texto… ${Math.round(info.progress * 100)}%`);
          } else if (info.status) {
            mostrarProgreso(15, info.status === 'loading tesseract core' ? 'Preparando el motor…' : 'Preparando el idioma elegido…');
          }
        },
      });

      const { data } = await worker.recognize(archivoActual);
      textoResultado.value = (data.text || '').trim();

      if (!textoResultado.value) {
        window.mostrarToast('No se encontró texto reconocible en la imagen', 'error');
      }

      resultado.classList.add('mostrar');
      resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      mostrarProgreso(100, 'Listo');
      setTimeout(ocultarProgreso, 800);
    } catch (error) {
      ocultarProgreso();
      window.mostrarToast(error.message || 'No se pudo leer el texto de la imagen', 'error');
    } finally {
      if (worker) await worker.terminate();
      btnExtraer.disabled = false;
    }
  });

  btnCopiar.addEventListener('click', async () => {
    if (!textoResultado.value) return;
    try {
      await navigator.clipboard.writeText(textoResultado.value);
      window.mostrarToast('Texto copiado');
    } catch (error) {
      textoResultado.select();
      window.mostrarToast('Selecciona y copia con Ctrl+C', 'error');
    }
  });
});
