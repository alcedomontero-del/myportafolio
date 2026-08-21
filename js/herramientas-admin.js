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

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
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
