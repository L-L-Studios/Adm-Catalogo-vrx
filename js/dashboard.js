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
    pendientes: {
      titulo: "Pedidos pendientes",
      html: "dashboard/pedidos-pendientes.html",
      js: "js-dashboard/pedidos-pendientes.js"
    },
    personalizados: {
      titulo: "Pedidos personalizados",
      html: "dashboard/pedidos-personalizados.html",
      js: "js-dashboard/pedidos-personalizados.js"
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
  location.href = "/";
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
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#28a745",
    cancelButtonColor: "#6c757d"
  });

  if (!r.isConfirmed) return;

  // Obtener pedido desde pedidos_camisas
  const { data: pedido, error: fetchError } = await supabase
    .from("pedidos_camisas")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    Swal.fire("Error", "No se encontró el pedido", "error");
    console.error(fetchError);
    return;
  }

  // Insertar en completados
  const { error: insertError } = await supabase.from("pedidos_completados").insert({
    nombre: pedido.nombre,
    email: pedido.email,
    direccion: pedido.direccion,
    whatsapp: pedido.whatsapp,
    metodo_pago: pedido.metodo_pago,
    camisas: pedido.camisas, // JSON
    total: pedido.total,
    estado: 'completado',
    costo_extra: pedido.costo_extra,
    created_at: pedido.created_at,
    completed_at: new Date().toISOString(),
    tipo_pedido: 'nuevos'
  });

  if (insertError) {
    Swal.fire("Error", "No se pudo completar el pedido", "error");
    console.error(insertError);
    return;
  }

  // Eliminar de pendientes
  await supabase.from("pedidos_camisas").delete().eq("id", id);

  Swal.fire({
    icon: "success",
    title: "¡Aprobado!",
    text: "Pedido movido a completados",
    timer: 2000,
    showConfirmButton: false
  });
  
  // Recargar la vista actual
  cargarVista('pendientes');
}

async function rechazarPedido(id) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Rechazar pedido",
    text: "El pedido se moverá a rechazados",
    showCancelButton: true,
    confirmButtonText: "Rechazar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d"
  });

  if (!r.isConfirmed) return;

  // Obtener pedido
  const { data: pedido, error: fetchError } = await supabase
    .from("pedidos_camisas")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    Swal.fire("Error", "No se encontró el pedido", "error");
    console.error(fetchError);
    return;
  }

  // Insertar en rechazados
  const { error: insertError } = await supabase.from("pedidos_rechazados").insert({
    nombre: pedido.nombre,
    email: pedido.email,
    direccion: pedido.direccion,
    whatsapp: pedido.whatsapp,
    metodo_pago: pedido.metodo_pago,
    camisas: pedido.camisas, // JSON
    total: pedido.total,
    estado: 'rechazado',
    costo_extra: pedido.costo_extra,
    created_at: pedido.created_at,
    rejected_at: new Date().toISOString(),
    tipo_pedido: 'nuevos'
  });

  if (insertError) {
    Swal.fire("Error", "No se pudo rechazar el pedido", "error");
    console.error(insertError);
    return;
  }

  // Eliminar de pendientes
  await supabase.from("pedidos_camisas").delete().eq("id", id);

  Swal.fire({
    icon: "success",
    title: "¡Rechazado!",
    text: "Pedido movido a rechazados",
    timer: 2000,
    showConfirmButton: false
  });
  
  // Recargar la vista actual
  cargarVista('pendientes');
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
    .from("pedidos_camisas")
    .update({ status: "pendiente" })
    .eq("id", id);

  Swal.fire("Listo", "Pedido enviado a pendientes", "success");
  cargarVista("rechazados");
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

  await supabase.from("pedidos_camisas").delete().eq("id", id);

  Swal.fire("Eliminado", "Pedido eliminado", "success");
  cargarVista("rechazados");
}

/* marcar en sidebar */
function marcarActivo(nombre) {
  document
    .querySelectorAll(".aside-sidebar .nav-link")
    .forEach(btn => btn.classList.remove("active"));

  document
    .querySelector(`[onclick="cargarVista('${nombre}')"]`)
    ?.classList.add("active");
}