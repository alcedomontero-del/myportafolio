/**
 * herramientas/comprimir-imagen.js — compresor de imágenes
 * ---------------------------------------------------------
 * Todo pasa por un <canvas> oculto: se dibuja la imagen original ahí
 * y `canvas.toBlob(callback, formato, calidad)` hace la compresión.
 * Nada se sube a ningún servidor — el archivo nunca sale de
 * `FileReader`/`canvas`, que viven enteramente en el navegador.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const dropzone = document.getElementById('comp-dropzone');
  const inputArchivo = document.getElementById('comp-archivo');
  const controles = document.getElementById('comp-controles');
  const inputCalidad = document.getElementById('comp-calidad');
  const valorCalidad = document.getElementById('comp-calidad-valor');
  const selectFormato = document.getElementById('comp-formato');
  const btnGenerar = document.getElementById('btn-comp-generar');
  const resultado = document.getElementById('resultado-comp');
  const imgOriginal = document.getElementById('comp-img-original');
  const imgResultado = document.getElementById('comp-img-resultado');
  const pesoOriginalEl = document.getElementById('comp-peso-original');
  const pesoResultadoEl = document.getElementById('comp-peso-resultado');
  const ahorroEl = document.getElementById('comp-ahorro');
  const btnDescargar = document.getElementById('btn-comp-descargar');

  let imagenActual = null; // instancia HTMLImageElement ya cargada
  let pesoOriginal = 0;

  function formatearPeso(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function cargarArchivo(archivo) {
    if (!archivo || !archivo.type.startsWith('image/')) {
      window.mostrarToast('Elige un archivo de imagen válido', 'error');
      return;
    }
    pesoOriginal = archivo.size;
    const lector = new FileReader();
    lector.onload = (evento) => {
      const img = new Image();
      img.onload = () => {
        imagenActual = img;
        imgOriginal.src = evento.target.result;
        pesoOriginalEl.textContent = formatearPeso(pesoOriginal);
        controles.hidden = false;
        resultado.classList.remove('mostrar');
      };
      img.src = evento.target.result;
    };
    lector.readAsDataURL(archivo);
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

  inputCalidad.addEventListener('input', () => {
    valorCalidad.textContent = inputCalidad.value;
  });

  btnGenerar.addEventListener('click', () => {
    if (!imagenActual) return;

    const canvas = document.createElement('canvas');
    canvas.width = imagenActual.naturalWidth;
    canvas.height = imagenActual.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imagenActual, 0, 0);

    const formato = selectFormato.value;
    const calidad = parseInt(inputCalidad.value, 10) / 100;

    canvas.toBlob((blob) => {
      if (!blob) {
        window.mostrarToast('No se pudo comprimir esta imagen', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      imgResultado.src = url;
      pesoResultadoEl.textContent = formatearPeso(blob.size);

      const ahorro = pesoOriginal > 0 ? Math.max(0, (1 - blob.size / pesoOriginal) * 100) : 0;
      ahorroEl.textContent = `${ahorro.toFixed(0)}%`;

      const extension = formato === 'image/png' ? 'png' : formato === 'image/webp' ? 'webp' : 'jpg';
      btnDescargar.href = url;
      btnDescargar.download = `imagen-comprimida.${extension}`;

      resultado.classList.add('mostrar');
      resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, formato, calidad);
  });
});
