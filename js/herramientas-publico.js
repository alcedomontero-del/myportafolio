/**
 * herramientas-publico.js — lógica de herramientas.html
 * ---------------------------------------------------------
 * Lee el catálogo de herramientas y pinta solo las que el admin
 * marcó como activas, en el orden que definió. Cada tarjeta enlaza
 * a su propia página dentro de /herramientas/{slug}.html.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  cargarHerramientas();

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  async function cargarHerramientas() {
    const contenedor = document.getElementById('contenedor-herramientas');
    try {
      const todas = await window.DB.getHerramientas();
      const activas = todas.filter((h) => h.activa);

      if (!activas.length) {
        contenedor.innerHTML = `
          <div class="pub-estado-vacio">
            <span class="emoji">🧰</span>
            No hay herramientas disponibles por el momento.
          </div>`;
        return;
      }

      contenedor.innerHTML = `<div class="pub-grid-herramientas">${activas.map((h) => `
        <a class="pub-tarjeta-herramienta" href="herramientas/${escaparHtml(h.slug)}.html">
          <span class="emoji">${escaparHtml(h.emoji)}</span>
          <h4>${escaparHtml(h.nombre)}</h4>
        </a>
      `).join('')}</div>`;
    } catch (error) {
      contenedor.innerHTML = `
        <div class="pub-estado-vacio">
          <span class="emoji">⚠️</span>
          No se pudieron cargar las herramientas.
        </div>`;
    }
  }
});
