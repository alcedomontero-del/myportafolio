# Lecciones — Firebase + Cloudinary + Hosting estático

Guía de referencia rápida con los problemas reales que nos encontramos
armando los proyectos "Pet Shop Los Hermanos" y "Portal de Certificados"
(ambos con la misma arquitectura: `env.js` + `boot.js` + `local-db.js` /
`firebase-real.js` + Cloudinary). Si armas un proyecto nuevo con esta
misma base, revisa esta lista antes de perder tiempo adivinando.

---

## 1. `window.DB` vs `window.FirebaseDB` desalineados

**Síntoma:** el login no hace nada, o `Cannot read properties of undefined (reading 'login')`.

**Causa:** `boot.js` espera que `firebase-real.js` guarde todo en
`window.FirebaseDB`. Si por error `firebase-real.js` usa `window.DB =`
directamente, `boot.js` lo sobreescribe con `undefined` un instante
después.

**Regla:** en `firebase-real.js`, el objeto final SIEMPRE se llama
`window.FirebaseDB`, nunca `window.DB`. `window.DB` lo arma `boot.js`,
no cada archivo por su cuenta.

---

## 2. Una función de `ui.js` borrada o incompleta

**Síntoma:** `Uncaught TypeError: window.pintarBadgeModo is not a function`,
y el formulario de login (o cualquier página) deja de reaccionar por
completo — como si el botón no existiera.

**Causa:** `auth.js`, `admin.js` y `store.js`/`buscar.js` llaman a
`window.pintarBadgeModo(...)` en su primera línea. Si esa función no
existe, el script entero se detiene ahí — nunca llega a conectar el
`addEventListener` del formulario.

**Regla:** puedes vaciar el *contenido* de una función (por ejemplo,
para que no muestre ningún mensaje), pero la función tiene que seguir
existiendo. Nunca borres su declaración completa.

```js
// Bien: función vacía por dentro, pero sigue existiendo
window.pintarBadgeModo = function (contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;
  if (window.ES_LOCAL) {
    // aquí puede ir un mensaje, o nada
  }
};
```

---

## 3. Un archivo cargado dos veces, de dos formas distintas

**Síntoma:** comportamiento inconsistente entre modo local y producción;
Firebase se inicializa quiera o no.

**Causa:** un `<script type="module" src="js/firebase-real.js">` puesto
a mano en el HTML, ADEMÁS del que `boot.js` ya carga dinámicamente según
el entorno.

**Regla:** `firebase-real.js` **nunca** se pone como `<script>` directo
en el HTML. Solo `boot.js` decide cuándo cargarlo (y decide si en su
lugar carga `local-db.js`).

---

## 4. Git conectado, pero Firebase Hosting no se entera

**Síntoma:** subes cambios a GitHub, la página real no cambia.

**Causa:** Git/GitHub y Firebase Hosting son sistemas independientes.
Uno no le avisa al otro a menos que exista una GitHub Action específica
(`firebase init hosting:github`) — y si nunca se completó ese paso, no
hay carpeta `.github/workflows/`.

**Solución inmediata:** `firebase deploy` manual desde la terminal, en
la carpeta del proyecto, cada vez que cambies algo.

**Solución permanente:** correr `firebase init hosting:github` para
crear la conexión automática de verdad.

---

## 5. `Missing or insufficient permissions`

**Síntoma:** una acción puntual falla (crear categoría, guardar algo
nuevo) aunque el login sí funcione.

**Causa:** las reglas de seguridad de Firestore niegan todo lo que no
tenga una regla explícita. Si agregas una colección nueva (por ejemplo
`categorias`) y no le agregas su propio bloque `match` en las reglas,
Firestore la bloquea por defecto.

**Regla:** cada colección nueva necesita su propio bloque en
`Firestore Database → Reglas`, aunque sea igual de simple que las
demás:
```
match /categorias/{id} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

---

## 6. El "rebote" del login (login funciona, pero regresa solo)

**Síntoma:** entras bien, ves el panel admin medio segundo, y regresa
solo a `login.html` — como si la sesión no existiera.

**Causa:** `getCurrentUser()` pregunta el estado de Firebase Auth de
forma INMEDIATA. Justo al cargar una página nueva, Firebase todavía no
ha tenido tiempo de confirmar la sesión guardada (lo hace de forma
asíncrona) — así que esa primera pregunta casi siempre contesta "no hay
nadie", aunque sí la haya.

**Regla:** cualquier guardia de autenticación (la parte que decide si
mandarte a `login.html` o no) debe usar `onAuthChange()`, que espera la
respuesta real, en vez de `getCurrentUser()`, que pregunta de golpe.

```js
// Mal — pregunta antes de tiempo
const user = window.DB.getCurrentUser();
if (!user) { window.location.href = "login.html"; }

// Bien — espera la confirmación real
window.DB.onAuthChange((user) => {
  if (!user) { window.location.href = "login.html"; }
  // ... resto de la lógica
});
```

---

## 7. `import` / `initializeApp` colados en `config.js`

**Síntoma:** `Uncaught SyntaxError: Cannot use import statement outside
a module`, seguido de `Firebase: Need to provide options (app/no-options)`.

**Causa:** `config.js` se carga como script normal (no como módulo), y
`import` solo existe dentro de módulos — el archivo entero se cae en
esa línea, así que ni siquiera llega a definir `window.FIREBASE_CONFIG`.
Esto suele pasar al copiar el fragmento de ejemplo que la propia consola
de Firebase muestra al registrar una app web.

**Regla:** `config.js` es solo una libreta de datos — nunca debe tener
`import` ni llamar a `initializeApp()`. Esa inicialización vive una sola
vez, dentro de `firebase-real.js`.

---

## 8. Índice de Firestore faltante (collection group + orderBy)

**Síntoma:** `FirebaseError: The query requires a COLLECTION_GROUP_DESC
index for collection ... You can create it here: [link]`.

**Causa:** cualquier consulta que combine `collectionGroup()` (juntar
varias subcolecciones, como todas las cédulas) con `orderBy()` (ordenar
los resultados) necesita un índice especial que Firestore no crea solo
la primera vez.

**Solución:** clic en el link que trae el propio error — te lleva
directo a la consola con el índice ya configurado, solo falta darle
"Crear". Alternativa manual: Firestore Database → Índices → pestaña de
campo único → busca el campo → activa el switch de "Alcance del grupo
de colecciones" en Ascendente/Descendente. Tarda 1-5 minutos en
construirse; mientras tanto el error persiste, es normal.

---

## 9. Cloudinary bloquea PDFs con error 401

**Síntoma:** `401 (Unauthorized)` al intentar descargar un PDF, aunque
la subida haya funcionado y el archivo se vea en el Dashboard de
Cloudinary.

**Causa:** Cloudinary bloquea por defecto la entrega pública de PDFs y
ZIP en cuentas gratuitas, por seguridad — aunque el archivo exista y se
pueda administrar desde el Dashboard.

**Solución (ajuste de cuenta, no de código):** Cloudinary → Settings →
Security → sección "PDF and ZIP files delivery" → activa "Allow
delivery of PDF and ZIP files" → Save. Si probaste el mismo archivo
antes de activarlo, puede quedar cacheado el error — probar con un
archivo subido después del cambio para confirmar.

---

## 10. Botones o columnas que se salen del marco en pantallas angostas

**Síntoma:** en el celular, la página se ve bien "a simple vista" pero
se puede deslizar horizontalmente un poco, y algún botón o columna
queda cortado o fuera del marco visible.

**Causa:** tanto Flexbox como CSS Grid le dan a sus elementos hijos un
**ancho mínimo automático invisible**, basado en el tamaño de su
contenido (`min-width: auto` por defecto). Eso significa que aunque le
digas a un elemento "encógete si hace falta" (`flex: 1`, o una columna
`1fr`), el navegador igual se niega a encogerlo más allá de lo que su
contenido "prefiere" — y el resto de los elementos se ven empujados
fuera del contenedor.

**Regla:** cualquier elemento dentro de un `display: flex` o
`display: grid` que deba poder encogerse en pantallas chicas necesita
`min-width: 0` explícito — sin eso, el navegador ignora tu `flex: 1` o
tu `1fr` en cuanto el contenido interno no cabe.

```css
/* Flexbox: el input no se encogía y empujaba al botón fuera */
.buscador-row input {
  flex: 1;
  min-width: 0; /* <- esta línea es la que arregla el desborde */
}

/* Grid: la columna no se encogía y empujaba todo el panel */
.admin-grid > * {
  min-width: 0;
}
```

**Cómo detectarlo rápido (sin depender de "a mí se me ve bien"):**
prueba tu página en varios anchos angostos de verdad — 320px, 360px,
375px — no solo en la ventana del navegador de tu computadora
redimensionada, porque a veces el bug solo aparece por debajo de cierto
ancho exacto.

---

## 11. `hidden` de HTML pierde contra `display: flex/grid` del CSS

**Síntoma:** un elemento con el atributo `hidden` sigue visible (y
sigue interceptando clics) aunque en el HTML diga `hidden`.

**Causa:** el navegador oculta `[hidden]` con una regla interna
`display: none` de muy baja prioridad. Si tu propio CSS le pone a esa
misma clase `display: flex` o `display: grid` (para cuando SÍ se
muestra), esa regla — al venir en una hoja de estilos cargada después —
gana la pelea y el `hidden` deja de tener efecto visual, aunque el
atributo siga estando en el HTML.

**Regla:** cualquier elemento que se muestre con `display: flex` o
`display: grid` y se oculte con el atributo `hidden` necesita un
refuerzo explícito:
```css
.mi-elemento { display: flex; }
.mi-elemento[hidden] { display: none; }
```

**Cómo detectarlo rápido:** si Playwright (u otra prueba) dice
"element intercepts pointer events" sobre algo que debería estar
oculto, es casi siempre esto.

---

## 12. `margin-left: auto` dentro de una barra con scroll horizontal

**Síntoma:** en móvil, un botón (ej. "Cerrar sesión") queda pegado al
borde visible de la pantalla y tapa el resto de los botones de la
barra, aunque la barra sí se pueda deslizar.

**Causa:** `margin-left: auto` empuja el elemento al final del
**espacio visible del contenedor**, no al final real del contenido
scrolleable — dentro de una barra con `overflow-x: auto`, eso lo
"pega" a la ventana en vez de dejarlo en su lugar natural después de
los demás botones.

**Regla:** en una barra que scrollea horizontalmente, todos sus
elementos van en flujo normal (`margin-left` fijo, no `auto`) para que
el usuario los alcance deslizando, no que uno se superponga sobre los
demás.

---

## 13. Un tooltip invisible sigue desbordando la página

**Síntoma:** en móvil aparece un pequeño desborde horizontal (2-6px)
aunque nada se vea fuera de lugar a simple vista.

**Causa:** un tooltip con `opacity: 0` (o `visibility: hidden`) sigue
ocupando su espacio real en el layout — solo se vuelve invisible, no
desaparece del documento. Si además tiene `white-space: nowrap` y
texto largo, su caja puede extenderse más allá del viewport y el
navegador cuenta ese desborde aunque el usuario nunca lo vea.

**Regla:** cualquier tooltip/popover con texto dinámico necesita
`max-width` (idealmente con `calc(100vw - margen)`) y
`white-space: normal` para envolver línea — nunca `nowrap` sin límite
de ancho, ni siquiera si está oculto con opacidad.

**Cómo detectarlo:** comparar `scrollWidth` de cada elemento contra
`clientWidth` del documento (no basta con mirar la pantalla, hay que
medirlo) — así fue como se encontró este caso.

---

## 14. `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` desborda en pantallas angostas

**Síntoma:** un grid de tarjetas se ve perfecto en desktop y en la
mayoría de móviles, pero en pantallas muy angostas (320px) las
tarjetas se salen un poco del borde derecho.

**Causa:** `minmax(300px, 1fr)` le exige a cada columna un mínimo de
300px **sin importar el ancho real del contenedor**. Si el
contenedor (restando el padding) mide menos que ese mínimo — como
pasa en 320px con 24px de padding a cada lado (272px disponibles) —
el grid fuerza una columna más ancha que la pantalla.

**Regla:** envolver el mínimo con `min()` contra `100%`:
```css
grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
```
Así la columna nunca pide más ancho del que el contenedor realmente
tiene — en desktop se comporta igual, en pantallas angostas cede.

---

## 15. Un script que carga otro script con ruta relativa a la PÁGINA, no a sí mismo

**Síntoma:** todo funciona perfecto en `index.html` (raíz del sitio),
pero en cualquier página dentro de una subcarpeta (ej.
`herramientas/qr.html`) la app se queda colgada — no hay error visible
obvio, simplemente `window.DB` nunca se define.

**Causa:** dentro de `boot.js`, código como
`document.createElement('script').src = "js/local-db.js"` es una ruta
**relativa a la URL del documento actual**, no relativa al archivo
`boot.js` que la está ejecutando. Si `boot.js` vive en `/js/boot.js` y
la página que lo incluye está en `/herramientas/qr.html`, esa ruta se
resuelve como `/herramientas/js/local-db.js` — que no existe.

**Regla:** cuando un script necesita cargar OTRO archivo por su
cuenta (no vía `<script src="...">` en el HTML, sino dinámicamente
con JS), la ruta debe construirse relativa a la URL del propio script
— capturada con `document.currentScript.src` **antes** de cualquier
código asíncrono (después de un `await`, `document.currentScript` ya
no apunta a nada) — y nunca como una ruta relativa "a mano" que
asume que la página siempre está en la raíz.

**Cómo detectarlo:** cualquier página nueva fuera de la raíz que se
quede cargando para siempre sin errores obvios en consola — revisar
la pestaña Network del navegador por un 404 a una ruta que "debería"
existir.

---

## 16. Un overlay `position: absolute` que queda con coordenadas viejas al cambiar el tamaño de ventana

**Síntoma:** en el recortador de imágenes, después de usar la
selección de recorte una vez, la página queda con desborde
horizontal en pantallas angostas (320px) — aunque el mismo lienzo se
veía bien antes de recortar.

**Causa:** el rectángulo de selección (`.pub-seleccion-recorte`) se
posiciona con `left/top/width/height` en píxeles calculados a partir
del `getBoundingClientRect()` del lienzo **en el momento del
arrastre**. Si esos valores quedan pintados (la clase `.activa`
sigue puesta) y luego la ventana cambia de tamaño — el lienzo se
encoge por el `max-width: 100%`, pero el overlay absoluto no se
recalcula solo — el rectángulo viejo sobresale del contenedor nuevo,
más angosto, y ese sobrante cuenta para el ancho total de la página.

**Regla:** cualquier overlay absoluto cuyas coordenadas dependan de
un elemento redimensionable debe **limpiarse (quitar la clase que lo
muestra) en cuanto deja de ser válido** — en este caso, apenas se
usa la selección para generar el recorte, no solo cuando se carga
una imagen nueva. No basta con que esté "lógicamente" obsoleto; si
sigue con `display` visible, sigue empujando el ancho de la página.

---

## 17. Excepción a "vendorizar librerías de terceros": herramientas que ya necesitan internet igual

**Contexto:** la regla de `PROTOCOLO.md` es vendorizar en `js/vendor/`
en vez de cargar por CDN, para que la herramienta funcione igual en
producción y en pruebas locales sin depender de un CDN externo. Esa
regla asume que la herramienta, de por sí, es 100% offline.

**Excepción acordada con el usuario para la Fase 6d:** imagen→PDF,
PDF→imágenes y OCR usan librerías (jsPDF, pdf.js, Tesseract.js) por
CDN de `cdnjs.cloudflare.com`, sin vendorizar. La diferencia con el
resto de las herramientas es que **estas tres, aunque procesan todo
en el navegador del visitante (nunca suben el archivo a ningún
servidor), no tienen sentido sin internet**: Tesseract.js en
particular descarga los datos del idioma elegido en el momento de
usarlo, sin importar de dónde salió el propio script. Vendorizar el
script pero no los datos de idioma habría sido una falsa sensación de
"funciona offline" que no es cierta. Por eso el usuario prefirió
dejarlas explícitamente como "solo funcionan con internet" en vez de
fingir independencia de red.

**Regla:** antes de vendorizar una librería nueva, preguntar si la
herramienta que la usa es realmente autosuficiente sin internet una
vez cargado el script. Si no lo es (como con datos de idioma, fuentes
remotas, etc.), no tiene sentido vendorizar solo el script — mejor
usar CDN directo y avisarlo claramente en la página (`pub-nota-internet`
en `publico.css`) para que el visitante no se sorprenda si falla sin
conexión.

**Patrón para la carga:** `js/herramientas/cargador-librerias.js`
expone `window.cargarScriptCDN(src, comprobarYaCargado)` — reutilizable
por cualquier herramienta futura que necesite lo mismo (ej. la Fase 6e
con jsPDF para el creador de CV/diplomas). Si falla la carga (sin
conexión, CDN caído), rechaza la promesa con un mensaje claro en vez
de dejar la página colgada — se atrapa con try/catch y se muestra con
`mostrarToast(mensaje, 'error')`, igual que cualquier otro error de
la herramienta.

---

## 18. Un área del panel admin que depende de datos de OTRA área nunca se refresca al cambiar de pestaña

**Síntoma:** en el Centro de Control (Fase 8), la tarjeta de PayPal
seguía en ámbar ("no hay link configurado") aun después de ir al área
Canales y contacto, pegar un link real y guardarlo. Volver a la
pestaña Centro de Control no la actualizaba — solo recargando toda la
página (F5) se veía el cambio.

**Causa:** en `admin.js`, cada área (`inicializarAreaPortafolio`,
`inicializarAreaCanales`, etc.) se inicializa **una sola vez**, justo
después de confirmar la sesión con `onAuthChange()`. Eso está bien
para áreas que solo dependen de sus propios datos (crear/editar/borrar
en su propia colección ya dispara su propio `cargarX()`). Pero el
Centro de Control es distinto: sus tarjetas leen datos que se editan
**en otras áreas** (el link de PayPal vive en `configSitio`, que edita
Canales y contacto) — cambiar de pestaña con `mostrarArea()` solo
oculta/muestra secciones, nunca vuelve a pedir datos.

**Regla:** cualquier área cuyo contenido dependa de datos que se
editan en otra parte del panel debe volver a cargarse **cada vez que
se entra a su pestaña**, no solo la primera vez. En `mostrarArea()`
(dentro de `inicializarNavegacion()` en `admin.js`):
```js
function mostrarArea(nombre) {
  // ... mostrar/ocultar secciones como siempre ...
  if (nombre === "control" && window.inicializarAreaControl) {
    window.inicializarAreaControl();
  }
}
```
Las áreas normales (con su propio CRUD) no necesitan este patrón —
solo las de solo-lectura/diagnóstico que resumen datos de todo el
sitio, como el Centro de Control.

---

## 19. `const` usada antes de su declaración, dentro de la misma función (temporal dead zone)

**Síntoma:** `Uncaught ReferenceError: Cannot access 'X' before initialization`
apenas carga la página — el resto del script ni siquiera corre (en este
caso, el aviso de cookies de la Fase 9 nunca aparecía).

**Causa:** dentro de una misma función, llamar a otra función que lee
una `const` declarada **más abajo en el código, textualmente**, revienta
aunque la llamada esté dentro de una función declarada con `function`
(que sí se "eleva" completa). Las `const`/`let` no se elevan de la misma
forma — existen en una zona muerta hasta que su línea de declaración se
ejecuta, sin importar que la función que las usa se haya definido antes.

```js
// Mal — inicializarAlgo() se llama antes de que exista CLAVE
function armar() {
  inicializarAlgo();       // revienta aquí
  const CLAVE = 'x';
  function inicializarAlgo() { localStorage.getItem(CLAVE); }
}

// Bien — la const está declarada antes de cualquier llamada que la use
function armar() {
  const CLAVE = 'x';
  inicializarAlgo();
  function inicializarAlgo() { localStorage.getItem(CLAVE); }
}
```

**Regla:** cualquier `const`/`let` que una función interna vaya a leer
debe declararse **antes** de la primera línea que llama a esa función,
no en cualquier parte del cuerpo solo porque "está en el mismo scope".
Las declaraciones `function nombre() {}` sí se pueden dejar después
(se elevan completas), pero las variables no.

---

## Caso #20 — doble inicialización concurrente resetea el estado de una tarjeta a mitad de interacción

`inicializarAreaControl()` se llamaba dos veces: una al iniciar sesión
(junto con las demás áreas, en `admin.js`) y otra cada vez que se
entraba a la pestaña "Centro de Control" (fix del caso #18, para que
los datos se recalculen). El área Control arranca `hidden` — no hace
falta pintarla al login, solo cuando se visita. Como ambas llamadas
son async (`await Promise.all(...)`), la del login podía terminar
*después* de que el usuario ya hubiera interactuado con una tarjeta
(abrirla), pisando el grid entero con un render nuevo — reseteando
`aria-expanded` a `"false"` en medio de la secuencia abrir → cerrar,
así que el siguiente clic la abría de nuevo en vez de cerrarla.

```js
// Mal — se inicializa un área que arranca hidden, generando una
// carrera con la reinicialización de su propio handler de navegación
if (window.inicializarAreaControl) window.inicializarAreaControl();

// Bien — el handler de navegación ya la carga/recalcula al entrar
if (nombre === "control" && window.inicializarAreaControl) {
  window.inicializarAreaControl();
}
```

**Regla:** un área que arranca `hidden` y que ya se recarga al entrar
a su pestaña no necesita (y no debe) inicializarse también en el login
— hacerlo dos veces crea una carrera entre dos renders async que puede
pisar el estado de interacción (abierto/cerrado, foco, scroll) del que
llegó segundo.

---

## Caso #21 — `<label>` con borde y contenido multilínea: el marco se fragmenta

`.pub-dropzone` es un `<label>` (envuelve el emoji, el texto y el
`<input type="file">` oculto). Un `<label>` es **inline** por
defecto. Con `border` + contenido que ocupa varias líneas (el emoji
como bloque, luego texto con `<strong>` seguido de un `<br>`), el
navegador no dibuja un solo marco alrededor de la caja: fragmenta el
borde por cada línea de texto, dejando trazos sueltos en vez de un
rectángulo — y el salto de línea entre el `<strong>` y el texto
siguiente colapsa porque las líneas ya no forman un bloque continuo.
Afectaba a las 5 herramientas que usan este mismo patrón (compresor,
recortador, imágenes→PDF, PDF→imágenes, OCR).

```css
/* Mal — <label> sigue siendo inline aunque tenga border/padding */
.pub-dropzone {
  border: 2px dashed var(--pub-borde);
  padding: 32px 20px;
}

/* Bien — se fuerza a comportarse como un solo bloque */
.pub-dropzone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  border: 2px dashed var(--pub-borde);
  padding: 32px 20px;
}
```

**Regla:** cualquier elemento naturalmente inline (`<label>`, `<a>`,
`<span>`) al que se le pongan `border`/`padding` y vaya a contener
más de una línea de contenido necesita `display: block` o `flex`
explícito — si no, el navegador puede fragmentar el borde por línea
en vez de dibujar un marco único. Revisar esto primero cuando un
"marco se ve cortado" en cualquier caja construida sobre una etiqueta
que no sea `<div>`/`<section>` por defecto.

---

## Recordatorio general

Cuando algo "no funciona" en este stack, antes de sospechar del código
completo, revisa en este orden:
1. **Consola del navegador (F12)** — el 90% de las veces el error trae
   el archivo y línea exactos.
2. **¿El archivo realmente llegó al servidor?** (`firebase deploy`, o
   revisar el archivo directo en la URL de producción).
3. **¿Es un error de Firebase/Firestore/Cloudinary con link propio?**
   — suelen traer la solución en el mismo mensaje.
4. Recién ahí, sospechar de la lógica del código en sí.
