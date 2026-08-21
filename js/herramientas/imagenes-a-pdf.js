/**
 * herramientas/imagenes-a-pdf.js — une varias imágenes en un PDF
 * ---------------------------------------------------------
 * El PDF se arma con jsPDF (cargado por CDN vía cargador-librerias.js
 * solo cuando el visitante hace clic en "Generar PDF"). Una página
 * por imagen, del tamaño exacto de cada imagen — sin recortar ni
 * estirar nada.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  const dropzone = document.getElementById('imgpdf-dropzone');
  const inputArchivos = document.getElementById('imgpdf-archivos');
  const lista = document.getElementById('imgpdf-lista');
  const btnGenerar = document.getElementById('btn-imgpdf-generar');
  const progreso = document.getElementById('imgpdf-progreso');
  const progresoRelleno = document.getElementById('imgpdf-progreso-relleno');
  const progresoTexto = document.getElementById('imgpdf-progreso-texto');
  const resultado = document.getElementById('resultado-imgpdf');
  const infoResultado = document.getElementById('imgpdf-info-resultado');
  const btnDescargar = document.getElementById('btn-imgpdf-descargar');

  // Cada item: { id, archivo, dataUrl, img (HTMLImageElement ya cargada) }
  let imagenes = [];
  let contadorId = 0;

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

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

  function agregarArchivos(archivos) {
    Array.from(archivos).forEach((archivo) => {
      if (!archivo.type.startsWith('image/')) return;
      const id = `img-${contadorId++}`;
      const lector = new FileReader();
      lector.onload = (evento) => {
        const img = new Image();
        img.onload = () => {
          imagenes.push({ id, archivo, dataUrl: evento.target.result, img });
          pintarLista();
        };
        img.src = evento.target.result;
      };
      lector.readAsDataURL(archivo);
    });
  }

  function pintarLista() {
    resultado.classList.remove('mostrar');
    btnGenerar.disabled = imagenes.length === 0;

    lista.innerHTML = imagenes.map((item, indice) => `
      <div class="pub-miniatura-item" data-id="${item.id}">
        <img src="${item.dataUrl}" alt="" />
        <span class="pub-miniatura-nombre">${escaparHtml(item.archivo.name)}</span>
        <div class="pub-miniatura-acciones">
          <button type="button" data-accion="subir" ${indice === 0 ? 'disabled' : ''} title="Mover antes">▲</button>
          <button type="button" data-accion="bajar" ${indice === imagenes.length - 1 ? 'disabled' : ''} title="Mover después">▼</button>
          <button type="button" data-accion="quitar" title="Quitar">✕</button>
        </div>
      </div>
    `).join('');

    lista.querySelectorAll('[data-accion="subir"]').forEach((btn, indice) => {
      btn.addEventListener('click', () => moverImagen(indice, indice - 1));
    });
    lista.querySelectorAll('[data-accion="bajar"]').forEach((btn, indice) => {
      btn.addEventListener('click', () => moverImagen(indice, indice + 1));
    });
    lista.querySelectorAll('[data-accion="quitar"]').forEach((btn, indice) => {
      btn.addEventListener('click', () => {
        imagenes.splice(indice, 1);
        pintarLista();
      });
    });
  }

  function moverImagen(indiceActual, indiceDestino) {
    if (indiceDestino < 0 || indiceDestino >= imagenes.length) return;
    const [item] = imagenes.splice(indiceActual, 1);
    imagenes.splice(indiceDestino, 0, item);
    pintarLista();
  }

  inputArchivos.addEventListener('change', () => {
    if (inputArchivos.files.length) agregarArchivos(inputArchivos.files);
    inputArchivos.value = '';
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
    if (e.dataTransfer.files && e.dataTransfer.files.length) agregarArchivos(e.dataTransfer.files);
  });

  btnGenerar.addEventListener('click', async () => {
    if (!imagenes.length) return;
    btnGenerar.disabled = true;
    mostrarProgreso(5, 'Cargando el motor de PDF…');

    try {
      await window.cargarScriptCDN(JSPDF_URL, () => window.jspdf && window.jspdf.jsPDF);
      const { jsPDF } = window.jspdf;

      mostrarProgreso(20, `Armando página 1 de ${imagenes.length}…`);

      let doc = null;
      imagenes.forEach((item, indice) => {
        const ancho = item.img.naturalWidth;
        const alto = item.img.naturalHeight;
        if (!doc) {
          doc = new jsPDF({ orientation: ancho >= alto ? 'landscape' : 'portrait', unit: 'px', format: [ancho, alto] });
        } else {
          doc.addPage([ancho, alto], ancho >= alto ? 'landscape' : 'portrait');
        }
        const formatoJsPdf = item.archivo.type === 'image/jpeg' ? 'JPEG' : item.archivo.type === 'image/webp' ? 'WEBP' : 'PNG';
        doc.addImage(item.dataUrl, formatoJsPdf, 0, 0, ancho, alto);
        mostrarProgreso(20 + Math.round((60 * (indice + 1)) / imagenes.length), `Armando página ${indice + 1} de ${imagenes.length}…`);
      });

      mostrarProgreso(90, 'Generando el archivo final…');
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);

      infoResultado.textContent = `${imagenes.length} imagen${imagenes.length === 1 ? '' : 'es'} · ${(blob.size / (1024 * 1024)).toFixed(2)} MB`;
      btnDescargar.href = url;
      resultado.classList.add('mostrar');
      resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      mostrarProgreso(100, 'Listo');
      setTimeout(ocultarProgreso, 800);
    } catch (error) {
      ocultarProgreso();
      window.mostrarToast(error.message || 'No se pudo generar el PDF', 'error');
    } finally {
      btnGenerar.disabled = false;
    }
  });
});
