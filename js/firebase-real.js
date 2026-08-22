/**
 * firebase-real.js — PORTAFOLIO
 * ---------------------------------------------------------
 * Conexión REAL a Firebase (Authentication + Firestore) y a
 * Cloudinary. Se carga como módulo SOLO cuando env.js detecta
 * que la página ya no está en local (ver boot.js). Antes de que
 * esto funcione, completa config.js con tus credenciales reales.
 *
 * REGLAS QUE NUNCA HAY QUE ROMPER (ver LECCIONES.md):
 *   - Este archivo expone window.FirebaseDB — NUNCA window.DB
 *     directo (eso lo arma boot.js).
 *   - config.js solo guarda datos — el initializeApp() vive
 *     aquí, una sola vez, y en ningún otro archivo.
 *   - Nunca se pone como <script> directo en el HTML — lo carga
 *     boot.js dinámicamente (ver LECCIONES.md, caso #3).
 *
 * Colecciones de este proyecto — cada una necesita su propio
 * bloque `match` en las reglas de seguridad de Firestore
 * (ver LECCIONES.md, caso #5):
 *   proyectos, categorias, testimonios, herramientas,
 *   descargables, canales, configuracion (documento único)
 * ---------------------------------------------------------
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const app = initializeApp(window.FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app,"default");

async function subirArchivoCloudinary(archivo) {
  if (!archivo) return "";
  const { cloudName, uploadPreset } = window.CLOUDINARY_CONFIG;
  const formData = new FormData();
  formData.append("file", archivo);
  formData.append("upload_preset", uploadPreset);

  const respuesta = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!respuesta.ok) {
    throw new Error("No se pudo subir el archivo a Cloudinary. Revisa tu cloudName y upload preset en config.js");
  }
  const datos = await respuesta.json();
  return datos.secure_url;
}

// ---------- Fábrica de CRUD genérico por colección de Firestore ----------
function crearColeccion(nombreColeccion, campoArchivo) {
  // campoArchivo: "imagenUrl" (portafolio/testimonios) o "archivoUrl"
  // (descargables) o null si esa colección no sube archivos.
  return {
    async obtenerTodos() {
      // OJO: antes esto usaba orderBy("creadoEn", "desc") directo en la
      // consulta de Firestore. Problema real: Firestore EXCLUYE de los
      // resultados cualquier documento que no tenga el campo usado en
      // orderBy — y la colección "herramientas" se ordena por "orden",
      // no por "creadoEn" (igual que local-db.js). Cualquier herramienta
      // sin "creadoEn" desaparecía en silencio, aunque existiera en la
      // base de datos. Ahora se leen todos los documentos sin orderBy y
      // se ordena en el navegador exactamente igual que local-db.js.
      const snap = await getDocs(collection(db, nombreColeccion));
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return items.sort((a, b) => (b.orden ?? b.creadoEn ?? 0) - (a.orden ?? a.creadoEn ?? 0));
    },
    async agregar(datos, archivoOpcional) {
      const cambios = { ...datos };
      if (campoArchivo && archivoOpcional) {
        cambios[campoArchivo] = await subirArchivoCloudinary(archivoOpcional);
      }
      const nuevo = { ...cambios, creadoEn: Date.now() };
      const ref = await addDoc(collection(db, nombreColeccion), nuevo);
      return { id: ref.id, ...nuevo };
    },
    async actualizar(id, datos, archivoOpcional) {
      const cambios = { ...datos };
      if (campoArchivo && archivoOpcional) {
        cambios[campoArchivo] = await subirArchivoCloudinary(archivoOpcional);
      }
      await updateDoc(doc(db, nombreColeccion, id), cambios);
      return { id, ...cambios };
    },
    async eliminar(id) {
      await deleteDoc(doc(db, nombreColeccion, id));
    },
  };
}

const proyectos = crearColeccion("proyectos", "imagenUrl");
const categorias = crearColeccion("categorias", null);
const testimonios = crearColeccion("testimonios", "imagenUrl");
const herramientas = crearColeccion("herramientas", null);
const descargables = crearColeccion("descargables", "archivoUrl");
const canales = crearColeccion("canales", null);

const CONFIG_DOC = doc(db, "configuracion", "sitio");

window.FirebaseDB = {
  // ---------- Autenticación ----------
  async login(email, password) {
    const credencial = await signInWithEmailAndPassword(auth, email, password);
    return credencial.user;
  },
  async logout() {
    await signOut(auth);
  },
  getCurrentUser() {
    return auth.currentUser;
  },
  // Las guardias de sesión SIEMPRE usan esto, nunca getCurrentUser()
  // suelto al cargar la página — ver LECCIONES.md, caso #6.
  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
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

  // ---------- Configuración del sitio (documento único) ----------
  async getConfig() {
    const snap = await getDoc(CONFIG_DOC);
    return snap.exists()
      ? snap.data()
      : { paypalLink: "", mostrarPuntoEstado: true, sonidosLcars: false };
  },
  async actualizarConfig(datos) {
    await setDoc(CONFIG_DOC, datos, { merge: true });
    return this.getConfig();
  },
};
