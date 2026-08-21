/**
 * local-db.js — PORTAFOLIO
 * ---------------------------------------------------------
 * Simula Firebase Authentication + Firestore usando SOLO
 * localStorage. No hace ninguna llamada de red. Se carga
 * ÚNICAMENTE cuando env.js detecta ES_LOCAL = true.
 *
 * Colecciones de este proyecto (adaptadas desde la plantilla
 * genérica "elementos"):
 *   - proyectos     (área Portafolio)
 *   - categorias    (subsección de Portafolio — dinámicas, con emoji)
 *   - testimonios   (subsección de Portafolio)
 *   - herramientas  (área Herramientas — catálogo público, admin activa/ordena)
 *   - descargables  (área Descargables — incluye el CV)
 *   - canales       (área Canales y contacto — plataformas freelance)
 *   - configSitio   (documento único: PayPal, punto de estado)
 *
 * Credenciales de la cuenta de administrador de demostración:
 *   correo:    admin@demo.com
 *   contraseña: demo1234
 * ---------------------------------------------------------
 */
window.LocalDB = (function () {
  const PREFIJO = "portafolio_";
  const CLAVE_SESION = PREFIJO + "sesion";
  const CLAVE_CONFIG = PREFIJO + "config";
  const ADMIN_DEMO = { email: "admin@demo.com", password: "demo1234" };

  function retrasoFalso(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function generarId(prefijo) {
    return prefijo + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  }

  function leerArchivoComoBase64(archivo) {
    return new Promise((resolve, reject) => {
      if (!archivo) return resolve("");
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result);
      lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
      lector.readAsDataURL(archivo);
    });
  }

  // ---------- Fábrica de CRUD genérico por colección ----------
  // Cada colección real (proyectos, categorias, testimonios,
  // herramientas, descargables, canales) se arma con esta función,
  // pasando su propio prefijo de clave y sus datos de ejemplo.
  function crearColeccion(nombreClave, datosDeEjemplo) {
    const CLAVE = PREFIJO + nombreClave;

    function leer() {
      try {
        const crudo = localStorage.getItem(CLAVE);
        return crudo ? JSON.parse(crudo) : null;
      } catch (e) {
        return null;
      }
    }
    function guardar(lista) {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
    }
    function sembrar() {
      guardar(datosDeEjemplo);
      return datosDeEjemplo;
    }

    return {
      async obtenerTodos() {
        await retrasoFalso(250);
        let lista = leer();
        if (!lista) lista = sembrar();
        return [...lista].sort((a, b) => (b.orden ?? b.creadoEn) - (a.orden ?? a.creadoEn));
      },
      async agregar(datos, archivoOpcional) {
        await retrasoFalso(500);
        const lista = leer() || [];
        const archivoUrl = archivoOpcional ? await leerArchivoComoBase64(archivoOpcional) : (datos.imagenUrl || datos.archivoUrl || "");
        const nuevo = {
          id: generarId(nombreClave.slice(0, 3)),
          ...datos,
          ...(archivoOpcional ? (datos.archivoUrl !== undefined ? { archivoUrl } : { imagenUrl: archivoUrl }) : {}),
          creadoEn: Date.now(),
        };
        lista.push(nuevo);
        guardar(lista);
        return nuevo;
      },
      async actualizar(id, datos, archivoOpcional) {
        await retrasoFalso(500);
        const lista = leer() || [];
        const idx = lista.findIndex((e) => e.id === id);
        if (idx === -1) throw new Error("No encontrado en " + nombreClave);
        let cambios = { ...datos };
        if (archivoOpcional) {
          const archivoUrl = await leerArchivoComoBase64(archivoOpcional);
          if (datos.archivoUrl !== undefined) cambios.archivoUrl = archivoUrl;
          else cambios.imagenUrl = archivoUrl;
        }
        lista[idx] = { ...lista[idx], ...cambios };
        guardar(lista);
        return lista[idx];
      },
      async eliminar(id) {
        await retrasoFalso(300);
        const lista = leer() || [];
        guardar(lista.filter((e) => e.id !== id));
      },
      borrarDatosDeDemo() {
        localStorage.removeItem(CLAVE);
      },
    };
  }

  // ---------- Datos de ejemplo por colección ----------
  const proyectos = crearColeccion("proyectos", [
    {
      id: "pro-demo-1",
      titulo: "Sistema de reservas para spa",
      categoriaId: "cat-demo-1",
      imagenUrl: "",
      urlProyecto: "https://ejemplo.com/spa",
      necesidad: "El cliente perdía citas por confusiones de horario en WhatsApp.",
      quehice: "Construí un sistema de reservas online con confirmación automática.",
      resultado: "Redujo las citas perdidas en un 70% el primer mes.",
      destacado: true,
      creadoEn: Date.now() - 1000 * 60 * 60 * 24 * 3,
    },
    {
      id: "pro-demo-2",
      titulo: "Catálogo web para tienda de ropa",
      categoriaId: "cat-demo-2",
      imagenUrl: "",
      urlProyecto: "https://ejemplo.com/tienda",
      necesidad: "Vendían solo por Instagram, sin catálogo organizado.",
      quehice: "Diseñé y desarrollé un catálogo web con filtros por categoría.",
      resultado: "Duplicó las consultas por WhatsApp en dos semanas.",
      destacado: false,
      creadoEn: Date.now() - 1000 * 60 * 60 * 24,
    },
  ]);

  const categorias = crearColeccion("categorias", [
    { id: "cat-demo-1", nombre: "Sistemas web", emoji: "🖥️", creadoEn: Date.now() - 1000 },
    { id: "cat-demo-2", nombre: "E-commerce", emoji: "🛒", creadoEn: Date.now() },
  ]);

  const testimonios = crearColeccion("testimonios", [
    {
      id: "tes-demo-1",
      autor: "Cliente de ejemplo",
      cargo: "Dueño de negocio",
      texto: "Excelente trabajo, cumplió con todo lo acordado y a tiempo.",
      imagenUrl: "",
      creadoEn: Date.now(),
    },
  ]);

  const herramientas = crearColeccion("herramientas", [
    { id: "her-qr", nombre: "Generador de código QR", emoji: "🔳", slug: "qr", activa: true, orden: 12 },
    { id: "her-pass", nombre: "Generador de contraseñas seguras", emoji: "🔐", slug: "contrasenas", activa: true, orden: 11 },
    { id: "her-comp", nombre: "Compresor de imágenes", emoji: "🖼️", slug: "comprimir-imagen", activa: true, orden: 10 },
    { id: "her-crop", nombre: "Redimensionador/recortador de imágenes", emoji: "✂️", slug: "recortar-imagen", activa: true, orden: 9 },
    { id: "her-imgpdf", nombre: "Convertidor de imágenes a PDF", emoji: "📄", slug: "imagenes-a-pdf", activa: true, orden: 8 },
    { id: "her-pdfimg", nombre: "Convertidor de PDF a imágenes", emoji: "🖨️", slug: "pdf-a-imagenes", activa: true, orden: 7 },
    { id: "her-ocr", nombre: "Extractor de texto desde una imagen", emoji: "🔤", slug: "ocr", activa: true, orden: 6 },
    { id: "her-unid", nombre: "Convertidor de unidades y medidas", emoji: "📏", slug: "unidades", activa: true, orden: 5 },
    { id: "her-contador", nombre: "Contador de palabras y caracteres", emoji: "📝", slug: "contador-texto", activa: true, orden: 4 },
    { id: "her-paleta", nombre: "Paleta de colores", emoji: "🎨", slug: "paleta-colores", activa: true, orden: 3 },
    { id: "her-cv", nombre: "Creador de currículum (PDF)", emoji: "📋", slug: "creador-cv", activa: true, orden: 2 },
    { id: "her-diploma", nombre: "Creador de diplomas/certificados (PDF)", emoji: "🏅", slug: "creador-diploma", activa: true, orden: 1 },
  ]);

  const descargables = crearColeccion("descargables", [
    { id: "des-demo-1", nombre: "CV — Currículum", descripcion: "Mi currículum actualizado en PDF.", archivoUrl: "", esCV: true, creadoEn: Date.now() },
  ]);

  const canales = crearColeccion("canales", [
    { id: "can-demo-1", nombre: "Fiverr", urlPerfil: "https://fiverr.com/tuusuario", textoBoton: "Contáctame en Fiverr", parametro: "fiverr", creadoEn: Date.now() - 1000 },
    { id: "can-demo-2", nombre: "Workana", urlPerfil: "https://workana.com/tuusuario", textoBoton: "Contáctame en Workana", parametro: "workana", creadoEn: Date.now() },
  ]);

  // ---------- Configuración del sitio (documento único) ----------
  function leerConfig() {
    try {
      const crudo = localStorage.getItem(CLAVE_CONFIG);
      return crudo
        ? JSON.parse(crudo)
        : { paypalLink: "", mostrarPuntoEstado: true, sonidosLcars: false };
    } catch (e) {
      return { paypalLink: "", mostrarPuntoEstado: true, sonidosLcars: false };
    }
  }
  function guardarConfig(datos) {
    const actual = leerConfig();
    const nueva = { ...actual, ...datos };
    localStorage.setItem(CLAVE_CONFIG, JSON.stringify(nueva));
    return nueva;
  }

  return {
    // ---------- Autenticación ----------
    async login(email, password) {
      await retrasoFalso(400);
      if (email.trim().toLowerCase() === ADMIN_DEMO.email && password === ADMIN_DEMO.password) {
        const user = { email: ADMIN_DEMO.email, uid: "demo-admin" };
        localStorage.setItem(CLAVE_SESION, JSON.stringify(user));
        return user;
      }
      throw new Error("Correo o contraseña incorrectos (demo: admin@demo.com / demo1234)");
    },
    async logout() {
      await retrasoFalso(150);
      localStorage.removeItem(CLAVE_SESION);
    },
    getCurrentUser() {
      try {
        const crudo = localStorage.getItem(CLAVE_SESION);
        return crudo ? JSON.parse(crudo) : null;
      } catch (e) {
        return null;
      }
    },
    // Las guardias de sesión SIEMPRE usan esto, nunca getCurrentUser()
    // suelto al cargar la página — ver LECCIONES.md, caso #6.
    onAuthChange(callback) {
      callback(this.getCurrentUser());
      return () => {};
    },

    // ---------- Portafolio ----------
    getProyectos: proyectos.obtenerTodos,
    agregarProyecto: proyectos.agregar,
    actualizarProyecto: proyectos.actualizar,
    eliminarProyecto: proyectos.eliminar,

    getCategorias: categorias.obtenerTodos,
    agregarCategoria: categorias.agregar,
    actualizarCategoria: categorias.actualizar,
    eliminarCategoria: categorias.eliminar,

    getTestimonios: testimonios.obtenerTodos,
    agregarTestimonio: testimonios.agregar,
    actualizarTestimonio: testimonios.actualizar,
    eliminarTestimonio: testimonios.eliminar,

    // ---------- Herramientas ----------
    getHerramientas: herramientas.obtenerTodos,
    agregarHerramienta: herramientas.agregar,
    actualizarHerramienta: herramientas.actualizar,
    eliminarHerramienta: herramientas.eliminar,

    // ---------- Descargables ----------
    getDescargables: descargables.obtenerTodos,
    agregarDescargable: descargables.agregar,
    actualizarDescargable: descargables.actualizar,
    eliminarDescargable: descargables.eliminar,

    // ---------- Canales y contacto ----------
    getCanales: canales.obtenerTodos,
    agregarCanal: canales.agregar,
    actualizarCanal: canales.actualizar,
    eliminarCanal: canales.eliminar,

    // ---------- Configuración del sitio ----------
    async getConfig() {
      await retrasoFalso(150);
      return leerConfig();
    },
    async actualizarConfig(datos) {
      await retrasoFalso(300);
      return guardarConfig(datos);
    },

    // Reiniciar toda la demo desde la consola: LocalDB.borrarDatosDeDemo()
    borrarDatosDeDemo() {
      [proyectos, categorias, testimonios, herramientas, descargables, canales].forEach((c) =>
        c.borrarDatosDeDemo()
      );
      localStorage.removeItem(CLAVE_CONFIG);
      localStorage.removeItem(CLAVE_SESION);
      console.log("Datos de demostración borrados. Recarga la página.");
    },
  };
})();
