/**
 * Worker de Cloudflare — backend gratuito del asistente de IA del portafolio
 * ---------------------------------------------------------
 * Este archivo NO va en GitHub Pages. Se despliega aparte, en
 * Cloudflare (cuenta gratuita, sin tarjeta). Ver README.md en esta
 * misma carpeta para los pasos.
 *
 * Qué hace:
 *  1. Recibe un POST desde js/asistente-ia.js con { messages: [...] }
 *  2. Verifica que la petición venga del dominio del portafolio
 *     (evita que otros sitios usen tu cuota gratis)
 *  3. Llama a Workers AI (gratis hasta 10,000 "neurons"/día,
 *     sin tarjeta) usando el binding "AI" — sin API key que
 *     manejar ni exponer en el navegador del visitante
 *  4. Devuelve la respuesta como JSON
 * ---------------------------------------------------------
 */

// Cambia esto por el dominio real donde vive tu portafolio.
// Puedes poner varios (ej. el de GitHub Pages y tu dominio propio).
const ORIGENES_PERMITIDOS = [
  'https://alcedomontero.do',
  'https://www.alcedomontero.do',
];

const MODELO = '@cf/meta/llama-3.1-8b-instruct-fast';

function cabecerasCORS(origen) {
  const permitido = ORIGENES_PERMITIDOS.includes(origen);
  return {
    'Access-Control-Allow-Origin': permitido ? origen : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origen = request.headers.get('Origin') || '';
    const cors = cabecerasCORS(origen);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (!ORIGENES_PERMITIDOS.includes(origen)) {
      return new Response(JSON.stringify({ error: 'Origen no autorizado' }), {
        status: 403,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), {
        status: 405,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    try {
      const cuerpo = await request.json();
      const mensajes = Array.isArray(cuerpo.messages) ? cuerpo.messages : [];

      if (!mensajes.length) {
        return new Response(JSON.stringify({ error: 'Faltan mensajes' }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' },
        });
      }

      // Defensa básica contra abuso: limita cuántos mensajes de
      // historial y cuántos caracteres por mensaje se aceptan, para
      // que nadie agote la cuota gratis diaria con mensajes gigantes.
      const mensajesLimitados = mensajes.slice(-8).map((m) => ({
        role: m.role === 'system' || m.role === 'assistant' ? m.role : 'user',
        content: String(m.content || '').slice(0, 2000),
      }));

      const resultado = await env.AI.run(MODELO, {
        messages: mensajesLimitados,
        max_tokens: 400,
      });

      return new Response(JSON.stringify({ content: resultado.response || '' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Error interno' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
  },
};
