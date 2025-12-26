const input = document.getElementById("input-pass");
const icon = document.getElementById("input-icon");

icon.addEventListener("click", () => {
  if (input.type === "password") {
    input.type = "text";
    icon.classList.replace("ph-eye", "ph-eye-slash");
  } else {
    input.type = "password";
    icon.classList.replace("ph-eye-slash", "ph-eye");
  }
});

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/* Sweetalert2 */
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  customClass: {
    popup: "swal-toast-avenir"
  }
});

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const usuario = document.getElementById("input-user").value.trim();
  const password = document.getElementById("input-pass").value;

  if (!usuario || !password) {
    Toast.fire({
      icon: "warning",
      title: "Ingresa usuario y contraseña"
    });
    return;
  }

  const passwordHash = await hashPassword(password);

  const { data, error } = await window.supabase
    .from("usuarios")
    .select("password_hash")
    .eq("usuario", usuario)
    .single();

  if (error || !data) {
    Toast.fire({
      icon: "error",
      title: "Usuario no encontrado"
    });
    return;
  }

  if (data.password_hash !== passwordHash) {
    Toast.fire({
      icon: "error",
      title: "Contraseña incorrecta"
    });
    return;
  }

  // ✅ LOGIN CORRECTO
  Toast.fire({
    icon: "success",
    title: "Bienvenido 👋"
  });

    localStorage.setItem("admin_logged", "true");
    localStorage.setItem("admin_user", usuario);


  // Redirección suave
  setTimeout(() => {
    location.href = "dashboard-catalogo.html";
  }, 1500);
});
