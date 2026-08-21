/**
 * herramientas/qr.js — lógica de herramientas/qr.html
 * ---------------------------------------------------------
 * Genera el QR con la librería vendorizada (js/vendor/qrcode.js) y
 * lo dibuja a mano en un <canvas> propio (en vez de usar el método
 * createImgTag de la librería) para poder ofrecer una descarga PNG
 * limpia con `canvas.toDataURL('image/png')`.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const form = document.getElementById('form-qr');
  const resultado = document.getElementById('resultado-qr');
  const canvas = document.getElementById('qr-canvas');
  const btnDescargar = document.getElementById('btn-descargar-qr');
  const ctx = canvas.getContext('2d');

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const texto = document.getElementById('qr-texto').value.trim();
    if (!texto) return;
    const cellSize = parseInt(document.getElementById('qr-tamano').value, 10);

    // typeNumber 0 = la librería elige automáticamente el tamaño
    // mínimo necesario según cuánto texto se le dé.
    const qr = qrcode(0, 'M');
    qr.addData(texto);
    qr.make();

    const modulos = qr.getModuleCount();
    const margen = 4; // en "módulos", no en píxeles
    const ladoPx = (modulos + margen * 2) * cellSize;
    canvas.width = ladoPx;
    canvas.height = ladoPx;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, ladoPx, ladoPx);
    ctx.fillStyle = '#000000';
    for (let fila = 0; fila < modulos; fila++) {
      for (let columna = 0; columna < modulos; columna++) {
        if (qr.isDark(fila, columna)) {
          ctx.fillRect(
            (columna + margen) * cellSize,
            (fila + margen) * cellSize,
            cellSize,
            cellSize
          );
        }
      }
    }

    btnDescargar.href = canvas.toDataURL('image/png');
    resultado.classList.add('mostrar');
    resultado.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
});
