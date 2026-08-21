/**
 * canales-publico.js — lógica de contacto en index.html
 * ---------------------------------------------------------
 * - Si la URL trae ?de=fiverr (o el parámetro que sea), muestra
 *   SOLO el botón de esa plataforma, destacado.
 * - Si no trae parámetro (o no coincide con ninguna plataforma
 *   registrada), muestra todas las plataformas para que el
 *   visitante elija.
 * - Aplica la configuración general: mostrar/ocultar el punto de
 *   estado, y el ícono de PayPal en el pie de página.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  cargarContacto();

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  async function cargarContacto() {
    const contenedor = document.getElementById('contenedor-contacto');
    const subtitulo = document.getElementById('contacto-sub');
    try {
      const canales = await window.DB.getCanales();

      if (!canales.length) {
        contenedor.innerHTML = `
          <div class="pub-estado-vacio">
            <span class="emoji">🔗</span>
            Todavía no hay canales de contacto configurados.
          </div>`;
        return;
      }

      const parametroUrl = new URLSearchParams(window.location.search).get('de');
      const canalDeOrigen = parametroUrl
        ? canales.find((c) => c.parametro === parametroUrl.toLowerCase())
        : null;

      if (canalDeOrigen) {
        subtitulo.textContent = `Veo que llegaste desde ${canalDeOrigen.nombre} — este es el camino más directo:`;
        contenedor.innerHTML = `
          <div class="pub-canal-destacado">
            <p>También puedes escribirme por cualquier otra plataforma si lo prefieres.</p>
            <a class="pub-canal-cta" href="${canalDeOrigen.urlPerfil}" target="_blank" rel="noopener">
              ${escaparHtml(canalDeOrigen.textoBoton)} →
            </a>
          </div>`;
        return;
      }

      subtitulo.textContent = 'Escríbeme por la plataforma que prefieras.';
      contenedor.innerHTML = `<div class="pub-grid-canales">${canales.map((c) => `
        <a class="pub-canal-cta" href="${c.urlPerfil}" target="_blank" rel="noopener">
          ${escaparHtml(c.textoBoton)} →
        </a>
      `).join('')}</div>`;
    } catch (error) {
      contenedor.innerHTML = `
        <div class="pub-estado-vacio">
          <span class="emoji">⚠️</span>
          No se pudieron cargar los canales de contacto.
        </div>`;
    }
  }
});
