/**
 * herramientas/contrasenas.js — generador de contraseñas seguras
 * ---------------------------------------------------------
 * Usa crypto.getRandomValues (generador aleatorio criptográfico del
 * navegador), no Math.random() — Math.random() no es seguro para
 * contraseñas porque su secuencia se puede predecir.
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  const form = document.getElementById('form-contrasena');
  const inputLongitud = document.getElementById('pw-longitud');
  const valorLongitud = document.getElementById('pw-longitud-valor');
  const resultado = document.getElementById('resultado-pw');
  const salida = document.getElementById('pw-salida');
  const fortaleza = document.getElementById('pw-fortaleza');
  const btnCopiar = document.getElementById('btn-copiar-pw');

  const CONJUNTOS = {
    mayusculas: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // sin I/O para evitar confusión visual
    minusculas: 'abcdefghijkmnpqrstuvwxyz',
    numeros: '23456789',
    simbolos: '!@#$%^&*()-_=+[]{}',
  };

  inputLongitud.addEventListener('input', () => {
    valorLongitud.textContent = inputLongitud.value;
  });

  function generarContrasena(longitud, conjunto) {
    const valores = new Uint32Array(longitud);
    crypto.getRandomValues(valores);
    let resultado = '';
    for (let i = 0; i < longitud; i++) {
      resultado += conjunto[valores[i] % conjunto.length];
    }
    return resultado;
  }

  function calcularFortaleza(longitud, tamanoConjunto) {
    const bitsEntropia = longitud * Math.log2(tamanoConjunto);
    if (bitsEntropia < 40) return { texto: 'Débil — prueba con más caracteres', color: 'var(--pub-ambar)' };
    if (bitsEntropia < 70) return { texto: 'Aceptable', color: 'var(--pub-ambar)' };
    if (bitsEntropia < 100) return { texto: 'Fuerte', color: 'var(--pub-verde)' };
    return { texto: 'Muy fuerte', color: 'var(--pub-verde)' };
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const longitud = parseInt(inputLongitud.value, 10);
    let conjunto = '';
    if (document.getElementById('pw-mayusculas').checked) conjunto += CONJUNTOS.mayusculas;
    if (document.getElementById('pw-minusculas').checked) conjunto += CONJUNTOS.minusculas;
    if (document.getElementById('pw-numeros').checked) conjunto += CONJUNTOS.numeros;
    if (document.getElementById('pw-simbolos').checked) conjunto += CONJUNTOS.simbolos;

    if (!conjunto) {
      window.mostrarToast('Selecciona al menos un tipo de carácter', 'error');
      return;
    }

    salida.value = generarContrasena(longitud, conjunto);
    const nivel = calcularFortaleza(longitud, conjunto.length);
    fortaleza.textContent = 'Fortaleza estimada: ' + nivel.texto;
    fortaleza.style.color = nivel.color;
    resultado.classList.add('mostrar');
  });

  btnCopiar.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(salida.value);
      window.mostrarToast('Contraseña copiada');
    } catch (error) {
      salida.select();
      window.mostrarToast('Selecciona y copia con Ctrl+C');
    }
  });
});
