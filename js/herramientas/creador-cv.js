/**
 * herramientas/creador-cv.js — arma un currículum en PDF a partir de
 * un formulario que llena el visitante.
 * ---------------------------------------------------------
 * El PDF se dibuja a mano con jsPDF (texto + líneas, sin plantilla
 * HTML->PDF) para tener control total del salto de página cuando el
 * contenido no cabe en una sola hoja. Igual que imagenes-a-pdf.js,
 * la librería se carga por CDN vía cargador-librerias.js solo al
 * generar, y ningún dato del visitante sale del navegador.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  const campoNombre = document.getElementById('cv-nombre');
  const campoPuesto = document.getElementById('cv-puesto');
  const campoCorreo = document.getElementById('cv-correo');
  const campoTelefono = document.getElementById('cv-telefono');
  const campoUbicacion = document.getElementById('cv-ubicacion');
  const campoResumen = document.getElementById('cv-resumen');
  const campoHabilidades = document.getElementById('cv-habilidades');

  const listaExperiencia = document.getElementById('cv-lista-experiencia');
  const listaEducacion = document.getElementById('cv-lista-educacion');
  const btnAgregarExperiencia = document.getElementById('btn-cv-agregar-experiencia');
  const btnAgregarEducacion = document.getElementById('btn-cv-agregar-educacion');

  const btnGenerar = document.getElementById('btn-cv-generar');
  const elementoError = document.getElementById('cv-error');
  const progreso = document.getElementById('cv-progreso');
  const progresoRelleno = document.getElementById('cv-progreso-relleno');
  const progresoTexto = document.getElementById('cv-progreso-texto');
  const resultado = document.getElementById('resultado-cv');
  const infoResultado = document.getElementById('cv-info-resultado');
  const btnDescargar = document.getElementById('btn-cv-descargar');

  let contadorExperiencia = 0;
  let contadorEducacion = 0;

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

  // ---------- Bloques repetibles: experiencia y educación ----------
  function agregarExperiencia() {
    const id = `exp-${contadorExperiencia++}`;
    const bloque = document.createElement('div');
    bloque.className = 'pub-entrada-repetible';
    bloque.dataset.id = id;
    bloque.dataset.tipo = 'experiencia';
    bloque.innerHTML = `
      <button type="button" class="pub-entrada-repetible-quitar" data-accion="quitar" title="Quitar">✕</button>
      <div class="pub-campo">
        <label>Puesto</label>
        <input type="text" data-campo="puesto" placeholder="Ej. Desarrollador web freelance" />
      </div>
      <div class="pub-fila-campos">
        <div class="pub-campo">
          <label>Empresa o cliente</label>
          <input type="text" data-campo="empresa" placeholder="Ej. Independiente" />
        </div>
        <div class="pub-campo">
          <label>Periodo</label>
          <input type="text" data-campo="periodo" placeholder="Ej. 2023 — presente" />
        </div>
      </div>
      <div class="pub-campo">
        <label>Descripción</label>
        <textarea data-campo="descripcion" placeholder="Qué hiciste, con qué resultado."></textarea>
      </div>
    `;
    listaExperiencia.appendChild(bloque);
    bloque.querySelector('[data-accion="quitar"]').addEventListener('click', () => bloque.remove());
  }

  function agregarEducacion() {
    const id = `edu-${contadorEducacion++}`;
    const bloque = document.createElement('div');
    bloque.className = 'pub-entrada-repetible';
    bloque.dataset.id = id;
    bloque.dataset.tipo = 'educacion';
    bloque.innerHTML = `
      <button type="button" class="pub-entrada-repetible-quitar" data-accion="quitar" title="Quitar">✕</button>
      <div class="pub-campo">
        <label>Título o curso</label>
        <input type="text" data-campo="titulo" placeholder="Ej. Técnico en desarrollo de software" />
      </div>
      <div class="pub-fila-campos">
        <div class="pub-campo">
          <label>Institución</label>
          <input type="text" data-campo="institucion" placeholder="Ej. Instituto Técnico" />
        </div>
        <div class="pub-campo">
          <label>Periodo</label>
          <input type="text" data-campo="periodo" placeholder="Ej. 2020 — 2022" />
        </div>
      </div>
    `;
    listaEducacion.appendChild(bloque);
    bloque.querySelector('[data-accion="quitar"]').addEventListener('click', () => bloque.remove());
  }

  btnAgregarExperiencia.addEventListener('click', agregarExperiencia);
  btnAgregarEducacion.addEventListener('click', agregarEducacion);
  // Arranca con un bloque de cada uno para no dejar el formulario vacío.
  agregarExperiencia();
  agregarEducacion();

  function leerBloques(contenedor, campos) {
    return Array.from(contenedor.children).map((bloque) => {
      const item = {};
      campos.forEach((campo) => {
        item[campo] = bloque.querySelector(`[data-campo="${campo}"]`).value.trim();
      });
      return item;
    }).filter((item) => Object.values(item).some((v) => v));
  }

  // ---------- Armado del PDF ----------
  function dibujarCV(doc, datos) {
    const ANCHO_PAGINA = doc.internal.pageSize.getWidth();
    const ALTO_PAGINA = doc.internal.pageSize.getHeight();
    const MARGEN = 48;
    const ANCHO_UTIL = ANCHO_PAGINA - MARGEN * 2;
    let y = MARGEN;

    function saltoDePaginaSiHaceFalta(alturaNecesaria) {
      if (y + alturaNecesaria > ALTO_PAGINA - MARGEN) {
        doc.addPage();
        y = MARGEN;
      }
    }

    function titulo(texto) {
      saltoDePaginaSiHaceFalta(24);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(texto.toUpperCase(), MARGEN, y);
      y += 4;
      doc.setDrawColor(180, 180, 180);
      doc.line(MARGEN, y, ANCHO_PAGINA - MARGEN, y);
      y += 16;
    }

    function parrafo(texto, opciones) {
      const tamano = (opciones && opciones.tamano) || 10;
      const negrita = (opciones && opciones.negrita) || false;
      const color = (opciones && opciones.color) || [60, 60, 60];
      doc.setFont('helvetica', negrita ? 'bold' : 'normal');
      doc.setFontSize(tamano);
      doc.setTextColor(color[0], color[1], color[2]);
      const lineas = doc.splitTextToSize(texto, ANCHO_UTIL);
      saltoDePaginaSiHaceFalta(lineas.length * (tamano * 1.3));
      doc.text(lineas, MARGEN, y);
      y += lineas.length * (tamano * 1.3) + 4;
    }

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text(datos.nombre, MARGEN, y);
    y += 22;

    if (datos.puesto) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(100, 90, 60);
      doc.text(datos.puesto, MARGEN, y);
      y += 18;
    }

    const contacto = [datos.correo, datos.telefono, datos.ubicacion].filter(Boolean).join('   ·   ');
    if (contacto) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(110, 110, 110);
      doc.text(contacto, MARGEN, y);
      y += 20;
    } else {
      y += 8;
    }

    if (datos.resumen) {
      titulo('Perfil profesional');
      parrafo(datos.resumen);
      y += 6;
    }

    if (datos.experiencia.length) {
      titulo('Experiencia laboral');
      datos.experiencia.forEach((exp) => {
        const linea1 = [exp.puesto, exp.empresa].filter(Boolean).join(' — ');
        if (linea1) parrafo(linea1, { negrita: true, tamano: 10.5, color: [30, 30, 30] });
        if (exp.periodo) parrafo(exp.periodo, { tamano: 9, color: [140, 140, 140] });
        if (exp.descripcion) parrafo(exp.descripcion, { tamano: 9.5 });
        y += 6;
      });
    }

    if (datos.educacion.length) {
      titulo('Educación');
      datos.educacion.forEach((edu) => {
        const linea1 = [edu.titulo, edu.institucion].filter(Boolean).join(' — ');
        if (linea1) parrafo(linea1, { negrita: true, tamano: 10.5, color: [30, 30, 30] });
        if (edu.periodo) parrafo(edu.periodo, { tamano: 9, color: [140, 140, 140] });
        y += 6;
      });
    }

    if (datos.habilidades.length) {
      titulo('Habilidades');
      parrafo(datos.habilidades.join('   ·   '));
    }
  }

  btnGenerar.addEventListener('click', async () => {
    elementoError.style.display = 'none';
    const nombre = campoNombre.value.trim();
    if (!nombre) {
      elementoError.textContent = 'Escribe tu nombre completo antes de generar el PDF.';
      elementoError.style.display = 'block';
      campoNombre.focus();
      return;
    }

    const datos = {
      nombre,
      puesto: campoPuesto.value.trim(),
      correo: campoCorreo.value.trim(),
      telefono: campoTelefono.value.trim(),
      ubicacion: campoUbicacion.value.trim(),
      resumen: campoResumen.value.trim(),
      experiencia: leerBloques(listaExperiencia, ['puesto', 'empresa', 'periodo', 'descripcion']),
      educacion: leerBloques(listaEducacion, ['titulo', 'institucion', 'periodo']),
      habilidades: campoHabilidades.value.split(',').map((h) => h.trim()).filter(Boolean),
    };

    btnGenerar.disabled = true;
    mostrarProgreso(15, 'Cargando el motor de PDF…');

    try {
      await window.cargarScriptCDN(JSPDF_URL, () => window.jspdf && window.jspdf.jsPDF);
      const { jsPDF } = window.jspdf;

      mostrarProgreso(55, 'Armando tu currículum…');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      dibujarCV(doc, datos);

      mostrarProgreso(90, 'Generando el archivo final…');
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);

      infoResultado.textContent = `${(blob.size / 1024).toFixed(0)} KB · ${doc.internal.getNumberOfPages()} página${doc.internal.getNumberOfPages() === 1 ? '' : 's'}`;
      btnDescargar.href = url;
      const nombreArchivo = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'cv';
      btnDescargar.download = `cv-${nombreArchivo}.pdf`;
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
