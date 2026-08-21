/**
 * ui.js — pequeñas utilidades visuales compartidas por las 3 páginas
 */

window.pintarBadgeModo = function (contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;
  if (window.ES_LOCAL) {
    contenedor.innerHTML =
      '<span class="mode-badge local"><span class="dot"></span>🧪 Modo demostración local — nada de esto está en internet</span>';
  } else {
    contenedor.innerHTML =
      '<span class="mode-badge live"><span class="dot"></span>🟢 Conectado en vivo (Firebase + Cloudinary)</span>';
  }
};

window.mostrarToast = function (mensaje, tipo) {
  let toast = document.getElementById("toast-global");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast-global";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = mensaje;
  toast.className = "toast show" + (tipo === "error" ? " error" : "");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3200);
};
