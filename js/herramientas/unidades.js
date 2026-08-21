/**
 * herramientas/unidades.js — convertidor de unidades y medidas
 * ---------------------------------------------------------
 * Longitud, peso y volumen se convierten con un factor fijo hacia
 * una unidad base (metro, gramo, litro). Temperatura no funciona
 * por factor — necesita sus propias fórmulas — así que se resuelve
 * aparte con funciones de ida/vuelta a Celsius.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const selectCategoria = document.getElementById('un-categoria');
  const selectDesde = document.getElementById('un-unidad-desde');
  const selectHasta = document.getElementById('un-unidad-hasta');
  const inputValor = document.getElementById('un-valor');
  const salida = document.getElementById('un-salida');
  const btnIntercambiar = document.getElementById('btn-un-intercambiar');

  // Cada unidad guarda cuántas unidades base equivale a 1 unidad suya.
  const CATEGORIAS = {
    longitud: {
      unidades: {
        mm: { etiqueta: 'Milímetros (mm)', factor: 0.001 },
        cm: { etiqueta: 'Centímetros (cm)', factor: 0.01 },
        m: { etiqueta: 'Metros (m)', factor: 1 },
        km: { etiqueta: 'Kilómetros (km)', factor: 1000 },
        in: { etiqueta: 'Pulgadas (in)', factor: 0.0254 },
        ft: { etiqueta: 'Pies (ft)', factor: 0.3048 },
        yd: { etiqueta: 'Yardas (yd)', factor: 0.9144 },
        mi: { etiqueta: 'Millas (mi)', factor: 1609.344 },
      },
      predeterminada: ['m', 'ft'],
    },
    peso: {
      unidades: {
        mg: { etiqueta: 'Miligramos (mg)', factor: 0.001 },
        g: { etiqueta: 'Gramos (g)', factor: 1 },
        kg: { etiqueta: 'Kilogramos (kg)', factor: 1000 },
        lb: { etiqueta: 'Libras (lb)', factor: 453.592 },
        oz: { etiqueta: 'Onzas (oz)', factor: 28.3495 },
      },
      predeterminada: ['kg', 'lb'],
    },
    volumen: {
      unidades: {
        ml: { etiqueta: 'Mililitros (ml)', factor: 0.001 },
        l: { etiqueta: 'Litros (l)', factor: 1 },
        cup: { etiqueta: 'Tazas (cup)', factor: 0.24 },
        galon: { etiqueta: 'Galones (gal)', factor: 3.78541 },
        flOz: { etiqueta: 'Onzas líquidas (fl oz)', factor: 0.0295735 },
      },
      predeterminada: ['l', 'galon'],
    },
    temperatura: {
      // Temperatura no tiene factor: cada unidad define cómo ir a
      // Celsius y cómo volver desde Celsius.
      unidades: {
        c: { etiqueta: 'Celsius (°C)', aBase: (v) => v, deBase: (v) => v },
        f: { etiqueta: 'Fahrenheit (°F)', aBase: (v) => (v - 32) * (5 / 9), deBase: (v) => v * (9 / 5) + 32 },
        k: { etiqueta: 'Kelvin (K)', aBase: (v) => v - 273.15, deBase: (v) => v + 273.15 },
      },
      predeterminada: ['c', 'f'],
    },
  };

  function poblarUnidades() {
    const categoria = CATEGORIAS[selectCategoria.value];
    const opciones = Object.entries(categoria.unidades)
      .map(([clave, datos]) => `<option value="${clave}">${datos.etiqueta}</option>`)
      .join('');
    selectDesde.innerHTML = opciones;
    selectHasta.innerHTML = opciones;
    selectDesde.value = categoria.predeterminada[0];
    selectHasta.value = categoria.predeterminada[1];
  }

  function convertir() {
    const categoria = CATEGORIAS[selectCategoria.value];
    const valor = parseFloat(inputValor.value);

    if (Number.isNaN(valor)) {
      salida.textContent = '—';
      return;
    }

    const unidadDesde = categoria.unidades[selectDesde.value];
    const unidadHasta = categoria.unidades[selectHasta.value];
    let resultado;

    if (selectCategoria.value === 'temperatura') {
      resultado = unidadHasta.deBase(unidadDesde.aBase(valor));
    } else {
      const enBase = valor * unidadDesde.factor;
      resultado = enBase / unidadHasta.factor;
    }

    // Redondea a un máximo de 4 decimales, sin ceros de sobra.
    salida.textContent = Number(resultado.toFixed(4)).toString();
  }

  selectCategoria.addEventListener('change', () => {
    poblarUnidades();
    convertir();
  });
  selectDesde.addEventListener('change', convertir);
  selectHasta.addEventListener('change', convertir);
  inputValor.addEventListener('input', convertir);

  btnIntercambiar.addEventListener('click', () => {
    const desdeActual = selectDesde.value;
    selectDesde.value = selectHasta.value;
    selectHasta.value = desdeActual;
    convertir();
  });

  poblarUnidades();
  convertir();
});
