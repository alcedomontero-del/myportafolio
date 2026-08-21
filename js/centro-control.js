/**
 * centro-control.js — lógica del área "Centro de Control" en admin.html
 * ---------------------------------------------------------
 * 6 tarjetas de diagnóstico (verde/ámbar/rojo) que revisan piezas de
 * la configuración real del sitio. Cada tarjeta ámbar/roja se puede
 * tocar para desplegar el paso corto de cómo resolverla (resumen
 * sacado de CONFIGURACION.md). No hay CRUD aquí — todo se calcula a
 * partir de config.js, window.ES_LOCAL, getConfig() y getCanales().
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const grid = document.getElementById('grid-diagnostico');
  if (!grid) return; // por si esta página no tiene el área (no debería pasar)

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  // ---------- Helpers para armar el resultado de cada tarjeta ----------
  function verde(detalle) {
    return { estado: 'verde', detalle, paso: '' };
  }
  function ambar(detalle, paso) {
    return { estado: 'ambar', detalle, paso };
  }
  function rojo(detalle, paso) {
    return { estado: 'rojo', detalle, paso };
  }

  // ---------- Evaluación de cada tarjeta ----------
  function evaluarFirebase() {
    const cfg = window.FIREBASE_CONFIG || {};
    const rellenado =
      cfg.apiKey && cfg.apiKey !== 'TU_API_KEY' &&
      cfg.projectId && cfg.projectId !== 'TU_PROYECTO';
    if (!rellenado) {
      return ambar(
        'Todavía tiene los valores de plantilla en config.js.',
        'Crea el proyecto en console.firebase.google.com, activa Firestore y Authentication (correo/contraseña), y copia el objeto firebaseConfig a js/config.js → FIREBASE_CONFIG. Luego publica firestore.rules (ver CONFIGURACION.md, sección 1).'
      );
    }
    if (window.ES_LOCAL) {
      return ambar(
        'Credenciales puestas, pero el sitio corre en modo local — publica el sitio para probar la conexión real.',
        'Sube el proyecto a GitHub y conéctalo en Netlify (ver CONFIGURACION.md, sección 3). Una vez publicado, este panel usará Firebase real en vez del modo de demostración.'
      );
    }
    // Si llegamos hasta acá autenticados y sin ES_LOCAL, el login ya
    // probó que la conexión con Firebase responde.
    return verde('Credenciales configuradas y la conexión respondió correctamente (la sesión activa lo confirma).');
  }

  function evaluarCloudinary() {
    const cfg = window.CLOUDINARY_CONFIG || {};
    const rellenado =
      cfg.cloudName && cfg.cloudName !== 'TU_CLOUD_NAME' &&
      cfg.uploadPreset && cfg.uploadPreset !== 'TU_UPLOAD_PRESET';
    if (!rellenado) {
      return ambar(
        'Todavía tiene los valores de plantilla en config.js.',
        'Crea una cuenta en cloudinary.com, copia el Cloud Name del Dashboard y crea un Upload preset en modo Unsigned (Settings → Upload → Upload presets). Pega ambos en js/config.js → CLOUDINARY_CONFIG. Si subes PDF/ZIP, activa además "Allow delivery of PDF and ZIP files" en Settings → Security (ver CONFIGURACION.md, sección 2).'
      );
    }
    return verde('Cloud Name y Upload Preset configurados en config.js.');
  }

  function evaluarAutenticacion(usuario) {
    const esDemo = window.ES_LOCAL || (usuario && usuario.email === 'admin@demo.com');
    if (esDemo) {
      return ambar(
        'La sesión activa es la cuenta de demostración (admin@demo.com).',
        'En Firebase → Authentication → Users → Add user, crea tu correo real y usa esa cuenta para iniciar sesión — no admin@demo.com (ver CONFIGURACION.md, sección 1, paso 4).'
      );
    }
    return verde('Sesión iniciada con un usuario real: ' + escaparHtml(usuario ? usuario.email : ''));
  }

  function evaluarPaypal(config) {
    const link = (config.paypalLink || '').trim();
    if (!link) {
      return ambar(
        'Todavía no hay un link de PayPal — el botón de donación no aparece en el sitio público.',
        'Ve al área "Canales y contacto" → campo PayPal → pega tu link paypal.me/tuusuario y guarda (ver CONFIGURACION.md, sección 6).'
      );
    }
    return verde('Link configurado: ' + escaparHtml(link));
  }

  function evaluarModo() {
    if (window.ES_LOCAL) {
      return ambar(
        'Local — modo demostración, nada de esto está publicado todavía.',
        'Sube el proyecto a GitHub y conéctalo en Netlify para publicarlo (ver CONFIGURACION.md, sección 3).'
      );
    }
    return verde('En línea — conectado a Firebase y Cloudinary reales.');
  }

  function evaluarPlataformas(canales) {
    if (!canales.length) {
      return ambar(
        'No hay ninguna plataforma agregada todavía.',
        'Ve al área "Canales y contacto" y agrega al menos una plataforma (Fiverr, Workana, etc.) con su link y parámetro ?de=.'
      );
    }
    const nombres = canales.map((c) => c.nombre).join(', ');
    return verde(canales.length + ' plataforma(s) agregada(s): ' + escaparHtml(nombres));
  }

  // ---------- Armado de la grilla ----------
  const TARJETAS = [
    { id: 'firebase', emoji: '🔥', titulo: 'Firebase', evaluar: (ctx) => evaluarFirebase() },
    { id: 'cloudinary', emoji: '☁️', titulo: 'Cloudinary', evaluar: (ctx) => evaluarCloudinary() },
    { id: 'autenticacion', emoji: '🔐', titulo: 'Autenticación', evaluar: (ctx) => evaluarAutenticacion(ctx.usuario) },
    { id: 'paypal', emoji: '💳', titulo: 'PayPal', evaluar: (ctx) => evaluarPaypal(ctx.config) },
    { id: 'modo', emoji: '🌐', titulo: 'Modo actual', evaluar: (ctx) => evaluarModo() },
    { id: 'plataformas', emoji: '📡', titulo: 'Plataformas', evaluar: (ctx) => evaluarPlataformas(ctx.canales) },
  ];

  function renderTarjeta(tarjeta, resultado) {
    const tienePaso = resultado.estado !== 'verde' && resultado.paso;
    return `
      <button
        class="lcars-tarjeta-diag ${resultado.estado}"
        type="button"
        data-id="${tarjeta.id}"
        aria-expanded="false"
        ${tienePaso ? '' : 'style="cursor:default;"'}
      >
        <div class="titulo"><span class="estado-punto"></span>${tarjeta.emoji} ${escaparHtml(tarjeta.titulo)}</div>
        <p class="detalle">${resultado.detalle}</p>
        ${tienePaso ? `<div class="paso-resolver">${resultado.paso}</div>` : ''}
      </button>
    `;
  }

  async function cargarDiagnostico() {
    grid.innerHTML = '<div class="lcars-estado-vacio"><span class="emoji">🎛️</span>Revisando configuración…</div>';

    let config, canales;
    try {
      [config, canales] = await Promise.all([
        window.DB.getConfig(),
        window.DB.getCanales(),
      ]);
    } catch (error) {
      // Antes esto se quedaba congelado en "Revisando configuración…"
      // para siempre sin avisar nada (promesa rechazada sin atrapar).
      // Ahora se muestra el error real para poder diagnosticarlo.
      console.error('Centro de Control — falló la lectura de Firestore:', error);
      grid.innerHTML = `
        <div class="lcars-estado-vacio">
          <span class="emoji">⚠️</span>
          No se pudo leer la configuración (${escaparHtml(error.code || error.message || 'error desconocido')}).
          Revisa que firestore.rules esté publicado en la consola de Firebase.
        </div>`;
      return;
    }

    const usuario = window.DB.getCurrentUser();
    const ctx = { config, canales, usuario };

    grid.innerHTML = TARJETAS.map((tarjeta) => renderTarjeta(tarjeta, tarjeta.evaluar(ctx))).join('');

    // Tocar una tarjeta ámbar/roja despliega su paso de resolución.
    grid.querySelectorAll('.lcars-tarjeta-diag').forEach((boton) => {
      boton.addEventListener('click', () => {
        if (!boton.querySelector('.paso-resolver')) return; // verde: nada que desplegar
        const abierta = boton.getAttribute('aria-expanded') === 'true';
        boton.setAttribute('aria-expanded', abierta ? 'false' : 'true');
      });
    });
  }

  window.inicializarAreaControl = cargarDiagnostico;
});
