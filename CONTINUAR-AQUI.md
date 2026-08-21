# CONTINUAR-AQUI.md — Briefing de continuación

Este proyecto se empezó en otra cuenta de Claude y se retoma aquí.
Este documento es lo primero que hay que leer — resume en qué quedamos
sin tener que releer toda la conversación anterior.

## 1. Léeme en este orden

1. **Este archivo** (contexto y estado actual).
2. `RESUMEN-PORTAFOLIO.md` — el plano completo del proyecto: las 5
   áreas de admin, herramientas, diseño, dominio, todo lo decidido
   desde el principio.
3. `PROTOCOLO.md` — convenciones de código que se siguen sin excepción.
4. `LECCIONES.md` — 15 errores ya cometidos y corregidos, con su
   regla para no repetirlos. **Los casos #11 al #15 se descubrieron
   en esta misma sesión** (no estaban en la plantilla original):
   - #11: `hidden` de HTML pierde contra `display:flex/grid` del CSS.
   - #12: `margin-left:auto` dentro de una barra con scroll horizontal.
   - #13: un tooltip invisible (`opacity:0`) sigue desbordando la página.
   - #14: `minmax(300px, 1fr)` desborda en pantallas angostas — usar
     `minmax(min(300px, 100%), 1fr)`.
   - #15: un script que carga otro script con ruta relativa a la
     PÁGINA en vez de a sí mismo — rompe cualquier página fuera de la
     raíz (ej. `herramientas/qr.html`). Corregido en `boot.js`.
5. `GUIA_INSTALACION.md` — pasos genéricos para conectar Firebase/Cloudinary.
6. `CONFIGURACION.md` — los mismos pasos pero específicos de este
   proyecto (alcedomontero.do).

## 2. Qué es este proyecto

Portafolio personal freelance de Alcedo Montero. Un panel de admin en
LCARS (una sola página, 5 áreas) para gestionar el contenido, y una
cara pública oscura/elegante que lo muestra. Corre 100% en el
navegador — sin backend propio — usando Firebase (Firestore + Auth) y
Cloudinary, con un modo local de demostración (`local-db.js`) que
simula ambos mientras no hay credenciales reales.

**Credenciales de la demo local** (NO son reales, solo para probar el
panel mientras `config.js` tenga los valores de plantilla):
- Correo: `admin@demo.com`
- Contraseña: `demo1234`

## 3. Estado actual — qué está TERMINADO y probado

| Fase | Qué incluye | Estado |
|---|---|---|
| 1 | Esqueleto: carpetas, `env.js`/`boot.js`/`ui.js`, `local-db.js` y `firebase-real.js` adaptados a las 7 colecciones reales, `firestore.rules`, `CONFIGURACION.md` | ✅ Hecho y probado |
| 2 | `login.html` + `admin.html` (armazón LCARS, guardia de sesión, navegación entre 5 áreas, animación de arranque) | ✅ Hecho y probado |
| 3 | Área **Portafolio**: CRUD completo de proyectos, categorías dinámicas (emoji), testimonios | ✅ Hecho y probado |
| 4 | `index.html` público: hero, sección Proyectos, sección Testimonios, punto de estado, Open Graph, estados vacíos/carga | ✅ Hecho y probado |
| 5 | Área **Canales y contacto**: CRUD de plataformas freelance, config de PayPal, interruptor del punto de estado, sección pública "Trabajemos juntos" que lee `?de=` | ✅ Hecho y probado |
| 6a | Admin de Herramientas (activar/desactivar + reordenar) + `herramientas.html` público (grid de activas) | ✅ Hecho y probado |
| 6b | 5 herramientas ligeras sin librerías externas | ✅ Hecho y probado |
| 6c | Compresor de imágenes + redimensionador/recortador (Canvas nativo) | ✅ Hecho y probado |
| 6d | Imagen↔PDF + OCR (librerías con carga diferida por CDN) | ✅ Hecho y probado |
| 6e | Creador de CV + creador de diplomas (jsPDF) | ✅ Hecho y probado |
| 7 | Área **Descargables** (CV + apps propias, sube archivos reales a Cloudinary) | ✅ Hecho y probado |
| 8 | **Centro de Control** (tarjetas de diagnóstico verde/ámbar/rojo) | ✅ Hecho y probado |
| 9 | Extras transversales: sitemap.xml, aviso de cookies, Google Analytics | ✅ Hecho y probado |
| 10 | Pruebas Playwright finales + entrega | ✅ Hecho — las 12 baterías corrieron de punta a punta en verde |

**Todas las pruebas de Playwright pasando**, repartidas en 12 archivos
(`test_flujo.py`, `test_portafolio.py`, `test_publico.py`,
`test_canales.py`, `test_herramientas_6a.py`, `test_herramientas_6b.py`,
`test_herramientas_6c.py`, `test_herramientas_6d.py`,
`test_herramientas_6e.py`, `test_descargables.py`,
`test_centro_control.py`, `test_extras.py`) — correrlas todas antes de
seguir para confirmar que nada se rompió. La Fase 6c ya
quedó completa: se creó
`herramientas/comprimir-imagen.html` + `js/herramientas/comprimir-imagen.js`
(compresor con control de calidad y formato, comparación antes/después)
y `herramientas/recortar-imagen.html` + `js/herramientas/recortar-imagen.js`
(redimensionar por ancho/alto con proporción opcional, y recortar
arrastrando sobre un lienzo). `test_herramientas_6c.py` cubre ambas
herramientas — genera su propia imagen de prueba con Pillow (requiere
`pip install Pillow --break-system-packages` si no está ya instalado).
Se encontró y corrigió un bug real durante las pruebas — ver caso #16
en `LECCIONES.md` (overlay de selección con coordenadas viejas al
redimensionar la ventana).

**Fase 6d ya quedó completa** — a diferencia del resto de las
herramientas, estas 3 sí necesitan internet en el navegador del
visitante (no solo en esta sesión de trabajo): `herramientas/imagenes-a-pdf.html`
(jsPDF), `herramientas/pdf-a-imagenes.html` (pdf.js) y
`herramientas/ocr.html` (Tesseract.js). Las tres cargan su librería
por CDN (cdnjs) solo al usar la herramienta, nunca junto con el resto
de la página — decisión y detalle del porqué en el caso #17 de
`LECCIONES.md`. `test_herramientas_6d.py` las cubre; como el entorno
de pruebas no tiene salida a internet, esas pruebas verifican que el
resto de cada herramienta funciona (carga de archivo, lista
reordenable de imágenes→PDF, sin desborde a 320px) y que sin conexión
falla con un aviso claro (toast) en vez de trabarse — no verifican el
resultado final de la conversión/OCR en sí, eso solo se puede probar
con internet real.

**Fase 6e ya quedó completa** — se decidió que ambas herramientas son
para que el VISITANTE llene sus propios datos y descargue el PDF (no
para que Alcedo suba/edite su propio CV desde el admin — eso sigue
siendo la Fase 7, Descargables). Se creó:
- `herramientas/creador-cv.html` + `js/herramientas/creador-cv.js` —
  formulario con datos de contacto, perfil, bloques repetibles de
  experiencia y educación (agregar/quitar), y habilidades. El PDF se
  dibuja a mano con jsPDF (texto + líneas, sin plantilla HTML→PDF)
  con salto de página automático si el contenido no cabe en una hoja.
- `herramientas/creador-diploma.html` + `js/herramientas/creador-diploma.js`
  — formulario corto (destinatario, motivo, emisor, fecha, firma) con
  3 estilos de color a elegir (dorado/azul/minimalista), PDF horizontal
  con marco decorativo dibujado con jsPDF.
- Ambas reutilizan `js/herramientas/cargador-librerias.js` (mismo
  jsPDF por CDN que ya usa `imagenes-a-pdf.js`) y las clases nuevas
  `.pub-campo-seccion` / `.pub-entrada-repetible` agregadas a
  `publico.css` para los bloques repetibles del CV.
- `test_herramientas_6e.py` cubre ambas — validación de campo
  requerido, agregar/quitar bloques del CV, y (como el entorno de
  pruebas no tiene salida a internet) que sin conexión el intento de
  generar falla con un toast claro en vez de trabarse — igual
  limitación que la Fase 6d, no se pudo verificar el PDF final en sí.
- Las 12 herramientas del catálogo (`local-db.js`) ya traían los IDs
  `her-cv`/`her-diploma` con slugs `creador-cv`/`creador-diploma`
  desde antes — solo faltaban las páginas, que ya existen ahora.

## 4. Cómo correr las pruebas (aprendido por las malas)

Cada llamada de terminal en este entorno puede ser una sesión nueva —
un servidor lanzado en segundo plano en una llamada puede no existir
en la siguiente. Lo que SÍ funciona de forma confiable:

```bash
cd portafolio
python3 -m http.server 8080 > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 1
python3 -u test_flujo.py        # o el archivo de prueba que sea
kill $SERVER_PID 2>/dev/null
```
Es decir: **levantar el servidor y correr la prueba en el mismo
comando de terminal**, nunca en llamadas separadas.

## 5. Estado final del proyecto

La Fase 6 (Herramientas) está completa — sus sub-tandas fueron:
- **6a** ✅ terminada — admin simple + esqueleto público.
- **6b** ✅ terminada — 5 herramientas sin librerías externas (QR,
  contraseñas, contador de texto, paleta de colores, convertidor de
  unidades). Ver `test_herramientas_6b.py`.
- **6c** ✅ terminada — Canvas nativo, sin librerías:
  - ✅ `herramientas/comprimir-imagen.html` + `js/herramientas/comprimir-imagen.js`
    — compresor con control de calidad, formato de salida (JPEG/WEBP/PNG)
    y comparación antes/después con el peso de cada versión.
  - ✅ `herramientas/recortar-imagen.html` + `js/herramientas/recortar-imagen.js`
    — dos modos: redimensionar por ancho/alto (con proporción
    bloqueable) y recortar arrastrando una selección sobre un lienzo
    interactivo, que se reescala a la resolución real de la imagen
    original al recortar.
  - ✅ `test_herramientas_6c.py` cubre ambas — todas verdes.
- **6d** ✅ terminada — Imagen↔PDF + OCR, librerías cargadas por CDN
  (no vendorizadas — ver caso #17 de `LECCIONES.md`):
  - ✅ `herramientas/imagenes-a-pdf.html` + `js/herramientas/imagenes-a-pdf.js`
    — varias imágenes, lista reordenable (subir/bajar/quitar) y un
    PDF con una página del tamaño exacto de cada imagen (jsPDF).
  - ✅ `herramientas/pdf-a-imagenes.html` + `js/herramientas/pdf-a-imagenes.js`
    — cada página del PDF a imagen descargable, formato PNG/JPEG y
    3 niveles de nitidez (pdf.js).
  - ✅ `herramientas/ocr.html` + `js/herramientas/ocr.js` — extrae
    texto de una imagen con barra de progreso en vivo, español/inglés
    (Tesseract.js).
  - ✅ `js/herramientas/cargador-librerias.js` — helper compartido por
    las 3 para cargar su script de CDN una sola vez y avisar con un
    toast claro si falla (sin conexión).
  - ✅ `test_herramientas_6d.py` cubre las 3 — todas verdes (con las
    limitaciones de prueba sin internet explicadas arriba).
- **6e** ✅ terminada — Creador de CV + creador de diplomas (jsPDF),
  ambas para que el visitante llene sus propios datos (ver detalle
  arriba, sección 3). Reutilizan `cargador-librerias.js` de la 6d.

**La Fase 7 (Descargables) también quedó completa.** Es el área del
**admin** donde Alcedo sube archivos reales (PDF/ZIP) — su propio CV
descargable y sus apps/proyectos propios — a diferencia del creador
de CV de la Fase 6e, que sigue siendo una herramienta **pública** para
que CUALQUIER visitante genere el suyo. No confundir ambas cosas.
Se creó:
- `js/descargables-admin.js` — CRUD del área Descargables en
  `admin.html` (el HTML del formulario ya estaba, solo tenía un
  párrafo de relleno). Como PDF/ZIP no tienen vista previa visual
  como las imágenes, se muestra el nombre del archivo elegido en vez
  de una miniatura. Checkbox "Este archivo es el CV" (`esCV`) para
  marcar cuál de los archivos subidos es el currículum.
- `descargables.html` + `js/descargables-publico.js` — página
  pública: el archivo marcado como CV se muestra destacado con botón
  de descarga aparte; el resto (apps propias) va en una grilla.
  **Los archivos sin `archivoUrl` (aún no subidos desde el admin) no
  se muestran en público** — evita botones de descarga rotos.
- Se agregó el link "Descargables" a la navegación de `index.html` y
  `herramientas.html`.
- Clases nuevas en `publico.css` (`.pub-cv-destacado`,
  `.pub-grid-descargables`, `.pub-tarjeta-descargable`) y en
  `admin-lcars.css` (`.lcars-nombre-archivo`).
- `test_descargables.py` cubre todo: CRUD completo con subida de
  archivo real, validación de "sin archivo" al crear, edición sin
  volver a subir el archivo, borrado, CV destacado visible en
  público, el ítem de ejemplo sin archivo NO aparece en público,
  link de navegación presente, responsive admin y público a
  320/360/375px — todas verdes.
- La colección `descargables` ya existía desde la Fase 1 en
  `local-db.js`, `firebase-real.js` y `firestore.rules` (con su
  campo de archivo `archivoUrl`) — no hizo falta tocar esa capa.

**La Fase 8 (Centro de Control) también quedó completa.** 6 tarjetas
de diagnóstico verde/ámbar/rojo en su propia área del admin, cada una
calculando su estado a partir de datos reales del sitio (no datos
inventados):
- 🔥 **Firebase** — ámbar si `FIREBASE_CONFIG` todavía tiene los
  valores de plantilla (`TU_API_KEY`/`TU_PROYECTO`); si están puestos
  pero el sitio corre en modo local (`ES_LOCAL`), también ámbar
  (avisa que hace falta publicar para probar la conexión real); si
  están puestos y NO es local, verde — el solo hecho de estar
  autenticado ya prueba que Firebase respondió.
- ☁️ **Cloudinary** — ámbar/verde según si `cloudName`/`uploadPreset`
  siguen en plantilla.
- 🔐 **Autenticación** — ámbar si la sesión activa es
  `admin@demo.com` (o si es local); verde con cualquier otro correo.
- 💳 **PayPal** — ámbar si `configSitio.paypalLink` está vacío; verde
  si tiene un link.
- 🌐 **Modo actual** — informativo: ámbar en local, verde en línea.
- 📡 **Plataformas** — ámbar si no hay canales agregados; verde con
  el conteo y los nombres.
- Cada tarjeta ámbar/roja se puede tocar (`aria-expanded`) para
  desplegar el paso corto de resolución, resumido de
  `CONFIGURACION.md`. Las tarjetas verdes no tienen nada que
  desplegar.
- Se creó `js/centro-control.js` (nuevo módulo, sin CRUD propio — solo
  lee `getConfig()`, `getCanales()` y `getCurrentUser()`) y se agregó
  su `<script>` y su inicialización en `admin.html`/`admin.js`. El
  HTML de la sección (`css/admin-lcars.css` → `.lcars-grid-diagnostico`
  / `.lcars-tarjeta-diag`) ya venía preparado de una fase anterior,
  solo hacía falta la lógica.
- **Bug real encontrado y corregido** — ver caso #18 en
  `LECCIONES.md`: cambiar de pestaña en el panel nunca recargaba
  datos (cada área se inicializaba una sola vez al loguear), así que
  el Centro de Control no se enteraba de cambios hechos en Canales y
  contacto (ej. el link de PayPal) sin recargar la página completa.
  Se corrigió `admin.js` para que `inicializarAreaControl()` se
  vuelva a llamar cada vez que se entra a esa pestaña específica —
  las demás áreas (con su propio CRUD) no necesitan este patrón.
- `test_centro_control.py` cubre: las 6 tarjetas cargadas, colores
  correctos con los datos de demo (5 ámbar + Plataformas en verde por
  los 2 canales de ejemplo), expandir/cerrar el paso de resolución
  al tocar una tarjeta ámbar, que una tarjeta verde no tiene paso
  desplegable, que PayPal pasa a verde en vivo tras configurar el
  link desde Canales sin recargar la página, y sin desborde
  horizontal a 320px — todas verdes.

**La Fase 9 (Extras transversales) también quedó completa.** Open
Graph ya estaba hecho desde la Fase 4. Se agregó:
- `sitemap.xml` en la raíz — 15 URLs públicas (index, herramientas.html,
  descargables.html y las 12 páginas de herramientas). `admin.html` y
  `login.html` quedan fuera a propósito, no tiene sentido indexarlas.
  Si se agrega una herramienta nueva, hay que sumar su URL aquí a mano.
- Aviso de cookies + Google Analytics, ambos metidos en
  `js/comun-publico.js` (ya lo cargan las 15 páginas públicas, no hizo
  falta tocar cada HTML por separado). El aviso se inyecta solo por JS
  — banner fijo abajo con Aceptar/Rechazar, la decisión se guarda en
  `localStorage` (`pref-cookies`) y no se vuelve a preguntar. Google
  Analytics (`window.GA_MEASUREMENT_ID` en `config.js`, ver
  `CONFIGURACION.md` sección 5) solo se carga si: (a) el usuario aceptó,
  (b) el sitio NO está en modo local/demo (`ES_LOCAL`), y (c) el ID ya
  no tiene el valor de plantilla — mismo criterio que usa Centro de
  Control para Firebase/Cloudinary. Se sigue la regla ya acordada:
  Analytics externo para contar visitas, NUNCA Firestore.
- Estilos nuevos en `publico.css` (`.pub-aviso-cookies` y su variante
  responsive a 480px).
- **Bug real encontrado y corregido** — ver caso #19 en `LECCIONES.md`:
  una `const` (`CLAVE_PREFERENCIA`) se leía dentro de una función que
  se llamaba ANTES de que esa `const` se declarara más abajo en el
  mismo archivo — `ReferenceError` que tumbaba todo `comun-publico.js`
  apenas cargaba la página (el aviso de cookies nunca aparecía).
- `test_extras.py` cubre: `sitemap.xml` válido con las 15 URLs
  correctas y sin admin/login, el aviso aparece en la primera visita,
  aceptar lo cierra y guarda la preferencia, rechazar también, ninguna
  de las dos decisiones se vuelve a preguntar tras recargar, Analytics
  nunca se carga en modo local aunque se haya aceptado, y sin desborde
  horizontal a 320px con el aviso visible — todas verdes.

**Estado final: proyecto completo y cerrado.** Las 10 fases planificadas
en `RESUMEN-PORTAFOLIO.md` están hechas. Las 12 baterías de prueba
corrieron de punta a punta una última vez (Fase 10), cada una levantando
su propio servidor y cerrándolo al terminar (patrón de la sección 4) —
**todas en verde, código de salida 0**.

**Pendientes que quedan fuera del código** (no son tareas de
programación, las tiene que hacer Alcedo cuando corresponda — ver
`CONFIGURACION.md` y el checklist de contenido en
`RESUMEN-PORTAFOLIO.md`):
- Reemplazar `config.js` con las credenciales reales de Firebase y
  Cloudinary (hoy corre en modo demo local).
- Completar `window.GA_MEASUREMENT_ID` con el ID real de Analytics
  (ya construido y probado, pero no se activa solo hasta tener un ID
  real y el sitio publicado — ver Fase 9 arriba).
- Confirmar la activación del dominio `alcedomontero.do` en NIC.DO y
  conectarlo en Netlify.
- Contenido real: bio, proyectos, capturas, CV en PDF, link de PayPal.
- Publicar (`firebase deploy` + conectar Netlify) y correr las 12
  baterías una vez más contra el sitio publicado antes de compartirlo
  con clientes.

## 6. Convenciones a mantener sin excepción

- **Guardia de sesión:** siempre `onAuthChange()`, nunca
  `getCurrentUser()` suelto al cargar la página.
- **`FirebaseDB`/`LocalDB`:** el código de cada área (ej.

  `portafolio-admin.js`) llama siempre a `window.DB.loQueSea()` —
  nunca sabe ni le importa cuál de las dos implementaciones corre
  detrás. Boot.js decide cuál cargar según `env.js`.
- **`config.js`:** solo datos, nunca `import` ni `initializeApp()`.
- **Cada colección nueva** necesita su bloque `match` propio en
  `firestore.rules`.
- **`min-width: 0`** en cualquier hijo de flex/grid que deba encogerse
  en móvil.
- **Grids responsive:** `minmax(min(Npx, 100%), 1fr)`, nunca
  `minmax(Npx, 1fr)` a secas (ver lección #14).
- **Rutas dentro de scripts que cargan OTROS scripts** (como
  `boot.js`) deben construirse relativas al propio script
  (`document.currentScript.src`), nunca a mano asumiendo que la
  página está en la raíz — así es como se rompía cualquier página
  dentro de `herramientas/` hasta que se corrigió (ver lección #15).
  **Cualquier página nueva** en una subcarpeta debe probarse primero
  de forma aislada por si aparece este mismo patrón de bug en otro
  lado.
- **Librerías de terceros para las herramientas públicas:**
  vendorizarlas en `js/vendor/` (instalarlas con `npm install` y
  copiar el archivo del navegador) en vez de cargarlas por CDN — así
  funcionan igual en producción y en las pruebas locales, y no
  dependen de que un CDN externo esté disponible. Anotar la licencia
  en `js/vendor/CREDITOS.md`.
- **Dos identidades visuales separadas y no mezclarlas:** `publico.css`
  (oscuro elegante, tokens `--pub-*`) para `index.html` y las páginas
  públicas de herramientas/descargables; `admin-lcars.css` (LCARS,
  tokens `--lcars-*`) para `login.html`/`admin.html`.
- **Playwright antes de entregar cualquier archivo** — es la costumbre
  del usuario, se cumplió en todas las fases hechas y hay que seguir así.
- Anotar cualquier bug real que se encuentre (no de la prueba, del
  código) como un caso nuevo en `LECCIONES.md`, siguiendo el formato
  de los casos #11-#15.

## 7. Cómo confirmar que el traspaso de cuenta fue limpio

Antes de escribir cualquier código nuevo:
1. Descomprimir este paquete.
2. Correr las 12 baterías de prueba existentes (sección 4) — deben
   dar todas en verde.
3. Confirmarle al usuario que la lectura y las pruebas salieron bien.
4. El proyecto está cerrado (ver sección 5) — si hay una fase nueva
   por delante, seguirá anotada aquí.
