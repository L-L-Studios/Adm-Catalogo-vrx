(async function () {

  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-rechazados");

  async function cargarRechazados(filtro = "") {

    let query = supabase
      .from("pedidos_rechazados")
      .select("*")
      .order("rejected_at", { ascending: false });

    if (filtro.trim() !== "") {
      query = query.or(
        `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%`
      );
    }

    const { data, error } = await query;

    if (error) return console.error(error);

    const tbody = document.getElementById("tabla-rechazados");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-muted py-4">
            No hay pedidos rechazados
          </td>
        </tr>`;
      return;
    }

    data.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.email}</td>
          <td>$${Number(p.total || 0).toFixed(2)}</td>
          <td>
            <span class="badge ${p.tipo_pedido === 'nuevos' ? 'bg-primary' : 'bg-info'}">
              ${p.tipo_pedido === 'nuevos' ? 'Nuevo' : 'Personalizado'}
            </span>
          </td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary" onclick="verPedidoRechazado('${p.id}')">Ver</button>
            <button class="btn btn-sm btn-warning" onclick="reconsiderarPedido('${p.id}')">Reconsiderar</button>
            <button class="btn btn-sm btn-danger" onclick="eliminarRechazado('${p.id}')">Eliminar</button>
          </td>
        </tr>`;
    });
  }

  if (input) {
    input.addEventListener("input", e => cargarRechazados(e.target.value));
  }

  cargarRechazados();

})();

window.verPedidoRechazado = async function(id) {
  const { data: pedido } = await supabase
    .from("pedidos_rechazados")
    .select("*")
    .eq("id", id)
    .single();

  const modal = new bootstrap.Modal(document.getElementById('modalPedido'));
  
  let infoHTML = `
    <h6>Cliente</h6>
    <p><strong>Nombre:</strong> ${pedido.nombre}</p>
    <p><strong>Email:</strong> ${pedido.email}</p>
    <p><strong>Tipo:</strong> ${pedido.tipo_pedido === 'nuevos' ? 'Pedido Nuevo' : 'Pedido Personalizado'}</p>
    <p><strong>Fecha creación:</strong> ${new Date(pedido.created_at).toLocaleString()}</p>
    <p><strong>Fecha rechazo:</strong> ${new Date(pedido.rejected_at).toLocaleString()}</p>
  `;
  
  if (pedido.tipo_pedido === 'nuevos') {
    infoHTML += `
      <p><strong>Dirección:</strong> ${pedido.direccion || 'No especificada'}</p>
      <p><strong>WhatsApp:</strong> ${pedido.whatsapp || 'No especificado'}</p>
      <p><strong>Método de pago:</strong> ${pedido.metodo_pago || 'No especificado'}</p>
      <p><strong>Total:</strong> $${Number(pedido.total).toFixed(2)}</p>
    `;
  } else {
    infoHTML += `
      <h6 class="mt-3">Mensaje del Cliente</h6>
      <div class="border p-3 rounded bg-light">
        ${pedido.mensaje}
      </div>
    `;
  }
  
  document.getElementById('pedido-info').innerHTML = infoHTML;
  
  // Mostrar camisas solo para pedidos nuevos
  if (pedido.tipo_pedido === 'nuevos' && pedido.camisas) {
    try {
      const camisas = typeof pedido.camisas === 'string' ? JSON.parse(pedido.camisas) : pedido.camisas;
      let camisasHTML = '<h6 class="mt-3">Camisas Pedidas</h6><div class="row g-3">';
      
      camisas.forEach(camisa => {
        camisasHTML += `
          <div class="col-md-6">
            <div class="card">
              <div class="card-body">
                <h6>${camisa.diseño || 'Sin diseño'}</h6>
                <p><strong>Talla:</strong> ${camisa.talla}</p>
                <p><strong>Cantidad:</strong> ${camisa.cantidad}</p>
                <p><strong>Precio unitario:</strong> $${Number(camisa.precio || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        `;
      });
      
      camisasHTML += '</div>';
      document.getElementById('pedido-camisas').innerHTML = camisasHTML;
    } catch (e) {
      document.getElementById('pedido-camisas').innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning">
            No se pudieron cargar los detalles de las camisas
          </div>
        </div>
      `;
    }
  } else {
    document.getElementById('pedido-camisas').innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">
          <i class="ph ph-info"></i> Pedido personalizado/solicitud de contacto
        </div>
      </div>
    `;
  }
  
  modal.show();
};

// Función para reconsiderar pedido rechazado
window.reconsiderarPedido = async function(id) {
  const r = await Swal.fire({
    icon: "question",
    title: "Reconsiderar pedido",
    text: "¿Desea volver a poner este pedido en pendientes?",
    showCancelButton: true,
    confirmButtonText: "Sí, reconsiderar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  // Obtener pedido rechazado
  const { data: pedido } = await supabase
    .from("pedidos_rechazados")
    .select("*")
    .eq("id", id)
    .single();

  if (!pedido) {
    Swal.fire("Error", "No se encontró el pedido", "error");
    return;
  }

  if (pedido.tipo_pedido === 'nuevos') {
    // Reinsertar en pedidos_camisas
    const { error } = await supabase.from("pedidos_camisas").insert({
      id: pedido.id,
      nombre: pedido.nombre,
      email: pedido.email,
      direccion: pedido.direccion,
      whatsapp: pedido.whatsapp,
      metodo_pago: pedido.metodo_pago,
      camisas: typeof pedido.camisas === 'string' ? JSON.parse(pedido.camisas) : pedido.camisas,
      total: pedido.total,
      estado: 'pendiente',
      created_at: pedido.created_at
    });

    if (error) {
      Swal.fire("Error", "No se pudo reconsiderar el pedido", "error");
      return;
    }
  } else {
    // Reinsertar en pedidos_personalizados
    const { error } = await supabase.from("pedidos_personalizados").insert({
      id: pedido.id,
      nombre: pedido.nombre,
      email: pedido.email,
      mensaje: pedido.mensaje,
      status: 'pendiente',
      created_at: pedido.created_at
    });

    if (error) {
      Swal.fire("Error", "No se pudo reconsiderar el pedido", "error");
      return;
    }
  }

  // Eliminar de rechazados
  await supabase.from("pedidos_rechazados").delete().eq("id", id);

  Swal.fire("Listo", "Pedido enviado a pendientes", "success");
  
  // Recargar la vista actual
  const vistaActual = document.getElementById('titulo-vista').textContent;
  if (vistaActual.includes('rechazados')) {
    cargarVista('rechazados');
  }
};

// Función para eliminar pedido rechazado
window.eliminarRechazado = async function(id) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Eliminar pedido rechazado",
    text: "Esta acción es permanente",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  const { error } = await supabase.from("pedidos_rechazados").delete().eq("id", id);

  if (error) {
    Swal.fire("Error", "No se pudo eliminar el pedido", "error");
    return;
  }

  Swal.fire("Eliminado", "Pedido eliminado definitivamente", "success");
  
  // Recargar la vista actual
  const vistaActual = document.getElementById('titulo-vista').textContent;
  if (vistaActual.includes('rechazados')) {
    cargarVista('rechazados');
  }
};