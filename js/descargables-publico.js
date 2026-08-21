/**
 * descargables-publico.js — lógica de descargables.html
 * ---------------------------------------------------------
 * Lee la colección "descargables". El (o los) archivo(s) marcados
 * con esCV=true se muestran aparte, como descarga destacada; el
 * resto se pinta como una grilla de apps propias descargables.
 * Los archivos sin archivoUrl (aún sin subir desde el admin) no se
 * muestran en público — evita botones de descarga rotos.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  cargarDescargables();

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  async function cargarDescargables() {
    const contenedor = document.getElementById('contenedor-descargables');
    try {
      const todos = await window.DB.getDescargables();
      const disponibles = todos.filter((d) => d.archivoUrl);
      const cv = disponibles.filter((d) => d.esCV);
      const apps = disponibles.filter((d) => !d.esCV);

      if (!disponibles.length) {
        contenedor.innerHTML = `
          <div class="pub-estado-vacio">
            <span class="emoji">📦</span>
            No hay archivos disponibles por el momento.
          </div>`;
        return;
      }

      const htmlCv = cv.map((d) => `
        <div class="pub-cv-destacado">
          <div class="pub-cv-destacado-texto">
            <h3>${escaparHtml(d.nombre)}</h3>
            <p>${escaparHtml(d.descripcion)}</p>
          </div>
          <a class="pub-btn pub-btn-primario" href="${escaparHtml(d.archivoUrl)}" download target="_blank" rel="noopener">Descargar CV</a>
        </div>
      `).join('');

      const htmlApps = apps.length ? `
        <div class="pub-grid-descargables">${apps.map((d) => `
          <div class="pub-tarjeta-descargable">
            <h4>${escaparHtml(d.nombre)}</h4>
            <p>${escaparHtml(d.descripcion)}</p>
            <a class="pub-tarjeta-link" href="${escaparHtml(d.archivoUrl)}" download target="_blank" rel="noopener">Descargar →</a>
          </div>
        `).join('')}</div>
      ` : '';

      contenedor.innerHTML = htmlCv + htmlApps;
    } catch (error) {
      contenedor.innerHTML = `
        <div class="pub-estado-vacio">
          <span class="emoji">⚠️</span>
          No se pudieron cargar los archivos.
        </div>`;
    }
  }
});
