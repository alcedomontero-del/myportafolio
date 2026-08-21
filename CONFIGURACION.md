# CONFIGURACION.md — Portafolio personal (alcedomontero.do)

Pasos específicos de este proyecto para conectar las cuentas reales.
El orden general está en `GUIA_INSTALACION.md` (plantilla) — esto es
solo lo particular de este sitio.

## 1. Firebase

1. Crear proyecto en console.firebase.google.com.
2. Activar **Firestore Database** (modo producción).
3. Activar **Authentication → Correo/contraseña**.
4. Crear manualmente el usuario admin real (tu correo real, NO
   `admin@demo.com`) en Authentication → Users → Add user.
5. Copiar el objeto `firebaseConfig` a `js/config.js` →
   `window.FIREBASE_CONFIG`.
6. Publicar `firestore.rules` (Firestore Database → Reglas → pegar el
   contenido de este mismo repo → Publicar).

## 2. Cloudinary

1. Crear cuenta en cloudinary.com.
2. Copiar el **Cloud Name** del Dashboard.
3. Settings → Upload → Upload presets → Add upload preset → modo
   **Unsigned** → copiar el nombre del preset.
4. Ambos van a `js/config.js` → `window.CLOUDINARY_CONFIG`.
5. **Importante para este proyecto:** el área Descargables sube PDFs
   reales (CV y apps propias) → Settings → Security → activar "Allow
   delivery of PDF and ZIP files" (ver LECCIONES.md, caso #9).

## 3. GitHub + Netlify

1. Subir esta carpeta a un repositorio nuevo en GitHub.
2. En Netlify → "Import an existing project" → conectar el
   repositorio. Build command: vacío. Publish directory: raíz (`/`).
3. El sitio queda publicado en `algo.netlify.app` mientras se activa
   el dominio propio.

## 4. Dominio propio — alcedomontero.do

Pendiente de aprobación de NIC.DO (ver checklist en
`RESUMEN-PORTAFOLIO.md`). Cuando esté activo:
1. Netlify → Domain settings → Add custom domain → `alcedomontero.do`.
2. Seguir las instrucciones de DNS que da Netlify (no requiere
   reconstruir nada del sitio).
3. Actualizar los perfiles de Fiverr/Workana con la nueva dirección si
   ya se había compartido el link `.netlify.app`.

## 5. Google Analytics

1. Crear propiedad en analytics.google.com.
2. Copiar el **ID de medición** (`G-XXXXXXXXXX`).
3. Pegarlo en `js/config.js` → `window.GA_MEASUREMENT_ID`.

## 6. PayPal

1. Confirmar el link `paypal.me/tuusuario`.
2. Pegarlo desde el propio panel admin → área "Canales y contacto" →
   campo PayPal (no se edita en código).
