# Backend gratuito del asistente de IA (Cloudflare Worker)

Esto NO se sube a GitHub Pages. Es un "Worker" — una función que corre en
la nube de Cloudflare, gratis, sin tarjeta de crédito, sin servidor que
mantener. El visitante de tu portafolio nunca necesita iniciar sesión en
nada: solo tú (Alcedo) creas la cuenta de Cloudflare una vez.

Gratis hasta 10.000 "neurons" (~cientos de conversaciones) por día,
se resetea todos los días — de sobra para un portafolio.

## Pasos (todo desde el navegador, sin instalar nada)

1. Crea una cuenta gratis en https://dash.cloudflare.com/sign-up (no pide tarjeta).
2. En el menú lateral entra a **Workers y Pages** → **Crear** → **Crear Worker**.
3. Ponle un nombre (ej. `asistente-alcedo`) y créalo.
4. Te abre un editor en el navegador. Borra todo el código de ejemplo y
   pega el contenido completo de `index.js` (el archivo que está en esta
   misma carpeta).
5. Antes de desplegar, activa la IA gratis:
   - Ve a la pestaña **Configuración** del Worker → **Enlaces (Bindings)**
   - Agrega un enlace de tipo **Workers AI**
   - Nómbralo exactamente `AI` (así lo espera el código: `env.AI`)
6. Abre `index.js` en el editor de Cloudflare y edita la lista
   `ORIGENES_PERMITIDOS` arriba del archivo: pon ahí la URL exacta de tu
   portafolio (por ejemplo `https://alcedomontero-del.github.io`, y tu
   dominio propio si tienes uno). Esto evita que otros sitios usen tu
   cuota gratis.
7. Haz clic en **Desplegar (Deploy)**.
8. Cloudflare te da una URL como
   `https://asistente-alcedo.TU-USUARIO.workers.dev` — cópiala.
9. En tu portafolio, abre `js/asistente-ia.js` y reemplaza la línea:
   ```js
   const URL_ASISTENTE = 'https://REEMPLAZA-CON-TU-WORKER.workers.dev/';
   ```
   con tu URL real de Cloudflare.
10. Sube el cambio a GitHub (git add, commit, push) y listo — el chat
    del portafolio ya responde, sin que el visitante inicie sesión en
    nada.

## Si algún día quieres cambiar el modelo de IA

El archivo usa `@cf/meta/llama-3.1-8b-instruct-fast`, un modelo liviano y
gratuito de sobra para responder preguntas sobre tu portafolio. Cloudflare
a veces retira modelos viejos; si en el futuro ves un error, revisa la
lista actual en https://developers.cloudflare.com/workers-ai/models/ y
cambia el valor de `MODELO` en `index.js` por uno vigente.
