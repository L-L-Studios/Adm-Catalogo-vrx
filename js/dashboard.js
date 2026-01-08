// 🔐 PROTECCIÓN
if (!localStorage.getItem("admin_logged")) {
  location.href = "login.html";
}

// nombre admin
document.getElementById("admin-name").textContent =
  localStorage.getItem("admin_user") || "Administrador";

// esperar supabase
function esperarSupabase() {
  return new Promise(resolve => {
    const i = setInterval(() => {
      if (window.supabase) {
        clearInterval(i);
        resolve();
      }
    }, 100);
  });
}

let scriptActual = null;

// cargar vista
async function cargarVista(vista) {
  marcarActivo(vista);

  const rutas = {
    //pendientes
    pendientes: {
      titulo: "Pedidos pendientes",
      html: "dashboard/pedidos-pendientes.html",
      js: "js-dashboard/pedidos-pendientes.js"
    },

    completados: {
      titulo: "Pedidos aprobados",
      html: "dashboard/pedidos-aprobados.html",
      js: "js-dashboard/pedidos-aprobados.js"
    },
    rechazados: {
      titulo: "Pedidos rechazados",
      html: "dashboard/pedidos-rechazados.html",
      js: "js-dashboard/pedidos-rechazados.js"
    },

    //personalizados
    personalizados: {
      titulo: "Pedidos personalizados",
      html: "dashboard/pedidos-personalizados.html",
      js: "js-dashboard/pedidos-personalizados.js"
    },

    personalizadosAprobados: {
      titulo: "Personalizados Aprobados",
      html: "dashboard/personalizados-aprobados.html",
      js: "js-dashboard/personalizados-aprobados.js"
    },
    
    personalizadosRechazados: {
      titulo: "Personalizados Rechazados",
      html: "dashboard/personalizados-rechazados.html",
      js: "js-dashboard/personalizados-rechazados.js"
    }
  };

  const r = rutas[vista];
  if (!r) return;

  // título
  document.getElementById("titulo-vista").textContent = r.titulo;

  // cargar HTML
  const res = await fetch(r.html);
  document.getElementById("contenido").innerHTML = await res.text();

  // IMPORTANTE: No eliminar scripts globales de dash-modal.js
  // Solo eliminar scripts específicos de vista que no sean dash-modal.js
  if (scriptActual && scriptActual.src.includes(vista)) {
    scriptActual.remove();
    scriptActual = null;
  }

  // Esperar a que el contenido HTML se cargue antes de ejecutar JS
  setTimeout(() => {
    // cargar JS nuevo
    scriptActual = document.createElement("script");
    scriptActual.src = r.js + "?v=" + Date.now();
    scriptActual.defer = true;
    document.body.appendChild(scriptActual);
  }, 100);
}

// logout
function logout() {
  localStorage.clear();
  location.href = "/";
}

// inicial
(async () => {
  await esperarSupabase();
  // Verificar que las funciones globales existen
  console.log("Funciones globales disponibles:");
  console.log("- verPedido:", typeof window.verPedido);
  console.log("- rechazarPedido:", typeof window.rechazarPedido);
  console.log("- mostrarFormularioAprobacion:", typeof window.mostrarFormularioAprobacion);
  
  cargarVista("pendientes");
})();

/* marcar en sidebar */
function marcarActivo(nombre) {
  document
    .querySelectorAll(".aside-sidebar .nav-link")
    .forEach(btn => btn.classList.remove("active"));

  document
    .querySelector(`[onclick="cargarVista('${nombre}')"]`)
    ?.classList.add("active");
}

// Hacer cargarVista global
window.cargarVista = cargarVista;