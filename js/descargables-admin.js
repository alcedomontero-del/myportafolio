/**
 * descargables-admin.js — lógica del área "Descargables" en admin.html
 * ---------------------------------------------------------
 * CRUD de archivos reales de uso libre (apps propias + CV). A
 * diferencia de Portafolio/Testimonios, aquí no hay vista previa de
 * imagen posible (PDF/ZIP), así que solo se muestra el nombre del
 * archivo elegido. El campo "esCV" marca cuál de los archivos es el
 * CV — el sitio público lo destaca aparte del resto.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  const formDescargable = document.getElementById('form-descargable');
  const listaDescargables = document.getElementById('lista-descargables');
  const btnCancelarDescargable = document.getElementById('btn-cancelar-descargable');
  const inputArchivoDescargable = document.getElementById('descargable-archivo');
  const nombreArchivoSpan = document.getElementById('descargable-archivo-nombre');
  let archivoActualDescargable = '';

  inputArchivoDescargable.addEventListener('change', () => {
    const archivo = inputArchivoDescargable.files[0];
    nombreArchivoSpan.textContent = archivo ? `📎 ${archivo.name}` : '';
  });

  async function cargarDescargables() {
    const descargables = await window.DB.getDescargables();
    if (!descargables.length) {
      listaDescargables.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">📦</span>
          Todavía no hay archivos. Sube el primero arriba.
        </div>`;
      return;
    }
    listaDescargables.innerHTML = descargables.map((d) => `
      <div class="lcars-item" data-id="${d.id}">
        <div class="lcars-item-cuerpo">
          <div class="lcars-item-titulo">${d.esCV ? '⭐ ' : ''}${escaparHtml(d.nombre)}</div>
          <div class="lcars-item-meta">${d.archivoUrl ? '📎 archivo cargado' : '⚠️ sin archivo'}${d.esCV ? ' · Marcado como CV' : ''}</div>
        </div>
        <div class="lcars-item-acciones">
          <button style="background:var(--lcars-azul); color:#0a0a1a;" data-accion="editar">Editar</button>
          <button style="background:var(--lcars-rojo); color:#140505;" data-accion="eliminar">Eliminar</button>
        </div>
      </div>
    `).join('');

    listaDescargables.querySelectorAll('[data-accion="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.lcars-item').dataset.id;
        const d = descargables.find((x) => x.id === id);
        abrirEdicionDescargable(d);
      });
    });
    listaDescargables.querySelectorAll('[data-accion="eliminar"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.lcars-item').dataset.id;
        if (!confirm('¿Eliminar este archivo? No se puede deshacer.')) return;
        await window.DB.eliminarDescargable(id);
        window.mostrarToast('Archivo eliminado');
        cargarDescargables();
      });
    });
  }

  function abrirEdicionDescargable(d) {
    document.getElementById('titulo-form-descargable').textContent = 'Editar archivo';
    document.getElementById('descargable-id').value = d.id;
    document.getElementById('descargable-nombre').value = d.nombre || '';
    document.getElementById('descargable-descripcion').value = d.descripcion || '';
    document.getElementById('descargable-es-cv').checked = !!d.esCV;
    archivoActualDescargable = d.archivoUrl || '';
    nombreArchivoSpan.textContent = archivoActualDescargable ? '📎 archivo ya cargado (sube uno nuevo para reemplazarlo)' : '';
    btnCancelarDescargable.hidden = false;
    formDescargable.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function limpiarFormDescargable() {
    document.getElementById('titulo-form-descargable').textContent = 'Nuevo archivo';
    formDescargable.reset();
    document.getElementById('descargable-id').value = '';
    nombreArchivoSpan.textContent = '';
    archivoActualDescargable = '';
    btnCancelarDescargable.hidden = true;
  }
  btnCancelarDescargable.addEventListener('click', limpiarFormDescargable);

  formDescargable.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const id = document.getElementById('descargable-id').value;
    const archivo = inputArchivoDescargable.files[0] || null;
    if (!id && !archivo) {
      window.mostrarToast('Elige un archivo PDF o ZIP para subir', 'error');
      return;
    }
    const datos = {
      nombre: window.normalizarTexto(document.getElementById('descargable-nombre').value),
      descripcion: window.normalizarTexto(document.getElementById('descargable-descripcion').value),
      esCV: document.getElementById('descargable-es-cv').checked,
      archivoUrl: archivoActualDescargable,
    };
    const boton = document.getElementById('btn-guardar-descargable');
    boton.disabled = true;
    try {
      if (id) {
        await window.DB.actualizarDescargable(id, datos, archivo);
        window.mostrarToast('Archivo actualizado');
      } else {
        await window.DB.agregarDescargable(datos, archivo);
        window.mostrarToast('Archivo agregado');
      }
      limpiarFormDescargable();
      await cargarDescargables();
    } catch (error) {
      window.mostrarToast(error.message || 'No se pudo guardar el archivo', 'error');
    } finally {
      boton.disabled = false;
    }
  });

  // ---------- Arranque del área ----------
  window.inicializarAreaDescargables = async function () {
    await cargarDescargables();
  };
});
