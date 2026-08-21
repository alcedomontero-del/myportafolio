/**
 * herramientas/recortar-imagen.js — redimensionador y recortador
 * ---------------------------------------------------------
 * Redimensionar: dibuja la imagen en un <canvas> del tamaño pedido.
 * Recortar: dibuja la imagen a una resolución reducida (para que el
 * arrastre del mouse sea cómodo), y al soltar convierte esas
 * coordenadas de vuelta a la resolución real de la imagen original
 * para recortar sin perder calidad.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const dropzone = document.getElementById('rec-dropzone');
  const inputArchivo = document.getElementById('rec-archivo');
  const areaTrabajo = document.getElementById('rec-area-trabajo');
  const tamanoOriginalEl = document.getElementById('rec-tamano-original');

  const inputAncho = document.getElementById('rec-ancho');
  const inputAlto = document.getElementById('rec-alto');
  const checkProporcion = document.getElementById('rec-proporcion');
  const btnRedimensionar = document.getElementById('btn-rec-redimensionar');

  const canvas = document.getElementById('rec-canvas');
  const ctx = canvas.getContext('2d');
  const contenedorLienzo = document.getElementById('rec-lienzo-contenedor');
  const seleccionEl = document.getElementById('rec-seleccion');
  const btnRecortar = document.getElementById('btn-rec-recortar');

  const resultado = document.getElementById('resultado-rec');
  const imgResultado = document.getElementById('rec-img-resultado');
  const tamanoResultadoEl = document.getElementById('rec-tamano-resultado');
  const btnDescargar = document.getElementById('btn-rec-descargar');

  const ANCHO_MAXIMO_LIENZO = 640;

  let imagenActual = null;
  let escalaLienzo = 1; // px del lienzo por cada px de la imagen real
  let seleccionInterna = null; // {x, y, w, h} en px del lienzo (resolución interna)
  let arrastrando = false;
  let puntoInicio = null;

  function cargarArchivo(archivo) {
    if (!archivo || !archivo.type.startsWith('image/')) {
      window.mostrarToast('Elige un archivo de imagen válido', 'error');
      return;
    }
    const lector = new FileReader();
    lector.onload = (evento) => {
      const img = new Image();
      img.onload = () => {
        imagenActual = img;
        tamanoOriginalEl.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;
        inputAncho.value = img.naturalWidth;
        inputAlto.value = img.naturalHeight;
        areaTrabajo.hidden = false;
        resultado.classList.remove('mostrar');
        dibujarLienzoRecorte();
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

  // ---------- Redimensionar ----------
  function aspectoOriginal() {
    return imagenActual.naturalHeight / imagenActual.naturalWidth;
  }

  inputAncho.addEventListener('input', () => {
    if (!imagenActual || !checkProporcion.checked) return;
    const ancho = parseInt(inputAncho.value, 10);
    if (ancho > 0) inputAlto.value = Math.round(ancho * aspectoOriginal());
  });
  inputAlto.addEventListener('input', () => {
    if (!imagenActual || !checkProporcion.checked) return;
    const alto = parseInt(inputAlto.value, 10);
    if (alto > 0) inputAncho.value = Math.round(alto / aspectoOriginal());
  });

  btnRedimensionar.addEventListener('click', () => {
    if (!imagenActual) return;
    const ancho = parseInt(inputAncho.value, 10);
    const alto = parseInt(inputAlto.value, 10);
    if (!ancho || !alto || ancho < 1 || alto < 1) {
      window.mostrarToast('Ingresa un ancho y alto válidos', 'error');
      return;
    }
    const salida = document.createElement('canvas');
    salida.width = ancho;
    salida.height = alto;
    salida.getContext('2d').drawImage(imagenActual, 0, 0, ancho, alto);
    mostrarResultado(salida, `${ancho} × ${alto} px`, 'imagen-redimensionada.png');
  });

  // ---------- Recortar ----------
  function dibujarLienzoRecorte() {
    escalaLienzo = Math.min(1, ANCHO_MAXIMO_LIENZO / imagenActual.naturalWidth);
    canvas.width = Math.round(imagenActual.naturalWidth * escalaLienzo);
    canvas.height = Math.round(imagenActual.naturalHeight * escalaLienzo);
    ctx.drawImage(imagenActual, 0, 0, canvas.width, canvas.height);
    seleccionInterna = null;
    seleccionEl.classList.remove('activa');
    btnRecortar.disabled = true;
  }

  function puntoDesdeEvento(evento) {
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    return {
      x: Math.min(Math.max(0, (evento.clientX - rect.left) * escalaX), canvas.width),
      y: Math.min(Math.max(0, (evento.clientY - rect.top) * escalaY), canvas.height),
      clientX: Math.min(Math.max(rect.left, evento.clientX), rect.right),
      clientY: Math.min(Math.max(rect.top, evento.clientY), rect.bottom),
    };
  }

  function pintarOverlay(inicio, actual) {
    const rectCanvas = canvas.getBoundingClientRect();
    const rectContenedor = contenedorLienzo.getBoundingClientRect();
    const izquierda = Math.min(inicio.clientX, actual.clientX) - rectContenedor.left;
    const arriba = Math.min(inicio.clientY, actual.clientY) - rectContenedor.top;
    const ancho = Math.abs(actual.clientX - inicio.clientX);
    const alto = Math.abs(actual.clientY - inicio.clientY);
    seleccionEl.style.left = `${izquierda}px`;
    seleccionEl.style.top = `${arriba}px`;
    seleccionEl.style.width = `${ancho}px`;
    seleccionEl.style.height = `${alto}px`;
    seleccionEl.classList.add('activa');
    void rectCanvas; // el rect del canvas ya se usó dentro de puntoDesdeEvento
  }

  canvas.addEventListener('mousedown', (evento) => {
    if (!imagenActual) return;
    arrastrando = true;
    puntoInicio = puntoDesdeEvento(evento);
    pintarOverlay(puntoInicio, puntoInicio);
  });

  document.addEventListener('mousemove', (evento) => {
    if (!arrastrando) return;
    const puntoActual = puntoDesdeEvento(evento);
    pintarOverlay(puntoInicio, puntoActual);
    seleccionInterna = {
      x: Math.min(puntoInicio.x, puntoActual.x),
      y: Math.min(puntoInicio.y, puntoActual.y),
      w: Math.abs(puntoActual.x - puntoInicio.x),
      h: Math.abs(puntoActual.y - puntoInicio.y),
    };
  });

  document.addEventListener('mouseup', () => {
    if (!arrastrando) return;
    arrastrando = false;
    const seleccionValida = seleccionInterna && seleccionInterna.w > 6 && seleccionInterna.h > 6;
    btnRecortar.disabled = !seleccionValida;
  });

  btnRecortar.addEventListener('click', () => {
    if (!imagenActual || !seleccionInterna) return;
    // Las coordenadas de la selección están en px del lienzo reducido;
    // se vuelven a escalar a la resolución real de la imagen original.
    const factor = 1 / escalaLienzo;
    const sx = Math.round(seleccionInterna.x * factor);
    const sy = Math.round(seleccionInterna.y * factor);
    const sw = Math.round(seleccionInterna.w * factor);
    const sh = Math.round(seleccionInterna.h * factor);

    const salida = document.createElement('canvas');
    salida.width = sw;
    salida.height = sh;
    salida.getContext('2d').drawImage(imagenActual, sx, sy, sw, sh, 0, 0, sw, sh);
    seleccionEl.classList.remove('activa');
    seleccionInterna = null;
    btnRecortar.disabled = true;
    mostrarResultado(salida, `${sw} × ${sh} px`, 'imagen-recortada.png');
  });

  function mostrarResultado(canvasSalida, textoTamano, nombreArchivo) {
    const url = canvasSalida.toDataURL('image/png');
    imgResultado.src = url;
    tamanoResultadoEl.textContent = textoTamano;
    btnDescargar.href = url;
    btnDescargar.download = nombreArchivo;
    resultado.classList.add('mostrar');
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});
