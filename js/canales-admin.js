/**
 * canales-admin.js — lógica del área "Canales y contacto" en admin.html
 * ---------------------------------------------------------
 * Dos bloques independientes: la lista de plataformas (canales) y
 * la configuración general del sitio (PayPal + punto de estado),
 * que vive en un documento único (getConfig/actualizarConfig).
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  // ==================== CANALES ====================
  const formCanal = document.getElementById('form-canal');
  const listaCanales = document.getElementById('lista-canales');
  const btnCancelarCanal = document.getElementById('btn-cancelar-canal');

  async function cargarCanales() {
    const canales = await window.DB.getCanales();
    if (!canales.length) {
      listaCanales.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">🔗</span>
          Todavía no hay plataformas. Agrega la primera arriba.
        </div>`;
      return;
    }
    listaCanales.innerHTML = canales.map((c) => `
      <div class="lcars-item" data-id="${c.id}">
        <div class="lcars-item-cuerpo">
          <div class="lcars-item-titulo">${escaparHtml(c.nombre)}</div>
          <div class="lcars-item-meta">?de=${escaparHtml(c.parametro)} · ${escaparHtml(c.urlPerfil)}</div>
        </div>
        <div class="lcars-item-acciones">
          <button style="background:var(--lcars-azul); color:#0a0a1a;" data-accion="editar">Editar</button>
          <button style="background:var(--lcars-rojo); color:#140505;" data-accion="eliminar">Eliminar</button>
        </div>
      </div>
    `).join('');

    listaCanales.querySelectorAll('[data-accion="editar"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.lcars-item').dataset.id;
        const c = canales.find((x) => x.id === id);
        document.getElementById('titulo-form-canal').textContent = 'Editar plataforma';
        document.getElementById('canal-id').value = c.id;
        document.getElementById('canal-nombre').value = c.nombre || '';
        document.getElementById('canal-parametro').value = c.parametro || '';
        document.getElementById('canal-url').value = c.urlPerfil || '';
        document.getElementById('canal-texto-boton').value = c.textoBoton || '';
        btnCancelarCanal.hidden = false;
        formCanal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    listaCanales.querySelectorAll('[data-accion="eliminar"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.closest('.lcars-item').dataset.id;
        if (!confirm('¿Eliminar esta plataforma?')) return;
        await window.DB.eliminarCanal(id);
        window.mostrarToast('Plataforma eliminada');
        cargarCanales();
      });
    });
  }

  function limpiarFormCanal() {
    document.getElementById('titulo-form-canal').textContent = 'Nueva plataforma';
    formCanal.reset();
    document.getElementById('canal-id').value = '';
    btnCancelarCanal.hidden = true;
  }
  btnCancelarCanal.addEventListener('click', limpiarFormCanal);

  formCanal.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const id = document.getElementById('canal-id').value;
    const datos = {
      nombre: window.normalizarTexto(document.getElementById('canal-nombre').value),
      parametro: window.normalizarTexto(document.getElementById('canal-parametro').value).toLowerCase(),
      urlPerfil: window.normalizarTexto(document.getElementById('canal-url').value),
      textoBoton: window.normalizarTexto(document.getElementById('canal-texto-boton').value),
    };
    const boton = document.getElementById('btn-guardar-canal');
    boton.disabled = true;
    try {
      if (id) {
        await window.DB.actualizarCanal(id, datos);
        window.mostrarToast('Plataforma actualizada');
      } else {
        await window.DB.agregarCanal(datos);
        window.mostrarToast('Plataforma agregada');
      }
      limpiarFormCanal();
      await cargarCanales();
    } catch (error) {
      window.mostrarToast(error.message || 'No se pudo guardar la plataforma', 'error');
    } finally {
      boton.disabled = false;
    }
  });

  // ==================== CONFIGURACIÓN GENERAL ====================
  const formConfig = document.getElementById('form-config-canales');

  async function cargarConfig() {
    const config = await window.DB.getConfig();
    document.getElementById('config-paypal').value = config.paypalLink || '';
    document.getElementById('config-punto-estado').checked = config.mostrarPuntoEstado !== false;
  }

  formConfig.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const datos = {
      paypalLink: window.normalizarTexto(document.getElementById('config-paypal').value),
      mostrarPuntoEstado: document.getElementById('config-punto-estado').checked,
    };
    const boton = document.getElementById('btn-guardar-config-canales');
    boton.disabled = true;
    try {
      await window.DB.actualizarConfig(datos);
      window.mostrarToast('Configuración guardada');
    } catch (error) {
      window.mostrarToast(error.message || 'No se pudo guardar la configuración', 'error');
    } finally {
      boton.disabled = false;
    }
  });

  // ---------- Arranque del área ----------
  window.inicializarAreaCanales = async function () {
    await cargarCanales();
    await cargarConfig();
  };
});
