/**
 * herramientas/creador-diploma.js — arma un diploma/certificado en
 * PDF horizontal a partir de un formulario corto.
 * ---------------------------------------------------------
 * Igual patrón que creador-cv.js: jsPDF cargado por CDN solo al
 * generar, todo se dibuja a mano (marco decorativo + texto
 * centrado), nada del visitante sale del navegador. 3 combinaciones
 * de color fijas (dorado/azul/minimalista) elegidas por el
 * visitante en un <select>.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  const campoDestinatario = document.getElementById('dip-destinatario');
  const campoMotivo = document.getElementById('dip-motivo');
  const campoEmisor = document.getElementById('dip-emisor');
  const campoFecha = document.getElementById('dip-fecha');
  const campoFirma = document.getElementById('dip-firma');
  const campoEstilo = document.getElementById('dip-estilo');

  const btnGenerar = document.getElementById('btn-dip-generar');
  const elementoError = document.getElementById('dip-error');
  const progreso = document.getElementById('dip-progreso');
  const progresoRelleno = document.getElementById('dip-progreso-relleno');
  const progresoTexto = document.getElementById('dip-progreso-texto');
  const resultado = document.getElementById('resultado-dip');
  const infoResultado = document.getElementById('dip-info-resultado');
  const btnDescargar = document.getElementById('btn-dip-descargar');

  const ESTILOS = {
    dorado: { marco: [180, 140, 60], texto: [40, 32, 15], linea: [200, 165, 90] },
    azul: { marco: [40, 70, 120], texto: [25, 35, 55], linea: [90, 120, 165] },
    minimalista: { marco: [70, 70, 70], texto: [30, 30, 30], linea: [150, 150, 150] },
  };

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

  function formatearFecha(valorInput) {
    if (!valorInput) return '';
    const [anio, mes, dia] = valorInput.split('-');
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const indiceMes = parseInt(mes, 10) - 1;
    if (Number.isNaN(indiceMes) || !meses[indiceMes]) return valorInput;
    return `${parseInt(dia, 10)} de ${meses[indiceMes]} de ${anio}`;
  }

  function dibujarDiploma(doc, datos) {
    const paleta = ESTILOS[datos.estilo] || ESTILOS.dorado;
    const ANCHO = doc.internal.pageSize.getWidth();
    const ALTO = doc.internal.pageSize.getHeight();
    const MARGEN = 28;

    // Marco doble
    doc.setDrawColor(...paleta.marco);
    doc.setLineWidth(2.2);
    doc.rect(MARGEN, MARGEN, ANCHO - MARGEN * 2, ALTO - MARGEN * 2);
    doc.setLineWidth(0.7);
    doc.rect(MARGEN + 8, MARGEN + 8, ANCHO - (MARGEN + 8) * 2, ALTO - (MARGEN + 8) * 2);

    let y = MARGEN + 60;
    const centroX = ANCHO / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...paleta.marco);
    doc.text('CERTIFICADO DE RECONOCIMIENTO', centroX, y, { align: 'center' });
    y += 34;

    doc.setDrawColor(...paleta.linea);
    doc.setLineWidth(1);
    doc.line(centroX - 90, y, centroX + 90, y);
    y += 34;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11.5);
    doc.setTextColor(...paleta.texto);
    doc.text('Se otorga el presente reconocimiento a', centroX, y, { align: 'center' });
    y += 34;

    doc.setFont('times', 'bolditalic');
    doc.setFontSize(30);
    doc.setTextColor(...paleta.marco);
    doc.text(datos.destinatario, centroX, y, { align: 'center' });
    y += 34;

    if (datos.motivo) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(...paleta.texto);
      const lineas = doc.splitTextToSize(datos.motivo, ANCHO - MARGEN * 4);
      doc.text(lineas, centroX, y, { align: 'center' });
      y += lineas.length * 16 + 10;
    }

    // Pie: fecha (izquierda) y firma (derecha)
    const yPie = ALTO - MARGEN - 55;
    doc.setDrawColor(...paleta.linea);
    doc.setLineWidth(0.6);

    if (datos.fecha) {
      doc.line(centroX - 180, yPie, centroX - 40, yPie);
      doc.setFontSize(9.5);
      doc.setTextColor(...paleta.texto);
      doc.text(datos.fecha, centroX - 110, yPie + 14, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('Fecha', centroX - 110, yPie + 25, { align: 'center' });
    }

    const textoFirma = datos.firma || datos.emisor;
    if (textoFirma) {
      doc.line(centroX + 40, yPie, centroX + 180, yPie);
      doc.setFontSize(9.5);
      doc.setTextColor(...paleta.texto);
      doc.text(textoFirma, centroX + 110, yPie + 14, { align: 'center' });
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text(datos.emisor && datos.firma ? datos.emisor : 'Firma', centroX + 110, yPie + 25, { align: 'center' });
    }
  }

  btnGenerar.addEventListener('click', async () => {
    elementoError.style.display = 'none';
    const destinatario = campoDestinatario.value.trim();
    if (!destinatario) {
      elementoError.textContent = 'Escribe el nombre del destinatario antes de generar el PDF.';
      elementoError.style.display = 'block';
      campoDestinatario.focus();
      return;
    }

    const datos = {
      destinatario,
      motivo: campoMotivo.value.trim(),
      emisor: campoEmisor.value.trim(),
      fecha: formatearFecha(campoFecha.value),
      firma: campoFirma.value.trim(),
      estilo: campoEstilo.value,
    };

    btnGenerar.disabled = true;
    mostrarProgreso(15, 'Cargando el motor de PDF…');

    try {
      await window.cargarScriptCDN(JSPDF_URL, () => window.jspdf && window.jspdf.jsPDF);
      const { jsPDF } = window.jspdf;

      mostrarProgreso(55, 'Armando tu diploma…');
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      dibujarDiploma(doc, datos);

      mostrarProgreso(90, 'Generando el archivo final…');
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);

      infoResultado.textContent = `${(blob.size / 1024).toFixed(0)} KB · orientación horizontal`;
      btnDescargar.href = url;
      const nombreArchivo = destinatario.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'diploma';
      btnDescargar.download = `diploma-${nombreArchivo}.pdf`;
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
