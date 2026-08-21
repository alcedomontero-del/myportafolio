/**
 * herramientas/pdf-a-imagenes.js — convierte cada página de un PDF
 * en una imagen descargable, usando pdf.js (cargado por CDN vía
 * cargador-librerias.js solo al abrir esta herramienta).
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const PDFJS_VERSION = '3.11.174';
  const PDFJS_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
  const PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

  const dropzone = document.getElementById('pdfimg-dropzone');
  const inputArchivo = document.getElementById('pdfimg-archivo');
  const controles = document.getElementById('pdfimg-controles');
  const infoArchivo = document.getElementById('pdfimg-info-archivo');
  const selectFormato = document.getElementById('pdfimg-formato');
  const selectCalidad = document.getElementById('pdfimg-calidad');
  const btnConvertir = document.getElementById('btn-pdfimg-convertir');
  const progreso = document.getElementById('pdfimg-progreso');
  const progresoRelleno = document.getElementById('pdfimg-progreso-relleno');
  const progresoTexto = document.getElementById('pdfimg-progreso-texto');
  const resultado = document.getElementById('resultado-pdfimg');
  const gridPaginas = document.getElementById('pdfimg-grid-paginas');

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
    if (!archivo || archivo.type !== 'application/pdf') {
      window.mostrarToast('Elige un archivo PDF válido', 'error');
      return;
    }
    archivoActual = archivo;
    infoArchivo.textContent = `${archivo.name} · ${(archivo.size / (1024 * 1024)).toFixed(2)} MB`;
    controles.hidden = false;
    resultado.classList.remove('mostrar');
    gridPaginas.innerHTML = '';
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

  btnConvertir.addEventListener('click', async () => {
    if (!archivoActual) return;
    btnConvertir.disabled = true;
    mostrarProgreso(5, 'Cargando el motor de PDF…');

    try {
      await window.cargarScriptCDN(PDFJS_URL, () => window.pdfjsLib);
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

      mostrarProgreso(15, 'Leyendo el archivo…');
      const bufferArchivo = await archivoActual.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: bufferArchivo }).promise;

      const escala = parseFloat(selectCalidad.value);
      const formato = selectFormato.value;
      const extension = formato === 'image/png' ? 'png' : 'jpg';
      gridPaginas.innerHTML = '';

      for (let numero = 1; numero <= pdf.numPages; numero++) {
        mostrarProgreso(15 + Math.round((80 * numero) / pdf.numPages), `Convirtiendo página ${numero} de ${pdf.numPages}…`);

        const pagina = await pdf.getPage(numero);
        const viewport = pagina.getViewport({ scale: escala });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await pagina.render({ canvasContext: ctx, viewport }).promise;

        // eslint-disable-next-line no-await-in-loop
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, formato, 0.92));
        const url = URL.createObjectURL(blob);

        const item = document.createElement('div');
        item.className = 'pub-pagina-item';
        item.innerHTML = `
          <img src="${url}" alt="Página ${numero}" />
          <div class="pub-pagina-pie">Página ${numero} · ${(blob.size / 1024).toFixed(0)} KB</div>
        `;
        const link = document.createElement('a');
        link.className = 'pub-btn pub-btn-secundario';
        link.href = url;
        link.download = `pagina-${String(numero).padStart(2, '0')}.${extension}`;
        link.textContent = 'Descargar';
        item.appendChild(link);
        gridPaginas.appendChild(item);
      }

      resultado.classList.add('mostrar');
      resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      mostrarProgreso(100, 'Listo');
      setTimeout(ocultarProgreso, 800);
    } catch (error) {
      ocultarProgreso();
      window.mostrarToast(error.message || 'No se pudo convertir el PDF', 'error');
    } finally {
      btnConvertir.disabled = false;
    }
  });
});
