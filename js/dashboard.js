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

  const rutas = {
    pendientes: {
      titulo: "Pedidos pendientes",
      html: "dashboard/pedidos-pendientes.html",
      js: "js-dashboard/pedidos-pendientes.js"
    },
    completados: {
      titulo: "Pedidos completados",
      html: "dashboard/pedidos-completados.html",
      js: "js-dashboard/pedidos-completados.js"
    },
    rechazados: {
      titulo: "Pedidos rechazados",
      html: "dashboard/pedidos-rechazados.html",
      js: "js-dashboard/pedidos-rechazados.js"
    }
  };

  const r = rutas[vista];
  if (!r) return;

  // título
  document.getElementById("titulo-vista").textContent = r.titulo;

  // cargar HTML
  const res = await fetch(r.html);
  document.getElementById("contenido").innerHTML = await res.text();

  // eliminar script anterior
  if (scriptActual) {
    scriptActual.remove();
    scriptActual = null;
  }

  // cargar JS nuevo
  scriptActual = document.createElement("script");
  scriptActual.src = r.js + "?v=" + Date.now();
  scriptActual.defer = true;
  document.body.appendChild(scriptActual);
}

// logout
function logout() {
  localStorage.clear();
  location.href = "login.html";
}

// inicial
(async () => {
  await esperarSupabase();
  cargarVista("pendientes");
})();


async function aprobarPedido(id) {
  const r = await Swal.fire({
    icon: "question",
    title: "Aprobar pedido",
    text: "El pedido pasará a completados",
    showCancelButton: true,
    confirmButtonText: "Aprobar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  // obtener pedido
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("*")
    .eq("id", id)
    .single();

  // insertar en completados
  await supabase.from("pedidos_completados").insert({
    ...pedido,
    completed_at: new Date().toISOString()
  });

  // eliminar de pendientes
  await supabase.from("pedidos").delete().eq("id", id);

  Swal.fire("Aprobado", "Pedido completado correctamente", "success");
  cargarVista("pendientes");
}


async function reconsiderarPedido(id) {
  const r = await Swal.fire({
    icon: "question",
    title: "Reconsiderar pedido",
    text: "El pedido volverá a pendientes",
    showCancelButton: true,
    confirmButtonText: "Sí, reconsiderar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  await supabase
    .from("pedidos")
    .update({ status: "pendiente" })
    .eq("id", id);

  Swal.fire("Listo", "Pedido enviado a pendientes", "success");
  cargarVista("rechazados");
}

async function rechazarPedido(id) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Rechazar pedido",
    text: "El pedido se moverá a rechazados",
    showCancelButton: true,
    confirmButtonText: "Rechazar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  await supabase
    .from("pedidos")
    .update({ status: "rechazado" })
    .eq("id", id);

  Swal.fire("Rechazado", "Pedido marcado como rechazado", "success");
  cargarVista("pendientes");
}


async function eliminarRechazado(id) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Eliminar pedido",
    text: "Se eliminará definitivamente",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  await supabase.from("pedidos").delete().eq("id", id);

  Swal.fire("Eliminado", "Pedido eliminado", "success");
  cargarVista("rechazados");
}
