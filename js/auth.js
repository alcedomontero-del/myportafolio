/**
 * auth.js — lógica de login.html
 * ---------------------------------------------------------
 * Si ya hay sesión activa, salta directo a admin.html. Si no,
 * espera al envío del formulario. La guardia usa SIEMPRE
 * onAuthChange() (ver LECCIONES.md, caso #6 — "rebote del login").
 * ---------------------------------------------------------
 */
window.cuandoDBListo(function () {
  window.pintarBadgeModo("badge-modo");

  const form = document.getElementById("form-login");
  const errorBox = document.getElementById("login-error");
  const btnLogin = document.getElementById("btn-login");
  const arranque = document.getElementById("arranque");

  function irAlPanel() {
    arranque.hidden = false;
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 1100);
  }

  // Guardia: espera la confirmación real antes de decidir nada.
  window.DB.onAuthChange((user) => {
    if (user) irAlPanel();
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorBox.classList.remove("mostrar");
    errorBox.textContent = "";

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    btnLogin.disabled = true;
    btnLogin.textContent = "Verificando…";

    try {
      await window.DB.login(email, password);
      irAlPanel();
    } catch (error) {
      errorBox.textContent = error.message || "No se pudo iniciar sesión.";
      errorBox.classList.add("mostrar");
      btnLogin.disabled = false;
      btnLogin.textContent = "Entrar";
    }
  });
});
