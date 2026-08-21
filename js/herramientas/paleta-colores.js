/**
 * herramientas/paleta-colores.js — generador de paletas de colores
 * ---------------------------------------------------------
 * Todo el cálculo de color pasa por HSL (más fácil generar armonías
 * que directo en hex/RGB) y se convierte de vuelta a hex solo para
 * pintar y mostrar el código. Sin librerías externas.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const form = document.getElementById('form-paleta');
  const inputColorBase = document.getElementById('paleta-color-base');
  const selectModo = document.getElementById('paleta-modo');
  const grid = document.getElementById('grid-paleta');
  const btnAzar = document.getElementById('btn-paleta-azar');

  function hexAHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const maximo = Math.max(r, g, b);
    const minimo = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (maximo + minimo) / 2;

    if (maximo !== minimo) {
      const delta = maximo - minimo;
      s = l > 0.5 ? delta / (2 - maximo - minimo) : delta / (maximo + minimo);
      switch (maximo) {
        case r: h = (g - b) / delta + (g < b ? 6 : 0); break;
        case g: h = (b - r) / delta + 2; break;
        default: h = (r - g) / delta + 4;
      }
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function hslAHex(h, s, l) {
    h = ((h % 360) + 360) % 360; // normaliza a 0-359
    s = Math.min(100, Math.max(0, s)) / 100;
    l = Math.min(100, Math.max(0, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;

    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }

    const aHex = (valor) => {
      const entero = Math.round((valor + m) * 255);
      return entero.toString(16).padStart(2, '0');
    };
    return `#${aHex(r)}${aHex(g)}${aHex(b)}`;
  }

  function limitar(valor, minimo, maximo) {
    return Math.min(maximo, Math.max(minimo, valor));
  }

  const GENERADORES = {
    analoga(h, s, l) {
      return [-40, -20, 0, 20, 40].map((offset) => hslAHex(h + offset, s, l));
    },
    complementaria(h, s, l) {
      return [
        hslAHex(h, s, limitar(l - 20, 10, 90)),
        hslAHex(h, s, l),
        hslAHex(h, s, limitar(l + 20, 10, 90)),
        hslAHex(h + 180, s, l),
        hslAHex(h + 180, s, limitar(l + 20, 10, 90)),
      ];
    },
    triada(h, s, l) {
      return [
        hslAHex(h, s, l),
        hslAHex(h + 120, s, l),
        hslAHex(h + 240, s, l),
        hslAHex(h, s, limitar(l - 20, 10, 90)),
        hslAHex(h, s, limitar(l + 20, 10, 90)),
      ];
    },
    monocromatica(h, s) {
      return [20, 35, 50, 65, 80].map((l) => hslAHex(h, s, l));
    },
  };

  function generarPaleta() {
    const hex = inputColorBase.value;
    const modo = selectModo.value;
    const { h, s, l } = hexAHsl(hex);
    const generador = GENERADORES[modo] || GENERADORES.analoga;
    const colores = generador(h, s === 0 ? 45 : s, l === 0 || l === 100 ? 50 : l);
    pintarPaleta(colores);
  }

  function pintarPaleta(colores) {
    grid.innerHTML = colores.map((color) => `
      <button type="button" class="pub-swatch" data-color="${color}" title="Copiar ${color}">
        <span class="muestra" style="background:${color};"></span>
        <span class="codigo">${color.toUpperCase()}</span>
      </button>
    `).join('');
  }

  grid.addEventListener('click', async (evento) => {
    const boton = evento.target.closest('.pub-swatch');
    if (!boton) return;
    const color = boton.dataset.color;
    try {
      await navigator.clipboard.writeText(color);
      window.mostrarToast(`${color.toUpperCase()} copiado`);
    } catch (error) {
      window.mostrarToast('No se pudo copiar automáticamente', 'error');
    }
  });

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    generarPaleta();
  });

  btnAzar.addEventListener('click', () => {
    const hAzar = Math.floor(Math.random() * 360);
    const sAzar = 55 + Math.floor(Math.random() * 30); // 55-84%
    const lAzar = 45 + Math.floor(Math.random() * 20); // 45-64%
    inputColorBase.value = hslAHex(hAzar, sAzar, lAzar);

    const modos = Object.keys(GENERADORES);
    selectModo.value = modos[Math.floor(Math.random() * modos.length)];

    generarPaleta();
  });

  // Paleta inicial visible al cargar la página, con el color de
  // muestra que ya trae el input.
  generarPaleta();
});
