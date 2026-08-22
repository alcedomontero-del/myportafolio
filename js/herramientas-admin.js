/**
 * herramientas-admin.js — lógica del área "Herramientas" en admin.html
 * ---------------------------------------------------------
 * No es un CRUD completo: el catálogo de herramientas es fijo (vive
 * en el código de cada herramienta pública). Aquí solo se controla
 * si aparecen en el sitio (activa) y en qué orden (orden — mayor
 * número se muestra primero, igual que getHerramientas() las
 * devuelve ya ordenadas).
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const lista = document.getElementById('lista-herramientas');
  const btnCargarCatalogo = document.getElementById('btn-cargar-catalogo-herramientas');

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  // Catálogo fijo aprobado (ver RESUMEN-PORTAFOLIO.md). "orden" queda
  // igual que en local-db.js: mayor número se muestra primero.
  const CATALOGO_HERRAMIENTAS = [
    { nombre: 'Generador de código QR', emoji: '🔳', slug: 'qr', activa: true, orden: 12 },
    { nombre: 'Generador de contraseñas seguras', emoji: '🔐', slug: 'contrasenas', activa: true, orden: 11 },
    { nombre: 'Compresor de imágenes', emoji: '🖼️', slug: 'comprimir-imagen', activa: true, orden: 10 },
    { nombre: 'Redimensionador/recortador de imágenes', emoji: '✂️', slug: 'recortar-imagen', activa: true, orden: 9 },
    { nombre: 'Convertidor de imágenes a PDF', emoji: '📄', slug: 'imagenes-a-pdf', activa: true, orden: 8 },
    { nombre: 'Convertidor de PDF a imágenes', emoji: '🖨️', slug: 'pdf-a-imagenes', activa: true, orden: 7 },
    { nombre: 'Extractor de texto desde una imagen', emoji: '🔤', slug: 'ocr', activa: true, orden: 6 },
    { nombre: 'Convertidor de unidades y medidas', emoji: '📏', slug: 'unidades', activa: true, orden: 5 },
    { nombre: 'Contador de palabras y caracteres', emoji: '📝', slug: 'contador-texto', activa: true, orden: 4 },
    { nombre: 'Paleta de colores', emoji: '🎨', slug: 'paleta-colores', activa: true, orden: 3 },
    { nombre: 'Creador de currículum (PDF)', emoji: '📋', slug: 'creador-cv', activa: true, orden: 2 },
    { nombre: 'Creador de diplomas/certificados (PDF)', emoji: '🏅', slug: 'creador-diploma', activa: true, orden: 1 },
  ];

  if (btnCargarCatalogo) {
    btnCargarCatalogo.addEventListener('click', async () => {
      btnCargarCatalogo.disabled = true;
      try {
        const existentes = await window.DB.getHerramientas();
        const slugsExistentes = new Set(existentes.map((h) => h.slug));
        const faltantes = CATALOGO_HERRAMIENTAS.filter((h) => !slugsExistentes.has(h.slug));

        if (!faltantes.length) {
          window.mostrarToast('Las 12 herramientas ya están cargadas — no se creó nada nuevo');
          return;
        }
        for (const h of faltantes) {
          await window.DB.agregarHerramienta(h);
        }
        window.mostrarToast(`${faltantes.length} herramienta(s) cargada(s)`);
        await cargarHerramientas();
      } catch (error) {
        window.mostrarToast(error.message || 'No se pudo cargar el catálogo', 'error');
      } finally {
        btnCargarCatalogo.disabled = false;
      }
    });
  }

  async function cargarHerramientas() {
    const herramientas = await window.DB.getHerramientas();

    if (!herramientas.length) {
      lista.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">🧰</span>
          No hay herramientas registradas.
        </div>`;
      return;
    }

    lista.innerHTML = herramientas.map((h, indice) => `
      <div class="lcars-item ${h.activa ? '' : 'inactiva'}" data-id="${h.id}">
        <label class="lcars-switch">
          <input type="checkbox" data-accion="toggle" ${h.activa ? 'checked' : ''} />
          <span class="riel"></span>
        </label>
        <div class="lcars-item-cuerpo">
          <div class="lcars-item-titulo">${escaparHtml(h.emoji)} ${escaparHtml(h.nombre)}</div>
          <div class="lcars-item-meta">/${escaparHtml(h.slug)} · ${h.activa ? 'Visible en el sitio' : 'Oculta'}</div>
        </div>
        <div class="lcars-item-acciones">
          <button class="lcars-btn-orden" data-accion="subir" ${indice === 0 ? 'disabled' : ''} title="Subir">▲</button>
          <button class="lcars-btn-orden" data-accion="bajar" ${indice === herramientas.length - 1 ? 'disabled' : ''} title="Bajar">▼</button>
        </div>
      </div>
    `).join('');

    lista.querySelectorAll('[data-accion="toggle"]').forEach((input) => {
      input.addEventListener('change', async () => {
        const id = input.closest('.lcars-item').dataset.id;
        await window.DB.actualizarHerramienta(id, { activa: input.checked });
        window.mostrarToast(input.checked ? 'Herramienta activada' : 'Herramienta desactivada');
        cargarHerramientas();
      });
    });

    lista.querySelectorAll('[data-accion="subir"]').forEach((btn, indice) => {
      btn.addEventListener('click', () => moverHerramienta(herramientas, indice, indice - 1));
    });
    lista.querySelectorAll('[data-accion="bajar"]').forEach((btn, indice) => {
      btn.addEventListener('click', () => moverHerramienta(herramientas, indice, indice + 1));
    });
  }

  async function moverHerramienta(herramientas, indiceActual, indiceDestino) {
    if (indiceDestino < 0 || indiceDestino >= herramientas.length) return;
    const actual = herramientas[indiceActual];
    const vecino = herramientas[indiceDestino];
    // Se intercambian los valores de "orden" entre los dos elementos
    // (mayor orden = se muestra primero, ver comentario arriba).
    await Promise.all([
      window.DB.actualizarHerramienta(actual.id, { orden: vecino.orden }),
      window.DB.actualizarHerramienta(vecino.id, { orden: actual.orden }),
    ]);
    cargarHerramientas();
  }

  window.inicializarAreaHerramientas = cargarHerramientas;
});
