/**
 * portafolio-admin.js — lógica del área "Portafolio" en admin.html
 * ---------------------------------------------------------
 * Maneja las 3 subsecciones: proyectos, categorías, testimonios.
 * Mismo patrón en las 3: cargar lista, formulario que sirve tanto
 * para crear como editar (id oculto vacío = crear), botón eliminar
 * con confirmación simple.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  let categoriasCache = [];

  // ---------- Subnav de Portafolio ----------
  function inicializarSubnav() {
    const botones = document.querySelectorAll('#area-portafolio .lcars-subnav [data-sub]');
    const subs = document.querySelectorAll('#area-portafolio .sub-portafolio');
    botones.forEach((boton) => {
      boton.addEventListener('click', () => {
        subs.forEach((sub) => { sub.hidden = sub.id !== 'sub-' + boton.dataset.sub; });
        botones.forEach((b) => b.classList.toggle('activo', b === boton));
      });
    });
  }

  function previsualizarImagen(inputFile, imgPreview) {
    inputFile.addEventListener('change', () => {
      const archivo = inputFile.files[0];
      if (!archivo) { imgPreview.classList.remove('mostrar'); return; }
      const lector = new FileReader();
      lector.onload = () => {
        imgPreview.src = lector.result;
        imgPreview.classList.add('mostrar');
      };
      lector.readAsDataURL(archivo);
    });
  }

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  // ==================== PROYECTOS ====================
  const formProyecto = document.getElementById('form-proyecto');
  const listaProyectos = document.getElementById('lista-proyectos');
  const btnCancelarProyecto = document.getElementById('btn-cancelar-proyecto');
  const inputImagenProyecto = document.getElementById('proyecto-imagen');
  const previewProyecto = document.getElementById('proyecto-imagen-preview');
  let imagenActualProyecto = '';

  previsualizarImagen(inputImagenProyecto, previewProyecto);

  async function cargarSelectCategorias() {
    const select = document.getElementById('proyecto-categoria');
    select.innerHTML = categoriasCache
      .map((c) => `<option value="${c.id}">${escaparHtml(c.emoji)} ${escaparHtml(c.nombre)}</option>`)
      .join('');
  }

  function nombreCategoria(id) {
    const cat = categoriasCache.find((c) => c.id === id);
    return cat ? `${cat.emoji} ${cat.nombre}` : 'Sin categoría';
  }

  async function cargarProyectos() {
    const proyectos = await window.DB.getProyectos();
    if (!proyectos.length) {
      listaProyectos.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">📁</span>
          Todavía no hay proyectos. Agrega el primero con el formulario de arriba.
        </div>`;
      return;
    }
    listaProyectos.innerHTML = proyectos.map((p) => `
      <div class="lcars-item" data-id="${p.id}">
        <div class="lcars-item-cuerpo">
          <div class="lcars-item-titulo">${p.destacado ? '⭐ ' : ''}${escaparHtml(p.titulo)}</div>
          <div class="lcars-item-meta">${escaparHtml(nombreCategoria(p.categoriaId))}${p.urlProyecto ? ' · ' + escaparHtml(p.urlProyecto) : ''}</div>
        </div>
        <div class="lcars-item-acciones">
          <button class="lcars-btn-editar" style="background:var(--lcars-azul); color:#0a0a1a;" data-accion="editar">Editar</button>
          <button class="lcars-btn-eliminar" style="background:var(--lcars-rojo); color:#140505;" data-accion="eliminar">Eliminar</button>
        </div>
      </div>
    `).join('');

    listaProyectos.querySelectorAll('[data-accion="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.lcars-item').dataset.id;
        const p = proyectos.find((x) => x.id === id);
        abrirEdicionProyecto(p);
      });
    });
    listaProyectos.querySelectorAll('[data-accion="eliminar"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.lcars-item').dataset.id;
        if (!confirm('¿Eliminar este proyecto? No se puede deshacer.')) return;
        await window.DB.eliminarProyecto(id);
        window.mostrarToast('Proyecto eliminado');
        cargarProyectos();
      });
    });
  }

  function abrirEdicionProyecto(p) {
    document.getElementById('titulo-form-proyecto').textContent = 'Editar proyecto';
    document.getElementById('proyecto-id').value = p.id;
    document.getElementById('proyecto-titulo').value = p.titulo || '';
    document.getElementById('proyecto-categoria').value = p.categoriaId || '';
    document.getElementById('proyecto-url').value = p.urlProyecto || '';
    document.getElementById('proyecto-necesidad').value = p.necesidad || '';
    document.getElementById('proyecto-quehice').value = p.quehice || '';
    document.getElementById('proyecto-resultado').value = p.resultado || '';
    document.getElementById('proyecto-destacado').checked = !!p.destacado;
    imagenActualProyecto = p.imagenUrl || '';
    if (imagenActualProyecto) {
      previewProyecto.src = imagenActualProyecto;
      previewProyecto.classList.add('mostrar');
    } else {
      previewProyecto.classList.remove('mostrar');
    }
    btnCancelarProyecto.hidden = false;
    formProyecto.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function limpiarFormProyecto() {
    document.getElementById('titulo-form-proyecto').textContent = 'Nuevo proyecto';
    formProyecto.reset();
    document.getElementById('proyecto-id').value = '';
    previewProyecto.classList.remove('mostrar');
    imagenActualProyecto = '';
    btnCancelarProyecto.hidden = true;
  }

  btnCancelarProyecto.addEventListener('click', limpiarFormProyecto);

  formProyecto.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const id = document.getElementById('proyecto-id').value;
    const datos = {
      titulo: window.normalizarTexto(document.getElementById('proyecto-titulo').value),
      categoriaId: document.getElementById('proyecto-categoria').value,
      urlProyecto: window.normalizarTexto(document.getElementById('proyecto-url').value),
      necesidad: window.normalizarTexto(document.getElementById('proyecto-necesidad').value),
      quehice: window.normalizarTexto(document.getElementById('proyecto-quehice').value),
      resultado: window.normalizarTexto(document.getElementById('proyecto-resultado').value),
      destacado: document.getElementById('proyecto-destacado').checked,
      imagenUrl: imagenActualProyecto,
    };
    const archivo = inputImagenProyecto.files[0] || null;
    const boton = document.getElementById('btn-guardar-proyecto');
    boton.disabled = true;
    try {
      if (id) {
        await window.DB.actualizarProyecto(id, datos, archivo);
        window.mostrarToast('Proyecto actualizado');
      } else {
        await window.DB.agregarProyecto(datos, archivo);
        window.mostrarToast('Proyecto agregado');
      }
      limpiarFormProyecto();
      await cargarProyectos();
    } catch (error) {
      window.mostrarToast(error.message || 'No se pudo guardar el proyecto', 'error');
    } finally {
      boton.disabled = false;
    }
  });

  // ---------- Selector de emojis (reutilizable) ----------
  // Set curado pensado para categorías de un portafolio de desarrollo/
  // freelance. No es exhaustivo a propósito: el campo sigue siendo un
  // <input> de texto normal, así que quien necesite un emoji fuera de
  // esta lista simplemente lo escribe o lo pega a mano.
  const EMOJIS_CATEGORIA = [
    '🖥️', '💻', '🛒', '📱', '🌐', '🎨', '📷', '🎮', '🤖', '🔐',
    '📊', '📈', '🗂️', '⚙️', '🧰', '🧩', '📝', '📚', '🏢', '🏥',
    '🍽️', '🏠', '✈️', '🎓', '💼', '🔔', '📅', '💬', '🛠️', '🚀',
  ];

  function inicializarSelectorEmoji(idBoton, idPanel, idInput) {
    const boton = document.getElementById(idBoton);
    const panel = document.getElementById(idPanel);
    const input = document.getElementById(idInput);
    if (!boton || !panel || !input) return;

    if (!panel.childElementCount) {
      panel.innerHTML = EMOJIS_CATEGORIA
        .map((e) => `<button type="button" class="lcars-emoji-opcion">${e}</button>`)
        .join('');
    }

    function cerrarPanel() {
      panel.hidden = true;
      boton.setAttribute('aria-expanded', 'false');
    }

    boton.addEventListener('click', () => {
      const abrir = panel.hidden;
      panel.hidden = !abrir;
      boton.setAttribute('aria-expanded', String(abrir));
    });

    panel.querySelectorAll('.lcars-emoji-opcion').forEach((op) => {
      op.addEventListener('click', () => {
        input.value = op.textContent;
        cerrarPanel();
      });
    });

    document.addEventListener('click', (evento) => {
      if (!panel.hidden && !panel.contains(evento.target) && evento.target !== boton) {
        cerrarPanel();
      }
    });
  }

  inicializarSelectorEmoji('btn-abrir-emojis-categoria', 'panel-emojis-categoria', 'categoria-emoji');

  // ==================== CATEGORÍAS ====================
  const formCategoria = document.getElementById('form-categoria');
  const listaCategorias = document.getElementById('lista-categorias');
  const btnCancelarCategoria = document.getElementById('btn-cancelar-categoria');

  async function cargarCategorias() {
    categoriasCache = await window.DB.getCategorias();
    await cargarSelectCategorias();

    if (!categoriasCache.length) {
      listaCategorias.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">🏷️</span>
          Todavía no hay categorías. Agrega la primera arriba — los proyectos las usan para clasificarse.
        </div>`;
      return;
    }
    listaCategorias.innerHTML = categoriasCache.map((c) => `
      <div class="lcars-item" data-id="${c.id}">
        <div class="lcars-item-cuerpo">
          <div class="lcars-item-titulo">${escaparHtml(c.emoji)} ${escaparHtml(c.nombre)}</div>
        </div>
        <div class="lcars-item-acciones">
          <button style="background:var(--lcars-azul); color:#0a0a1a;" data-accion="editar">Editar</button>
          <button style="background:var(--lcars-rojo); color:#140505;" data-accion="eliminar">Eliminar</button>
        </div>
      </div>
    `).join('');

    listaCategorias.querySelectorAll('[data-accion="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.lcars-item').dataset.id;
        const c = categoriasCache.find((x) => x.id === id);
        document.getElementById('titulo-form-categoria').textContent = 'Editar categoría';
        document.getElementById('categoria-id').value = c.id;
        document.getElementById('categoria-emoji').value = c.emoji;
        document.getElementById('categoria-nombre').value = c.nombre;
        btnCancelarCategoria.hidden = false;
        formCategoria.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    listaCategorias.querySelectorAll('[data-accion="eliminar"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.lcars-item').dataset.id;
        if (!confirm('¿Eliminar esta categoría? Los proyectos que la usan quedarán sin categoría.')) return;
        await window.DB.eliminarCategoria(id);
        window.mostrarToast('Categoría eliminada');
        await cargarCategorias();
        await cargarProyectos();
      });
    });
  }

  function limpiarFormCategoria() {
    document.getElementById('titulo-form-categoria').textContent = 'Nueva categoría';
    formCategoria.reset();
    document.getElementById('categoria-id').value = '';
    btnCancelarCategoria.hidden = true;
  }
  btnCancelarCategoria.addEventListener('click', limpiarFormCategoria);

  formCategoria.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const id = document.getElementById('categoria-id').value;
    const datos = {
      emoji: window.normalizarTexto(document.getElementById('categoria-emoji').value),
      nombre: window.normalizarTexto(document.getElementById('categoria-nombre').value),
    };
    const boton = document.getElementById('btn-guardar-categoria');
    boton.disabled = true;
    try {
      if (id) {
        await window.DB.actualizarCategoria(id, datos);
        window.mostrarToast('Categoría actualizada');
      } else {
        await window.DB.agregarCategoria(datos);
        window.mostrarToast('Categoría agregada');
      }
      limpiarFormCategoria();
      await cargarCategorias();
      await cargarProyectos();
    } catch (error) {
      window.mostrarToast(error.message || 'No se pudo guardar la categoría', 'error');
    } finally {
      boton.disabled = false;
    }
  });

  // ==================== TESTIMONIOS ====================
  const formTestimonio = document.getElementById('form-testimonio');
  const listaTestimonios = document.getElementById('lista-testimonios');
  const btnCancelarTestimonio = document.getElementById('btn-cancelar-testimonio');
  const inputImagenTestimonio = document.getElementById('testimonio-imagen');
  const previewTestimonio = document.getElementById('testimonio-imagen-preview');
  let imagenActualTestimonio = '';

  previsualizarImagen(inputImagenTestimonio, previewTestimonio);

  async function cargarTestimonios() {
    const testimonios = await window.DB.getTestimonios();
    if (!testimonios.length) {
      listaTestimonios.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">💬</span>
          Todavía no hay testimonios. Agrega el primero arriba.
        </div>`;
      return;
    }
    listaTestimonios.innerHTML = testimonios.map((t) => `
      <div class="lcars-item" data-id="${t.id}">
        <div class="lcars-item-cuerpo">
          <div class="lcars-item-titulo">${escaparHtml(t.autor)}</div>
          <div class="lcars-item-meta">${escaparHtml(t.cargo || '')}</div>
        </div>
        <div class="lcars-item-acciones">
          <button style="background:var(--lcars-azul); color:#0a0a1a;" data-accion="editar">Editar</button>
          <button style="background:var(--lcars-rojo); color:#140505;" data-accion="eliminar">Eliminar</button>
        </div>
      </div>
    `).join('');

    listaTestimonios.querySelectorAll('[data-accion="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.lcars-item').dataset.id;
        const t = testimonios.find((x) => x.id === id);
        document.getElementById('titulo-form-testimonio').textContent = 'Editar testimonio';
        document.getElementById('testimonio-id').value = t.id;
        document.getElementById('testimonio-autor').value = t.autor || '';
        document.getElementById('testimonio-cargo').value = t.cargo || '';
        document.getElementById('testimonio-texto').value = t.texto || '';
        imagenActualTestimonio = t.imagenUrl || '';
        if (imagenActualTestimonio) {
          previewTestimonio.src = imagenActualTestimonio;
          previewTestimonio.classList.add('mostrar');
        } else {
          previewTestimonio.classList.remove('mostrar');
        }
        btnCancelarTestimonio.hidden = false;
        formTestimonio.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    listaTestimonios.querySelectorAll('[data-accion="eliminar"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.lcars-item').dataset.id;
        if (!confirm('¿Eliminar este testimonio?')) return;
        await window.DB.eliminarTestimonio(id);
        window.mostrarToast('Testimonio eliminado');
        cargarTestimonios();
      });
    });
  }

  function limpiarFormTestimonio() {
    document.getElementById('titulo-form-testimonio').textContent = 'Nuevo testimonio';
    formTestimonio.reset();
    document.getElementById('testimonio-id').value = '';
    previewTestimonio.classList.remove('mostrar');
    imagenActualTestimonio = '';
    btnCancelarTestimonio.hidden = true;
  }
  btnCancelarTestimonio.addEventListener('click', limpiarFormTestimonio);

  formTestimonio.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const id = document.getElementById('testimonio-id').value;
    const datos = {
      autor: window.normalizarTexto(document.getElementById('testimonio-autor').value),
      cargo: window.normalizarTexto(document.getElementById('testimonio-cargo').value),
      texto: window.normalizarTexto(document.getElementById('testimonio-texto').value),
      imagenUrl: imagenActualTestimonio,
    };
    const archivo = inputImagenTestimonio.files[0] || null;
    const boton = document.getElementById('btn-guardar-testimonio');
    boton.disabled = true;
    try {
      if (id) {
        await window.DB.actualizarTestimonio(id, datos, archivo);
        window.mostrarToast('Testimonio actualizado');
      } else {
        await window.DB.agregarTestimonio(datos, archivo);
        window.mostrarToast('Testimonio agregado');
      }
      limpiarFormTestimonio();
      await cargarTestimonios();
    } catch (error) {
      window.mostrarToast(error.message || 'No se pudo guardar el testimonio', 'error');
    } finally {
      boton.disabled = false;
    }
  });

  // ---------- Arranque del área (solo cuando hay sesión confirmada) ----------
  window.inicializarAreaPortafolio = async function () {
    inicializarSubnav();
    await cargarCategorias();
    await cargarProyectos();
    await cargarTestimonios();
  };
});
