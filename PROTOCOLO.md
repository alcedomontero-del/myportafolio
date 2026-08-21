# Protocolo de trabajo — proyectos web (HTML/CSS/JS + Firebase/Cloudinary/Netlify)

Documento de referencia para que cualquier proyecto nuevo arranque con
las convenciones ya corregidas desde el día 1, y para resolver errores
rápido sin ida y vuelta innecesaria.

---

## 1. Cómo reportar un error (lo más rápido para los dos)

1. Pega el error de la consola tal cual (F12 → Console) — no lo
   resumas ni lo parafrasees, el texto exacto trae el archivo y la
   línea.
2. Dime qué proyecto y qué página, si no es obvio por el contexto.
3. Si es algo visual ("se ve mal"), describe qué se sale de lugar y en
   qué tamaño de pantalla lo viste (celular / tablet / computadora).

Con eso normalmente basta — no hace falta que subas archivos completos
de entrada; si necesito ver alguno específico, te lo pido yo.

---

## 2. Qué voy a asumir por defecto (para no preguntar de más)

- Arquitectura estándar de 3 capas: `env.js` + `boot.js` + `ui.js`
  (genéricos, iguales en todo proyecto) + `local-db.js` (demo local) +
  `firebase-real.js` (conexión real) + `config.js` (solo datos).
- **Modo de demostración local siempre incluido**, con datos de
  ejemplo — para que puedas probar y mostrar cualquier proyecto sin
  depender de que ya esté configurado en producción.
- **Hosting:** Netlify conectado a GitHub, salvo que pidas otra cosa.
- **Backend:** Firebase (Auth + Firestore) para login/datos, Cloudinary
  para archivos — pero **solo si el proyecto realmente los necesita**.
  Si no, ver punto 4.
- **Pruebo cada entrega con Playwright antes de dártela** (flujo
  completo: login, crear/editar/eliminar, responsive en varios
  anchos). No te voy a pedir que la pruebes tú primero — si algo falla,
  ya lo habré encontrado yo antes de mandarlo.

---

## 3. Convenciones ya corregidas — de fábrica en todo proyecto nuevo

Estas ya no son "cosas que se corrigen después", van bien desde el
primer archivo que escriba:

- `firebase-real.js` siempre expone `window.FirebaseDB` — nunca
  `window.DB` directo (eso lo arma `boot.js`).
- `config.js` es **solo datos** — nunca `import`, nunca
  `initializeApp()`.
- `ui.js`: `pintarBadgeModo` y `mostrarToast` siempre existen como
  funciones, aunque estén vacías por dentro — nunca se borran.
- Toda guardia de sesión usa `onAuthChange()` — nunca `getCurrentUser()`
  suelto al cargar la página.
- Todo elemento dentro de `flex` o `grid` que deba encogerse en móvil
  lleva `min-width: 0`.
- Cada colección nueva de Firestore necesita su propio bloque `match`
  explícito en las reglas de seguridad.
- Si el proyecto sube PDF o ZIP a Cloudinary, recordar activar
  "Allow delivery of PDF and ZIP files" en Settings → Security.

(El detalle completo de cada una, con el porqué, está en
`LECCIONES.md`.)

---

## 4. Si un proyecto NO necesita Firebase / Cloudinary / etc. todavía

En vez de omitir la integración por completo, dejo el terreno
preparado:

- Un comentario claro al inicio del archivo relevante, explicando que
  está inactivo y por qué.
- El bloque de código ya escrito, pero comentado — listo para
  descomentar, no para escribir desde cero.
- Una sección corta en `CONFIGURACION.md` con los pasos exactos para
  activarlo el día que haga falta.

Ejemplo de cómo se vería en un proyecto que por ahora no necesita
Cloudinary:

```js
/**
 * Este proyecto no sube archivos todavía, así que Cloudinary está
 * desactivado. Si en el futuro necesitas subir imágenes o PDFs:
 *   1. Crea tu cuenta en cloudinary.com (ver CONFIGURACION.md, sección "Activar Cloudinary")
 *   2. Descomenta el bloque de abajo
 *   3. Completa window.CLOUDINARY_CONFIG en config.js
 */
// async function subirArchivoCloudinary(archivo) {
//   ...
// }
```

Esto evita generar y mantener código que no se usa hoy, sin cerrarte
la puerta a agregarlo después sin reinventar nada.

---

## 5. Ideas para ahorrar más (más allá de abreviar palabras)

- **Reutilizar los módulos genéricos tal cual** (`env.js`, `boot.js`,
  `ui.js`) entre proyectos — son idénticos en todos los que hemos
  hecho, no hace falta regenerarlos de cero cada vez.
- **`LECCIONES.md` como primera parada** — si un síntoma nuevo se
  parece a uno ya documentado, voy directo a aplicar y verificar la
  solución conocida, sin re-investigar desde cero.
- **"Cómo [proyecto anterior] pero para X"** — si un proyecto nuevo se
  parece a uno que ya armamos, decímelo así de entrada; parto de la
  base ya probada en vez de diseñar desde cero.
- **Un mensaje, un problema** — cuando reportes varias cosas sueltas
  en un solo mensaje, las resuelvo todas igual, pero si son de temas
  distintos (un bug + un cambio de diseño, por ejemplo), separarlos en
  mensajes cortos me deja confirmarte cada uno antes de seguir al
  siguiente, en vez de que tengas que revisar un solo mensaje enorme al
  final.
