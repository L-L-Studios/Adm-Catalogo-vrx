// personalizados-rechazados.js
(async function () {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-rechazados");
  const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalPersonalizadoRechazado')) || 
                       new bootstrap.Modal(document.getElementById('modalPersonalizadoRechazado'));
  let pedidoActual = null;

  // Cargar pedidos rechazados
  async function cargarRechazados(filtro = "") {
    try {
      let query = supabase
        .from("personalizados_rechazados")
        .select("*")
        .order("rejected_at", { ascending: false });

      if (filtro.trim() !== "") {
        query = query.or(
          `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%,talla.ilike.%${filtro}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      // Actualizar contador
      document.getElementById("total-rechazados").textContent = data?.length || 0;

      // Renderizar tabla
      const tbody = document.getElementById("tabla-rechazados");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              No hay pedidos personalizados rechazados
            </td>
          </tr>`;
        return;
      }

      const fragment = document.createDocumentFragment();
      
      data.forEach(p => {
        const tr = document.createElement("tr");
        
        // Formatear fecha
        const fechaRechazo = new Date(p.rejected_at);
        const fechaFormateada = fechaRechazo.toLocaleDateString('es-SV', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Acortar razón
        const razonCorta = p.motivo_rechazo && p.motivo_rechazo.length > 30 
          ? p.motivo_rechazo.substring(0, 30) + '...' 
          : p.motivo_rechazo || 'Sin razón';

        tr.innerHTML = `
          <td><small class="text-muted">${p.uuid?.substring(0, 8) || 'N/A'}</small></td>
          <td><strong>${p.nombre || 'Sin nombre'}</strong></td>
          <td><small>${p.email || 'Sin email'}</small></td>
          <td><span class="badge bg-info">${p.talla || 'N/A'}</span></td>
          <td>
            <span data-bs-toggle="tooltip" 
                  data-bs-title="${(p.motivo_rechazo || '').replace(/"/g, '&quot;')}">
              ${razonCorta}
            </span>
          </td>
          <td><small>${fechaFormateada}</small></td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary" 
                    onclick="verPersonalizadoRechazado('${p.uuid}')">
              <i class="ph ph-eye"></i> Ver
            </button>
          </td>
        `;
        
        fragment.appendChild(tr);
      });
      
      tbody.appendChild(fragment);

    } catch (error) {
      console.error("Error cargando rechazados:", error);
    }
  }

  // Función para ver pedido rechazado
  window.verPersonalizadoRechazado = async function(uuid) {
    try {
      const { data: pedido, error } = await supabase
        .from("personalizados_rechazados")
        .select("*")
        .eq("uuid", uuid)
        .single();

      if (error) throw error;

      pedidoActual = pedido;

      // Formatear fechas
      const fechaPedido = new Date(pedido.created_at);
      const fechaRechazo = new Date(pedido.rejected_at);
      
      const fechaPedidoStr = fechaPedido.toLocaleDateString('es-SV', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const fechaRechazoStr = fechaRechazo.toLocaleDateString('es-SV', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Crear contenido del modal
      let imagenHtml = '<div class="alert alert-info">No hay imagen de referencia</div>';
      if (pedido.imagen_url) {
        imagenHtml = `
          <h6 class="border-bottom pb-2">Imagen de Referencia</h6>
          <div class="text-center">
            <img src="${pedido.imagen_url}" 
                 alt="Referencia" 
                 class="img-fluid rounded"
                 style="max-height: 300px; max-width: 100%; object-fit: contain;">
          </div>
        `;
      }

      document.getElementById('modal-rechazado-body').innerHTML = `
        <div class="row">
          <div class="col-md-6">
            <h6 class="border-bottom pb-2">Información del Cliente</h6>
            <p><strong>Nombre:</strong> ${pedido.nombre}</p>
            <p><strong>Email:</strong> ${pedido.email}</p>
            <p><strong>Talla:</strong> <span class="badge bg-primary">${pedido.talla || 'No especificada'}</span></p>
            <p><strong>Estado:</strong> <span class="badge bg-danger">Rechazado</span></p>
            <p><strong>Fecha del pedido:</strong> ${fechaPedidoStr}</p>
            <p><strong>Fecha de rechazo:</strong> ${fechaRechazoStr}</p>
            <p><strong>Razón del rechazo:</strong></p>
            <div class="alert alert-danger">
              ${pedido.motivo_rechazo || 'Sin razón especificada'}
            </div>
            <p><strong>ID:</strong> <code>${pedido.uuid}</code></p>
          </div>
          <div class="col-md-6">
            ${imagenHtml}
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-12">
            <h6 class="border-bottom pb-2">Detalles del Pedido</h6>
            <div class="border p-3 rounded bg-light">
              <p class="mb-0" style="white-space: pre-wrap;">${pedido.mensaje || 'Sin mensaje'}</p>
            </div>
          </div>
        </div>
      `;

      // Configurar botón de reconsiderar
      document.getElementById('btn-reconsiderar-modal').onclick = () => reconsiderarPersonalizado(pedido);

      modalInstance.show();

    } catch (error) {
      console.error("Error viendo rechazado:", error);
      Swal.fire("Error", "No se pudo cargar el pedido", "error");
    }
  }

  // Función para reconsiderar pedido
  async function reconsiderarPersonalizado(pedido) {
    try {
      const confirm = await Swal.fire({
        icon: "question",
        title: "Reconsiderar pedido",
        html: `
          <div class="text-start">
            <p>¿Volver a poner este pedido en <strong>pendientes</strong>?</p>
            <div class="alert alert-info">
              <p><strong>Cliente:</strong> ${pedido.nombre}</p>
              <p><strong>Razón anterior:</strong> ${pedido.motivo_rechazo || 'Sin razón'}</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, reconsiderar",
        cancelButtonText: "Cancelar"
      });

      if (!confirm.isConfirmed) return;

      // 1. Insertar en pedidos_personalizados (pendientes)
      const datosPendiente = {
        uuid: pedido.uuid,
        nombre: pedido.nombre,
        email: pedido.email,
        mensaje: pedido.mensaje,
        talla: pedido.talla,
        imagen_url: pedido.imagen_url,
        status: 'pendiente',
        created_at: pedido.created_at
      };

      const { error: insertError } = await supabase
        .from("pedidos_personalizados")
        .insert(datosPendiente);

      if (insertError) {
        console.error("Error insertando en pendientes:", insertError);
        Swal.fire("Error", "No se pudo reconsiderar el pedido", "error");
        return;
      }

      // 2. Eliminar de rechazados
      const { error: deleteError } = await supabase
        .from("personalizados_rechazados")
        .delete()
        .eq("uuid", pedido.uuid);

      if (deleteError) {
        console.error("Error eliminando de rechazados:", deleteError);
        // Revertir inserción si falla
        await supabase
          .from("pedidos_personalizados")
          .delete()
          .eq("uuid", pedido.uuid);
        
        Swal.fire("Error", "No se pudo completar la reconsideración", "error");
        return;
      }

      // Cerrar modal
      modalInstance.hide();

      Swal.fire({
        icon: "success",
        title: "¡Reconsiderado!",
        text: "El pedido ha sido movido a pendientes",
        timer: 2000,
        showConfirmButton: false
      });

      // Recargar datos
      cargarRechazados(input?.value || "");

    } catch (error) {
      console.error("Error reconsiderando pedido:", error);
      Swal.fire("Error", "Ocurrió un error al reconsiderar el pedido", "error");
    }
  }

  if (input) {
    input.addEventListener("input", e => cargarRechazados(e.target.value));
  }

  cargarRechazados();

})();