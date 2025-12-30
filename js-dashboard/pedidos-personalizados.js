(async function () {

  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-personalizados");

  async function cargarPersonalizados(filtro = "") {

    let query = supabase
      .from("pedidos_personalizados")
      .select("*")
      .eq("status", "pendiente")
      .order("created_at", { ascending: false });

    if (filtro.trim() !== "") {
      query = query.or(
        `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%`
      );
    }

    const { data, error } = await query;

    if (error) return console.error(error);

    const tbody = document.getElementById("tabla-personalizados");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            No hay pedidos personalizados pendientes
          </td>
        </tr>`;
      return;
    }

    data.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.id}</td>
          <td>${p.nombre}</td>
          <td>${p.email}</td>
          <td>${p.mensaje.substring(0, 50)}${p.mensaje.length > 50 ? '...' : ''}</td>
          <td>
            <span class="badge bg-warning">${p.status}</span>
          </td>
          <td>${new Date(p.created_at).toLocaleDateString()}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary" onclick="verPedidoPersonalizado('${p.id}')">Ver</button>
            <button class="btn btn-sm btn-success" onclick="aprobarPedidoPersonalizado('${p.id}')">Aprobar</button>
            <button class="btn btn-sm btn-danger" onclick="rechazarPedidoPersonalizado('${p.id}')">Rechazar</button>
          </td>
        </tr>`;
    });
  }

  if (input) {
    input.addEventListener("input", e => cargarPersonalizados(e.target.value));
  }

  cargarPersonalizados();

})();

// Función específica para ver pedidos personalizados
window.verPedidoPersonalizado = async function(id) {
  const { data: pedido } = await supabase
    .from("pedidos_personalizados")
    .select("*")
    .eq("id", id)
    .single();

  const modal = new bootstrap.Modal(document.getElementById('modalPedido'));
  
  document.getElementById('pedido-info').innerHTML = `
    <h6>Cliente</h6>
    <p><strong>Nombre:</strong> ${pedido.nombre}</p>
    <p><strong>Email:</strong> ${pedido.email}</p>
    <p><strong>Status:</strong> ${pedido.status}</p>
    <p><strong>Fecha:</strong> ${new Date(pedido.created_at).toLocaleString()}</p>
    
    <h6 class="mt-3">Mensaje del Cliente</h6>
    <div class="border p-3 rounded bg-light">
      ${pedido.mensaje}
    </div>
  `;
  
  document.getElementById('pedido-camisas').innerHTML = `
    <div class="col-12">
      <div class="alert alert-info">
        <i class="ph ph-info"></i> Este es un pedido personalizado/solicitud de contacto.
      </div>
    </div>
  `;
  
  modal.show();
};

// Función específica para aprobar pedidos personalizados
window.aprobarPedidoPersonalizado = async function(id) {
  const r = await Swal.fire({
    icon: "question",
    title: "Aprobar pedido personalizado",
    text: "¿Marcar como completado?",
    showCancelButton: true,
    confirmButtonText: "Sí, completar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  // Obtener pedido personalizado
  const { data: pedido } = await supabase
    .from("pedidos_personalizados")
    .select("*")
    .eq("id", id)
    .single();

  // Insertar en completados con tipo 'personalizados'
  const { error } = await supabase.from("pedidos_completados").insert({
    id: pedido.id,
    nombre: pedido.nombre,
    email: pedido.email,
    mensaje: pedido.mensaje,
    tipo_pedido: 'personalizados',
    total: 0, // Los personalizados no tienen total
    created_at: pedido.created_at,
    completed_at: new Date().toISOString()
  });

  if (error) {
    Swal.fire("Error", "No se pudo completar el pedido", "error");
    return;
  }

  // Eliminar de personalizados pendientes
  await supabase.from("pedidos_personalizados").delete().eq("id", id);

  Swal.fire("Completado", "Pedido personalizado marcado como completado", "success");
  
  // Recargar la vista actual
  const vistaActual = document.getElementById('titulo-vista').textContent;
  if (vistaActual.includes('personalizados')) {
    cargarVista('personalizados');
  }
};

// Función específica para rechazar pedidos personalizados
window.rechazarPedidoPersonalizado = async function(id) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Rechazar pedido personalizado",
    text: "¿Mover a rechazados?",
    showCancelButton: true,
    confirmButtonText: "Sí, rechazar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  // Obtener pedido personalizado
  const { data: pedido } = await supabase
    .from("pedidos_personalizados")
    .select("*")
    .eq("id", id)
    .single();

  // Insertar en rechazados con tipo 'personalizados'
  const { error } = await supabase.from("pedidos_rechazados").insert({
    id: pedido.id,
    nombre: pedido.nombre,
    email: pedido.email,
    mensaje: pedido.mensaje,
    tipo_pedido: 'personalizados',
    total: 0, // Los personalizados no tienen total
    created_at: pedido.created_at,
    rejected_at: new Date().toISOString()
  });

  if (error) {
    Swal.fire("Error", "No se pudo rechazar el pedido", "error");
    return;
  }

  // Eliminar de personalizados pendientes
  await supabase.from("pedidos_personalizados").delete().eq("id", id);

  Swal.fire("Rechazado", "Pedido personalizado movido a rechazados", "success");
  
  // Recargar la vista actual
  const vistaActual = document.getElementById('titulo-vista').textContent;
  if (vistaActual.includes('personalizados')) {
    cargarVista('personalizados');
  }
};
