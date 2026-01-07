// pedidos-pendientes.js - COMPLETO CON ACTUALIZACIÓN EN TIEMPO REAL
(async function () {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-pendientes");

  async function cargarPendientes(filtro = "") {
    let query = supabase
      .from("pedidos_camisas")
      .select("*")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false });

    if (filtro.trim() !== "") {
      query = query.or(`nombre.ilike.%${filtro}%,email.ilike.%${filtro}%`);
    }

    const { data, error } = await query;

    if (error) return console.error(error);

    // Actualizar contadores
    document.getElementById("pedidos-actuales").textContent = data.length;

    // Contar total de pedidos
    const { count: countTotal } = await supabase
      .from("pedidos_camisas")
      .select("*", { count: "exact", head: true });

    document.getElementById("pedidos-totales").textContent = countTotal ?? 0;

    // Renderizar tabla
    const tbody = document.getElementById("tabla-pedidos");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            No hay pedidos pendientes
          </td>
        </tr>`;
      return;
    }

    // MEJORADO: Usar fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    data.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.email}</td>
        <td>$${Number(p.total).toFixed(2)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-primary" onclick="verPedido('${p.id}')">Ver</button>
        </td>`;
      fragment.appendChild(tr);
    });
    
    tbody.appendChild(fragment);
  }

  if (input) {
    input.addEventListener("input", e => cargarPendientes(e.target.value));
  }

  cargarPendientes();

  // --- BOTÓN REFRESCAR ---
  document.getElementById("btn-refrescar")
    .addEventListener("click", () => location.reload());

  // --- CONTROL TEXTO PROXIMA FECHA ---
  const inputProx = document.getElementById("input-proxima-fecha");
  const btnGuardarProx = document.getElementById("guardar-proxima-fecha");

  // Cargar fecha guardada
  async function cargarFechaProx() {
    const { data, error } = await supabase
      .from("config_tienda")
      .select("proxima_entrega")
      .eq("id", 1)
      .single();

    if (!error && data?.proxima_entrega) {
      inputProx.value = data.proxima_entrega;
    } else {
      // Si no existe registro, crear uno por defecto
      const { error: insertError } = await supabase
        .from("config_tienda")
        .insert([{ id: 1, proxima_entrega: new Date().toISOString().split('T')[0] }])
        .select()
        .single();
      
      if (insertError && insertError.code !== '23505') { // 23505 es "duplicate key"
        console.error("Error creando configuración:", insertError);
      }
    }
  }

  cargarFechaProx();

  btnGuardarProx.addEventListener("click", async () => {
    const fecha = inputProx.value;

    if (!fecha) {
      return Swal.fire("Aviso", "Selecciona una fecha", "info");
    }

    const { error } = await supabase
      .from("config_tienda")
      .update({ proxima_entrega: fecha })
      .eq("id", 1);

    if (error) {
      console.error(error);
      return Swal.fire("Error", "No se pudo guardar", "error");
    }

    // ✅ NUEVO: Disparar evento personalizado para notificar a otras pestañas
    if (window.localStorage) {
      localStorage.setItem('fecha-proxima-actualizada', Date.now().toString());
      localStorage.setItem('ultima-fecha-proxima', fecha);
    }

    Swal.fire({
      icon: "success",
      title: "Guardada",
      text: "La fecha se actualizó correctamente",
      timer: 1800,
      showConfirmButton: false
    });

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modal-proxima-fecha")
    );
    if (modal) modal.hide();

  });

  // ✅ NUEVO: Escuchar eventos de otras pestañas (solo para admin)
  if (window.addEventListener && window.localStorage) {
    window.addEventListener('storage', (event) => {
      if (event.key === 'fecha-proxima-actualizada') {
        // Recargar la fecha cuando otra pestaña de admin la actualice
        setTimeout(() => {
          cargarFechaProx();
          // Mostrar notificación opcional (puedes comentarla si no la quieres)
          Swal.fire({
            icon: "info",
            title: "Fecha actualizada",
            text: "La próxima fecha ha sido modificada en otra pestaña",
            timer: 1500,
            showConfirmButton: false
          });
        }, 500);
      }
    });
  }

})();