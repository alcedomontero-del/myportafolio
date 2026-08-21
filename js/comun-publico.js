/**
 * comun-publico.js — lo que TODA página pública necesita
 * (index.html, herramientas.html, descargables.html, y cada página
 * individual dentro de herramientas/).
 * ---------------------------------------------------------
 * - Año actual en el pie de página.
 * - Badge de modo (local/en línea).
 * - Punto de estado: color según env.js (local=ámbar, real=verde) y
 *   visibilidad según la configuración guardada por el admin.
 * - Ícono de PayPal en el pie, si el admin configuró un link.
 * - Aviso de cookies + Google Analytics (Fase 9, ver LECCIONES.md
 *   caso #19 y RESUMEN-PORTAFOLIO.md "Extras aprobados" punto 3).
 *
 * Cada página solo necesita tener (los que use) estos IDs en su HTML:
 * #anio-actual, #badge-modo, #punto-estado + #info-punto, #link-paypal
 * El aviso de cookies se inyecta solo, no necesita ningún ID en el HTML.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const CLAVE_PREFERENCIA = 'pref-cookies'; // 'aceptado' | 'rechazado'

  const anio = document.getElementById('anio-actual');
  if (anio) anio.textContent = new Date().getFullYear();

  if (document.getElementById('badge-modo')) {
    window.pintarBadgeModo('badge-modo');
  }

  pintarPuntoEstado();
  aplicarConfiguracionGeneral();
  inicializarAvisoCookies();

  function pintarPuntoEstado() {
    const punto = document.getElementById('punto-estado');
    const info = document.getElementById('info-punto');
    if (!punto) return;
    if (window.ES_LOCAL) {
      punto.classList.add('local');
      if (info) info.textContent = 'Vista previa local — este sitio aún no está publicado';
    } else {
      punto.classList.add('en-linea');
      if (info) info.textContent = 'Sitio publicado y funcionando';
    }
  }

  async function aplicarConfiguracionGeneral() {
    try {
      const config = await window.DB.getConfig();

      const punto = document.getElementById('punto-estado');
      if (punto && config.mostrarPuntoEstado === false) {
        punto.style.display = 'none';
      }

      const linkPaypal = document.getElementById('link-paypal');
      if (linkPaypal && config.paypalLink) {
        linkPaypal.href = config.paypalLink;
        linkPaypal.hidden = false;
      }
    } catch (error) {
      // Si falla, la página sigue funcionando con los valores por
      // defecto (punto de estado visible, sin PayPal).
    }
  }

  // ---------- Aviso de cookies + Google Analytics ----------
  function inicializarAvisoCookies() {
    const preferencia = localStorage.getItem(CLAVE_PREFERENCIA);

    if (preferencia === 'aceptado') {
      cargarGoogleAnalytics();
      return; // ya decidió antes, no se vuelve a mostrar el aviso
    }
    if (preferencia === 'rechazado') {
      return; // decidió no aceptar, no se vuelve a preguntar
    }

    mostrarAvisoCookies();
  }

  function mostrarAvisoCookies() {
    const aviso = document.createElement('div');
    aviso.className = 'pub-aviso-cookies';
    aviso.setAttribute('role', 'region');
    aviso.setAttribute('aria-label', 'Aviso de cookies');
    aviso.innerHTML = `
      <p>Este sitio usa Google Analytics para entender cuántas
      visitas recibe — nada de tus archivos ni tu actividad en las
      herramientas se envía a ningún lado. ¿Aceptas?</p>
      <div class="pub-aviso-cookies-botones">
        <button type="button" class="pub-btn pub-btn-secundario pub-btn-chico" data-cookies="rechazar">Rechazar</button>
        <button type="button" class="pub-btn pub-btn-primario pub-btn-chico" data-cookies="aceptar">Aceptar</button>
      </div>
    `;
    document.body.appendChild(aviso);

    aviso.querySelector('[data-cookies="aceptar"]').addEventListener('click', () => {
      localStorage.setItem(CLAVE_PREFERENCIA, 'aceptado');
      aviso.remove();
      cargarGoogleAnalytics();
    });
    aviso.querySelector('[data-cookies="rechazar"]').addEventListener('click', () => {
      localStorage.setItem(CLAVE_PREFERENCIA, 'rechazado');
      aviso.remove();
    });
  }

  function cargarGoogleAnalytics() {
    const id = window.GA_MEASUREMENT_ID;
    // Nunca en modo local (demo) y nunca con el valor de plantilla sin
    // completar — mismo criterio que usa Centro de Control para
    // Firebase/Cloudinary (ver js/centro-control.js).
    if (window.ES_LOCAL || !id || id === 'TU_ID_DE_GOOGLE_ANALYTICS') return;
    if (document.getElementById('gtag-analytics')) return; // ya cargado

    const script = document.createElement('script');
    script.id = 'gtag-analytics';
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id);
  }
});
