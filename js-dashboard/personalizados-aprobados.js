// personalizados-aprobados.js
(async function () {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-aprobados");
  const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalPersonalizadoAprobado')) || 
                       new bootstrap.Modal(document.getElementById('modalPersonalizadoAprobado'));

  // Cargar pedidos aprobados
  async function cargarAprobados(filtro = "") {
    try {
      let query = supabase
        .from("personalizados_aprobados")
        .select("*")
        .order("completed_at", { ascending: false });

      if (filtro.trim() !== "") {
        query = query.or(
          `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%,talla.ilike.%${filtro}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      // Actualizar contador
      document.getElementById("total-aprobados").textContent = data?.length || 0;

      // Renderizar tabla
      const tbody = document.getElementById("tabla-aprobados");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted py-4">
              No hay pedidos personalizados aprobados
            </td>
          </tr>`;
        return;
      }

      const fragment = document.createDocumentFragment();
      
      data.forEach(p => {
        const tr = document.createElement("tr");
        
        // Formatear fecha
        const fechaAprobacion = new Date(p.completed_at);
        const fechaFormateada = fechaAprobacion.toLocaleDateString('es-SV', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Acortar mensaje
        const mensajeCorto = p.mensaje && p.mensaje.length > 30 
          ? p.mensaje.substring(0, 30) + '...' 
          : p.mensaje || 'Sin mensaje';

        tr.innerHTML = `
          <td><small class="text-muted">${p.uuid?.substring(0, 8) || 'N/A'}</small></td>
          <td><strong>${p.nombre || 'Sin nombre'}</strong></td>
          <td><small>${p.email || 'Sin email'}</small></td>
          <td><span class="badge bg-info">${p.talla || 'N/A'}</span></td>
          <td>
            <span data-bs-toggle="tooltip" 
                  data-bs-title="${(p.mensaje || '').replace(/"/g, '&quot;')}">
              ${mensajeCorto}
            </span>
          </td>
          <td><small>${fechaFormateada}</small></td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary" 
                    onclick="verPersonalizadoAprobado('${p.uuid}')">
              <i class="ph ph-eye"></i> Ver
            </button>
          </td>
        `;
        
        fragment.appendChild(tr);
      });
      
      tbody.appendChild(fragment);

    } catch (error) {
      console.error("Error cargando aprobados:", error);
    }
  }

  // Función para ver pedido aprobado
  window.verPersonalizadoAprobado = async function(uuid) {
    try {
      const { data: pedido, error } = await supabase
        .from("personalizados_aprobados")
        .select("*")
        .eq("uuid", uuid)
        .single();

      if (error) throw error;

      // Formatear fechas
      const fechaPedido = new Date(pedido.created_at);
      const fechaAprobacion = new Date(pedido.completed_at);
      
      const fechaPedidoStr = fechaPedido.toLocaleDateString('es-SV', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const fechaAprobacionStr = fechaAprobacion.toLocaleDateString('es-SV', {
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

      document.getElementById('modal-aprobado-body').innerHTML = `
        <div class="row">
          <div class="col-md-6">
            <h6 class="border-bottom pb-2">Información del Cliente</h6>
            <p><strong>Nombre:</strong> ${pedido.nombre}</p>
            <p><strong>Email:</strong> ${pedido.email}</p>
            <p><strong>Talla:</strong> <span class="badge bg-primary">${pedido.talla || 'No especificada'}</span></p>
            <p><strong>Estado:</strong> <span class="badge bg-success">Aprobado</span></p>
            <p><strong>Fecha del pedido:</strong> ${fechaPedidoStr}</p>
            <p><strong>Fecha de aprobación:</strong> ${fechaAprobacionStr}</p>
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

      modalInstance.show();

    } catch (error) {
      console.error("Error viendo aprobado:", error);
      Swal.fire("Error", "No se pudo cargar el pedido", "error");
    }
  }

  if (input) {
    input.addEventListener("input", e => cargarAprobados(e.target.value));
  }

  cargarAprobados();

})();