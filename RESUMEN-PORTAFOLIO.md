# Portafolio personal — Resumen de planificación

Proyecto nuevo, mismo esquema base que Pet Shop / Portal de
Certificados (env.js + boot.js + local-db.js/firebase-real.js +
Cloudinary + Netlify + GitHub). Este documento reúne todo lo decidido
en la sesión de planificación, listo para construir en la próxima.

**Propósito del sitio:** portafolio personal para compartir en Fiverr,
Workana y plataformas freelance similares — mostrar trabajo real y
herramientas usables, no solo capturas de pantalla.

---

## Las 5 áreas del panel administrador

Todo dentro de **una sola página** (sin recargar al cambiar de área —
importante para no repetir el problema del "rebote del login": la
sesión se confirma una sola vez al entrar, cambiar de área es solo
mostrar/ocultar secciones con JS, nunca navegar a otra URL).

1. **📁 Portafolio** — proyectos con captura (Cloudinary), URL real,
   categoría, descripción. Categorías dinámicas con emoji (mismo
   patrón que Pet Shop). Incluye testimonios como subsección.
2. **🧰 Herramientas** — activar/organizar las herramientas públicas.
3. **📦 Descargables** — apps propias de uso libre para subir (área
   separada de Portafolio porque el flujo de admin es distinto: subir
   archivo real, no solo un link + captura). Incluye CV descargable.
4. **🔗 Canales y contacto** — plataformas freelance (ver sección
   aparte abajo), link de PayPal, interruptor del punto de estado.
5. **🎛️ Centro de Control** — tarjetas de diagnóstico (ver sección
   aparte abajo).

---

## Categoría "Herramientas" (públicas, para el visitante)

Regla acordada: **solo herramientas de usuario común, nada orientado a
programadores.** Y **solo lo que se pueda hacer gratis, 100% en el
navegador del visitante — nunca subiendo el archivo a ningún servidor**
(esto es también la respuesta a la preocupación de seguridad: como
nada se sube, no hay forma de que una herramienta afecte la base de
datos ni a otros visitantes).

Lista aprobada para la primera versión:
- 🔳 Generador de código QR
- 🔐 Generador de contraseñas seguras
- 🖼️ Compresor de imágenes
- ✂️ Redimensionador/recortador de imágenes
- 📄 Convertidor de imágenes a PDF
- 🖨️ Convertidor de PDF a imágenes
- 🔤 Extractor de texto desde una imagen
- 📏 Convertidor de unidades y medidas
- 📝 Contador de palabras y caracteres
- 🎨 Paleta de colores
- 📋 Creador de currículum (PDF) — 2-3 diseños para elegir
- 🏅 Creador de diplomas/certificados (PDF) — 2-3 diseños para elegir,
  con QR opcional que enlaza de vuelta al portafolio. Además:
    - **Firma visual** (subir foto de firma real) — es una firma
      *ilustrativa*, no una firma electrónica con validez legal. La
      herramienta debe dejarlo dicho claramente al usuario, para no
      generar una falsa expectativa legal.
    - **Personalización permitida al usuario:** subir su propio
      sello/logo, mover la posición de la firma, elegir tipo de letra
      del texto principal, ajustar tamaño del texto, elegir color de
      acento del diseño.

**Descartado a propósito:** conversión PDF↔Word "real" (con formato) —
requiere un servicio de pago (ej. CloudConvert) para hacerse bien.
Queda anotado como posible fase 2 si algún día se justifica el costo.

---

## Canales de contacto (Fiverr, Workana, futuras plataformas)

**Problema que resuelve:** un visitante que llega desde Workana nunca
debe ver un botón que lo mande a Fiverr (o viceversa) — podría
interpretarse como conflicto de interés por las plataformas.

**Solución:** cada plataforma se agrega desde el admin (nombre, URL de
perfil, texto del botón) — sin tocar código nunca. Cada plataforma
usa un link distinto hacia el portafolio con un parámetro
(`?de=fiverr`, `?de=workana`). La página lee ese parámetro y muestra
**solo** el botón de contacto de esa plataforma específica. Sin
parámetro (por ejemplo, si compartes el link por WhatsApp), no se
muestra ningún botón de plataforma — o un contacto neutral, a definir.

---

## Botón de PayPal (donaciones)

- Cuenta ya es Business — de todas formas, se usa el link simple
  `paypal.me/tuusuario` (más simple, mismo resultado).
- Se agrega desde el admin (área "Canales y contacto"), no fijo en el
  código.
- **Tratamiento visual acordado:** discreto — ícono pequeño en el pie
  de página o junto al contacto, nunca compitiendo en tamaño con el
  botón principal de "Contáctame".

---

## Punto de estado (público)

- Reemplaza al badge de texto grande ("Modo demostración local" /
  "Conectado en vivo") que sí tiene sentido en un panel de pruebas,
  pero no en un portafolio de cara a clientes.
- Punto pequeño, esquina superior derecha.
- Color 100% automático (verde = en línea, ámbar = local) — nunca se
  fuerza a mano, para que nunca "mienta" sobre el estado real.
- Información (texto) aparece al pasar el mouse/tocar, no siempre
  visible — mantiene la esquina limpia.
- Interruptor de mostrar/ocultar controlado desde el admin (área
  "Canales y contacto").

---

## Centro de Control (privado, solo admin)

Tarjetas de diagnóstico — cada una revisa una pieza de la
configuración y se pinta según el estado:
- 🟢 Verde = configurado y funcionando
- 🟡 Ámbar = falta terminar de configurar
- 🔴 Rojo = configurado pero fallando

Tarjetas acordadas:
| Tarjeta | Qué revisa |
|---|---|
| 🔥 Firebase | Credenciales reales puestas + conexión responde |
| ☁️ Cloudinary | Cloud Name + Upload Preset configurados |
| 🔐 Autenticación | Usuario admin real creado (no el de demo) |
| 💳 PayPal | Link real puesto o vacío |
| 🌐 Modo actual | Local / En línea (informativo) |
| 📡 Plataformas | Cuántos canales hay agregados |

**Extra aprobado:** cada tarjeta ámbar/roja, al tocarla, muestra el
paso corto para resolverlo (resumen sacado de `CONFIGURACION.md`).

---

## Extras aprobados (fuera de las 5 áreas)

1. **Etiquetas Open Graph** — para que el link se vea con imagen y
   descripción al compartirlo en Fiverr/Workana/WhatsApp. Se incluye
   por defecto, sin necesitar configuración desde el admin.
2. **Testimonios** — capturas de reseñas reales, como subsección de
   Portafolio.
3. **Contador de visitas — con Plausible o Google Analytics**, NUNCA
   con Firebase/Firestore. Razón de seguridad: contar visitas
   requeriría que cualquier visitante pudiera escribir en la base de
   datos, rompiendo la regla de "solo el admin escribe, todos los
   demás solo leen". Analytics externo logra lo mismo sin abrir esa
   puerta.
4. **CV descargable** — dentro del área de Descargables.

---

## Dirección de diseño visual (nueva — reemplaza el esquema del pet shop)

**Decisión importante:** el pet shop se usa solo como referencia
**funcional/arquitectónica** (patrón de código, estructura de
archivos), no como referencia visual. Este portafolio tiene su propia
identidad, pensada específicamente para él.

**Cara pública (portafolio, herramientas, descargables):**
- Profesional, limpio, creíble ante un cliente de Fiverr/Workana que
  no te conoce todavía.
- Sin elementos juguetones tipo pet shop — esta es la carta de
  presentación, no el lugar para experimentar visualmente.

**Login + Panel admin (solo lo ves tú):**
- Estética **LCARS** (la interfaz de las naves en Star Trek: The Next
  Generation) — "visión antigua del futuro": paneles curvos de colores
  sólidos (naranja, púrpura, azul, rosa) sobre fondo negro, tipografía
  gruesa en mayúsculas, bloques geométricos, botones tipo píldora
  alargada, divisores en curva/forma de "L".
- Le da personalidad fuerte a tu "cabina de mando" personal sin
  arriesgar la primera impresión del visitante público.
- Mismo principio que las mascotas del pet shop (firma visual
  memorable, no plantilla genérica) pero con identidad propia de este
  proyecto.

**Aportaciones adicionales — todas aprobadas:**
1. El Centro de Control (tarjetas de diagnóstico verde/ámbar/rojo) es
   el lugar natural donde la estética LCARS encaja mejor — casi sin
   esfuerzo extra, porque LCARS en la serie ya es una interfaz de
   estado de sistemas.
2. LCARS como "marco" (navegación, encabezados, botones, tarjetas de
   estado) — pero los campos de formulario (donde se escribe texto
   real) se mantienen limpios y legibles por dentro, para no
   sacrificar comodidad de uso diario.
3. Animación breve tipo "encendiendo sistemas" al pasar de `login.html`
   al panel — refuerza la transición hacia la "cabina de mando".
4. Sonidos tipo "bip" de LCARS — **apagados por defecto**, con opción
   de encenderlos (para no sorprender feo la primera vez).
5. Cara pública: considerar modo oscuro elegante y minimalista (no
   LCARS, pero sí oscuro) — conecta mejor con clientes técnicos que un
   diseño muy claro/corporativo. Definir en la sesión de diseño.
6. Cada proyecto del portafolio como mini caso de estudio: "Qué
   necesitaba el cliente → qué hice → resultado", en vez de solo
   captura + link + descripción de una línea.

---



- **Dominio propio vs `.netlify.app`** — a decidir (ver checklist).
  Para un portafolio de cara a clientes desconocidos, un dominio propio
  se ve más profesional. No obligatorio, sí recomendado.
- **OCR (extractor de texto desde imagen) usa una librería pesada**
  (Tesseract.js) — debe cargarse solo cuando el visitante abre esa
  herramienta específica, no junto con el resto de la página.
- **SEO básico** — título y descripción bien escritos por página,
  `sitemap.xml` simple. Distinto de Open Graph (que solo resuelve cómo
  se ve el link al compartirlo, no que te encuentren en Google).
- **Cookies y GDPR** — como se usará Google Analytics (ya decidido),
  técnicamente se recomienda un aviso de cookies para visitantes de
  Europa, por la ley GDPR. No es obligatorio para un portafolio
  pequeño, pero es buena práctica agregar un aviso simple.
- **Estados vacíos y de carga** — diseñar qué se ve mientras carga, y
  qué se ve si todavía no hay proyectos/herramientas cargadas — no
  solo el caso con todo ya lleno.

---

## Checklist de contenido — preparar ANTES de la próxima sesión

Para no perder tiempo de construcción esperando contenido:

- [ ] Texto de "Sobre mí" / bio.
- [ ] Lista de 3-6 proyectos reales para el portafolio inicial (con
      sus URLs).
- [ ] Capturas de pantalla de esos proyectos (o se toman juntos en la
      sesión).
- [ ] Link de `paypal.me`.
- [x] Decisión: dominio propio — **alcedomontero.do**, obtenido gratis
      vía beneficio del programa Talento Digital (INDOTEL) + NIC.DO.
      Estado: cuenta creada en midominio.do, dominio agregado al
      carrito, solicitud de activación enviada a info@nic.do (con el
      certificado del curso adjunto como prueba). Pendiente
      confirmación de NIC.DO — si no hay respuesta, dar seguimiento por
      correo y luego por teléfono (1 809 535-0111 ext. 2052/2055).
      Una vez activo: conectar el DNS hacia Netlify (esto se hace
      cuando el sitio ya esté construido, no antes).

      **Mientras tanto:** el sitio arranca y se publica con el
      subdominio gratuito de Netlify (ej. `alcedomontero.netlify.app`)
      — no se espera la aprobación del `.do` para avanzar. Cuando NIC.DO
      apruebe el dominio, solo se conecta en la configuración de
      Netlify (no requiere reconstruir nada). Recordatorio: actualizar
      los perfiles de Fiverr/Workana con la nueva dirección `.do` una
      vez esté activo, si ya se compartió el link `.netlify.app` antes.
- [x] Decisión: **Google Analytics** (gratis, confirmado — reemplaza a
      Plausible en la planificación anterior).
- [ ] CV en PDF, si se va a usar el botón de descarga.

---

## Pendiente para la próxima sesión

- Diseño visual definitivo (paleta, tipografía) para ambos sistemas:
  el profesional/oscuro de la cara pública, y el LCARS del admin.
- Construcción completa, con las mismas pruebas automatizadas de
  siempre antes de entregar.
