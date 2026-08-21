# Guía general de instalación

Esta es la guía "de cero" — se usa **una sola vez** para dejar tu
computadora lista, y después como checklist rápido cada vez que
arrancamos un proyecto nuevo. Es distinta a `CONFIGURACION.md`: esa es
específica de cada proyecto (con sus credenciales reales); esta es
general, sirve para todos.

---

## 1. Herramientas que necesitas instaladas (una sola vez)

| Herramienta | Para qué | Cómo conseguirla |
|---|---|---|
| **VS Code** | Editar el código | [code.visualstudio.com](https://code.visualstudio.com) |
| **Extensión "Live Server"** | Probar el modo local con recarga automática | Dentro de VS Code → ícono de extensiones → buscar "Live Server" → Install |
| **Node.js + npm** | Necesario para instalar Firebase CLI | [nodejs.org](https://nodejs.org) — instala la versión LTS |
| **Firebase CLI** | Desplegar manualmente (`firebase deploy`) | Terminal: `npm install -g firebase-tools` |
| **Git** | Control de versiones y conexión con GitHub | [git-scm.com](https://git-scm.com) |
| **Cuenta de GitHub** | Guardar el código y conectar con Netlify | [github.com](https://github.com) |
| **Cuenta de Netlify** | Hosting del sitio | [netlify.com](https://netlify.com) — puedes entrar directo con tu cuenta de GitHub |
| **Cuenta de Firebase** | Login + base de datos (si el proyecto lo necesita) | [console.firebase.google.com](https://console.firebase.google.com) — con tu cuenta de Google |
| **Cuenta de Cloudinary** | Guardar archivos/fotos/PDFs (si el proyecto lo necesita) | [cloudinary.com](https://cloudinary.com) |

Verifica que quedaron bien instaladas:
```
node -v
npm -v
git --version
firebase --version
```
Si los 4 comandos responden con un número de versión (y no "comando no
encontrado"), ya está todo listo.

---

## 2. Estructura estándar de un proyecto nuevo

```
nombre-del-proyecto/
├── index.html          (o la página pública que corresponda)
├── login.html           (si el proyecto tiene panel admin)
├── admin.html
├── css/
│   └── style.css
├── js/
│   ├── env.js            (genérico — detecta local vs producción)
│   ├── boot.js             (genérico — decide qué base de datos usar)
│   ├── ui.js                (genérico — badge de modo + notificaciones)
│   ├── config.js             (SOLO datos: credenciales de Firebase/Cloudinary)
│   ├── local-db.js            (modo demo — datos falsos en localStorage)
│   ├── firebase-real.js        (modo real — conexión a Firebase/Cloudinary)
│   └── [páginas específicas: auth.js, admin.js, etc.]
├── CONFIGURACION.md      (pasos específicos de ESTE proyecto)
└── LECCIONES.md / PROTOCOLO.md   (copiados aquí para tenerlos a la mano)
```

---

## 3. Primer arranque de cualquier proyecto nuevo

1. Abre la carpeta en VS Code.
2. Clic derecho sobre `index.html` → "Open with Live Server".
3. Confirma que aparece el aviso **"🧪 Modo demostración local"** — si
   sí sale, `env.js` y `boot.js` están funcionando bien desde el
   principio.
4. Prueba el flujo completo en modo local (login con las credenciales
   de demo, crear/editar/eliminar lo que corresponda) antes de tocar
   ninguna cuenta real.

---

## 4. Conectar las cuentas reales (solo si el proyecto las necesita)

Los pasos exactos con las credenciales de cada proyecto van en su
propio `CONFIGURACION.md` — pero el orden siempre es el mismo:

1. **Firebase** (si hay login o base de datos):
   Crear proyecto → Firestore → Authentication (Correo/contraseña) →
   crear el usuario admin manualmente → copiar `firebaseConfig` a
   `js/config.js` → publicar las reglas de seguridad.
2. **Cloudinary** (si hay subida de archivos):
   Crear cuenta → copiar Cloud Name → crear Upload Preset en modo
   *Unsigned* → copiar ambos a `js/config.js` → si el proyecto sube PDF
   o ZIP, activar "Allow delivery of PDF and ZIP files" en Settings →
   Security.
3. **GitHub + Netlify:**
   Subir la carpeta a un repositorio → conectar ese repositorio en
   Netlify ("Import an existing project") → build command vacío,
   publish directory en la raíz → Deploy.

---

## 5. Checklist antes de compartir el link con quien sea

- [ ] `js/config.js` tiene los valores reales, ningún `TU_...` sin
      reemplazar.
- [ ] Usuario administrador creado manualmente en Firebase
      Authentication (si aplica).
- [ ] Reglas de seguridad de Firestore publicadas (si aplica).
- [ ] Upload preset de Cloudinary en modo Unsigned, y "Allow delivery
      of PDF and ZIP files" activado si suben PDF/ZIP (si aplica).
- [ ] Probado el flujo completo desde la URL real de Netlify — no solo
      en local.
- [ ] Probado en un celular real o en el navegador angosto (320-375px)
      — no solo en la pantalla de la computadora.
- [ ] `LECCIONES.md` y `PROTOCOLO.md` están en la carpeta del proyecto,
      no solo en la conversación.

---

## Los 3 documentos, para qué sirve cada uno

- **Esta guía (`INSTALACION.md`)** — dejar la computadora lista, y el
  orden general de pasos para cualquier proyecto nuevo.
- **`CONFIGURACION.md`** (uno por proyecto) — las credenciales y pasos
  específicos de ese proyecto en particular.
- **`PROTOCOLO.md`** — cómo trabajamos juntos, qué asumo por defecto,
  cómo reportar errores rápido.
- **`LECCIONES.md`** — los bugs reales que ya nos encontramos, con su
  solución, para no repetir la misma investigación dos veces.
