/**
 * config.js — PORTAFOLIO
 * ---------------------------------------------------------
 * ÚNICO archivo que se edita para conectar el proyecto a las
 * cuentas REALES de Firebase y Cloudinary.
 *
 * REGLA QUE NUNCA HAY QUE ROMPER (ver LECCIONES.md, caso #7):
 *   Este archivo SOLO guarda datos. Nunca debe tener `import`
 *   ni llamar a `initializeApp()` — eso vive en firebase-real.js,
 *   una sola vez.
 *
 * Mientras la página corre en local (localhost o archivo), estos
 * valores se ignoran por completo y se usa local-db.js.
 * ---------------------------------------------------------
 */

window.FIREBASE_CONFIG = {

   apiKey: "AIzaSyChV-F-7Y36-5-iFcPi6GV3zUqe9wWFAVE",
  authDomain: "myportafolio2.firebaseapp.com",
  projectId: "myportafolio2",
  storageBucket: "myportafolio2.firebasestorage.app",
  messagingSenderId: "505442840848",
  appId: "1:505442840848:web:f4dfec2518a42804667595",
  measurementId: "G-CH5CPGMWSV"

};

window.CLOUDINARY_CONFIG = {
  // Lo encuentras en el Dashboard de Cloudinary, arriba a la izquierda
  cloudName: "kv4gbmx0",
  // Settings → Upload → Upload presets → Add upload preset → Unsigned
  uploadPreset: "myportafolio",
};

// Google Analytics — completar cuando se conecte (ver RESUMEN-PORTAFOLIO.md).
// Se usa Analytics, nunca Firestore, para contar visitas (regla de
// seguridad: solo el admin escribe en la base de datos).
window.GA_MEASUREMENT_ID = "TU_G-QWX14LMC7X"; // ej. "G-XXXXXXXXXX"
