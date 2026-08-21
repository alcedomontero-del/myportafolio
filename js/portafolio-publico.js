/**
 * portafolio-publico.js — lógica de index.html
 * ---------------------------------------------------------
 * Lee proyectos, categorías y testimonios (solo lectura — esta
 * página nunca escribe en la base de datos) y los pinta en la
 * cara pública. Maneja sus propios estados de carga y vacío.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  cargarProyectos();
  cargarTestimonios();

  function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  async function cargarProyectos() {
    const contenedor = document.getElementById('contenedor-proyectos');
    try {
      const [proyectos, categorias] = await Promise.all([
        window.DB.getProyectos(),
        window.DB.getCategorias(),
      ]);

      if (!proyectos.length) {
        contenedor.innerHTML = `
          <div class="pub-estado-vacio">
            <span class="emoji">🛠️</span>
            Todavía no hay proyectos publicados. Vuelve pronto.
          </div>`;
        return;
      }

      function categoriaDe(id) {
        const cat = categorias.find((c) => c.id === id);
        return cat ? `${cat.emoji} ${cat.nombre}` : null;
      }

      // Los destacados van primero, el resto en orden de llegada
      const ordenados = [...proyectos].sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0));

      contenedor.innerHTML = `<div class="pub-grid-proyectos">${ordenados.map((p) => `
        <article class="pub-tarjeta">
          ${p.imagenUrl
            ? `<img class="pub-tarjeta-img" src="${p.imagenUrl}" alt="Captura de ${escaparHtml(p.titulo)}" loading="lazy" />`
            : `<div class="pub-tarjeta-img" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">🖼️</div>`
          }
          <div class="pub-tarjeta-cuerpo">
            ${categoriaDe(p.categoriaId) ? `<span class="pub-etiqueta-categoria">${escaparHtml(categoriaDe(p.categoriaId))}</span>` : ''}
            <h3>${escaparHtml(p.titulo)}</h3>
            <div class="pub-caso-estudio">
              <p><strong>Necesidad</strong> ${escaparHtml(p.necesidad)}</p>
              <p><strong>Qué hice</strong> ${escaparHtml(p.quehice)}</p>
              <p><strong>Resultado</strong> ${escaparHtml(p.resultado)}</p>
            </div>
            ${p.urlProyecto ? `<a class="pub-tarjeta-link" href="${p.urlProyecto}" target="_blank" rel="noopener">Ver proyecto en vivo →</a>` : ''}
          </div>
        </article>
      `).join('')}</div>`;
    } catch (error) {
      contenedor.innerHTML = `
        <div class="pub-estado-vacio">
          <span class="emoji">⚠️</span>
          No se pudieron cargar los proyectos. Intenta recargar la página.
        </div>`;
    }
  }

  async function cargarTestimonios() {
    const contenedor = document.getElementById('contenedor-testimonios');
    try {
      const testimonios = await window.DB.getTestimonios();

      if (!testimonios.length) {
        contenedor.innerHTML = `
          <div class="pub-estado-vacio">
            <span class="emoji">💬</span>
            Todavía no hay testimonios publicados.
          </div>`;
        return;
      }

      contenedor.innerHTML = `<div class="pub-grid-testimonios">${testimonios.map((t) => `
        <div class="pub-testimonio">
          <p>“${escaparHtml(t.texto)}”</p>
          <div class="pub-testimonio-autor">${escaparHtml(t.autor)}${t.cargo ? ' · ' + escaparHtml(t.cargo) : ''}</div>
        </div>
      `).join('')}</div>`;
    } catch (error) {
      contenedor.innerHTML = `
        <div class="pub-estado-vacio">
          <span class="emoji">⚠️</span>
          No se pudieron cargar los testimonios.
        </div>`;
    }
  }
});
