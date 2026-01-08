// pedidos-personalizados.js - VERSIÓN CON TABLAS SEPARADAS
(async function () {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  // Variables globales
  let pedidoActual = null;
  let modalInstance = null;
  const input = document.getElementById("busqueda-personalizados");

  // Inicializar modal de Bootstrap
  const modalElement = document.getElementById('modalPedidoPersonalizado');
  if (modalElement) {
    modalInstance = new bootstrap.Modal(modalElement);
  }

  // Contar pedidos personalizados
  async function actualizarContadores() {
    try {
      // Contar pedidos pendientes
      const { count: countPendientes } = await supabase
        .from("pedidos_personalizados")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendiente");

      document.getElementById("pedidos-personalizados").textContent = countPendientes ?? 0;

      // Obtener total de pedidos aprobados
      const { count: countAprobados } = await supabase
        .from("personalizados_aprobados")
        .select("*", { count: "exact", head: true });

      document.getElementById("total-personalizados").textContent = countAprobados ?? 0;

      // Contar pedidos de hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyIso = hoy.toISOString();
      
      const { count: countHoy } = await supabase
        .from("pedidos_personalizados")
        .select("*", { count: "exact", head: true })
        .gte("created_at", hoyIso)
        .eq("status", "pendiente");

      document.getElementById("pedidos-hoy").textContent = countHoy ?? 0;

    } catch (error) {
      console.error("Error actualizando contadores:", error);
    }
  }

  // Cargar pedidos personalizados PENDIENTES
  async function cargarPersonalizados(filtro = "") {
    try {
      let query = supabase
        .from("pedidos_personalizados")
        .select("*")
        .eq("status", "pendiente")
        .order("created_at", { ascending: false });

      // Aplicar filtro de búsqueda
      if (filtro.trim() !== "") {
        query = query.or(
          `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%,talla.ilike.%${filtro}%,mensaje.ilike.%${filtro}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      // Renderizar tabla
      const tbody = document.getElementById("tabla-personalizados");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-muted py-4">
              No hay pedidos personalizados pendientes
            </td>
          </tr>`;
        return;
      }

      // Usar fragmento para mejor rendimiento
      const fragment = document.createDocumentFragment();
      
      data.forEach(p => {
        const tr = document.createElement("tr");
        
        // Formatear fecha
        const fecha = new Date(p.created_at);
        const fechaFormateada = fecha.toLocaleDateString('es-SV', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        // Acortar mensaje si es muy largo
        const mensajeCorto = p.mensaje && p.mensaje.length > 30 
          ? p.mensaje.substring(0, 30) + '...' 
          : p.mensaje || 'Sin mensaje';

        // Mostrar imagen miniatura si existe
        let imagenHtml = '<span class="text-muted">Sin imagen</span>';
        if (p.imagen_url) {
          imagenHtml = `
            <img src="${p.imagen_url}" 
                 alt="Referencia" 
                 class="img-miniatura"
                 onclick="ampliarImagen('${p.imagen_url}')"
                 data-bs-toggle="tooltip"
                 data-bs-title="Click para ampliar">
          `;
        }

        // Generar ID para mostrar
        const displayId = p.uuid 
          ? p.uuid.substring(0, 8) 
          : (p.id ? p.id.substring(0, 8) : 'N/A');

        tr.innerHTML = `
          <td><small class="text-muted">${displayId}</small></td>
          <td><strong>${p.nombre || 'Sin nombre'}</strong></td>
          <td><small>${p.email || 'Sin email'}</small></td>
          <td><span class="badge bg-info">${p.talla || 'N/A'}</span></td>
          <td>
            <span data-bs-toggle="tooltip" 
                  data-bs-title="${(p.mensaje || '').replace(/"/g, '&quot;')}">
              ${mensajeCorto}
            </span>
          </td>
          <td>${imagenHtml}</td>
          <td><span class="badge bg-warning">Pendiente</span></td>
          <td><small>${fechaFormateada}</small></td>
          <td class="text-end">
            <div class="btn-group btn-group-sm" role="group">
              <button class="btn btn-primary" 
                      onclick="verPedidoPersonalizado('${p.uuid || p.id}')"
                      data-bs-toggle="tooltip"
                      data-bs-title="Ver detalles">
                <i class="ph ph-eye"></i> Ver
              </button>
            </div>
          </td>
        `;
        
        fragment.appendChild(tr);
      });
      
      tbody.appendChild(fragment);
      
      // Inicializar tooltips de Bootstrap
      if (window.bootstrap && window.bootstrap.Tooltip) {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
      }

    } catch (error) {
      console.error("Error cargando personalizados:", error);
      Swal.fire("Error", "No se pudieron cargar los pedidos", "error");
    }
  }

  // Función para ver pedido personalizado (modal)
  window.verPedidoPersonalizado = async function(id) {
    try {
      // Primero intentar por uuid, luego por id
      let query = supabase
        .from("pedidos_personalizados")
        .select("*");
      
      // Verificar si es UUID o ID numérico
      if (id.includes('-')) {
        query = query.eq("uuid", id);
      } else {
        query = query.eq("id", id);
      }
      
      const { data: pedido, error } = await query.single();

      if (error) throw error;

      pedidoActual = pedido;

      // Formatear fecha
      const fecha = new Date(pedido.created_at);
      const fechaFormateada = fecha.toLocaleDateString('es-SV', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Actualizar información del cliente
      document.getElementById('pedido-personal-info').innerHTML = `
        <h6 class="border-bottom pb-2">Información del Cliente</h6>
        <p><strong>Nombre:</strong> ${pedido.nombre || 'No especificado'}</p>
        <p><strong>Email:</strong> ${pedido.email || 'No especificado'}</p>
        <p><strong>Talla solicitada:</strong> <span class="badge bg-primary">${pedido.talla || 'No especificada'}</span></p>
        <p><strong>Estado:</strong> <span class="badge bg-warning">Pendiente</span></p>
        <p><strong>Fecha del pedido:</strong> ${fechaFormateada}</p>
        <p><strong>ID del pedido:</strong> <code>${pedido.uuid || pedido.id}</code></p>
      `;

      // Actualizar imagen de referencia
      let imagenHtml = '<div class="alert alert-info">No hay imagen de referencia</div>';
      if (pedido.imagen_url) {
        imagenHtml = `
          <h6 class="border-bottom pb-2">Imagen de Referencia</h6>
          <div class="text-center">
            <img src="${pedido.imagen_url}" 
                 alt="Referencia del pedido" 
                 class="img-fluid rounded"
                 style="max-height: 300px; max-width: 100%; object-fit: contain;">
            <p class="text-muted mt-2">
              <small>Click derecho para guardar la imagen</small>
            </p>
            <a href="${pedido.imagen_url}" 
               target="_blank" 
               class="btn btn-sm btn-outline-primary mt-2">
               <i class="ph ph-arrow-square-out"></i> Ver en tamaño completo
            </a>
          </div>
        `;
      }
      document.getElementById('pedido-personal-imagen').innerHTML = imagenHtml;

      // Actualizar mensaje del pedido
      document.getElementById('pedido-personal-mensaje').innerHTML = `
        <h6 class="border-bottom pb-2">Detalles del Pedido</h6>
        <div class="border p-3 rounded bg-light">
          <p class="mb-0" style="white-space: pre-wrap;">${pedido.mensaje || 'Sin mensaje'}</p>
        </div>
      `;

      // Mostrar botones de aprobar/rechazar
      const btnAprobar = document.getElementById('btn-aprobar-modal');
      const btnRechazar = document.getElementById('btn-rechazar-modal');
      
      btnAprobar.style.display = 'inline-block';
      btnRechazar.style.display = 'inline-block';
      
      // Configurar eventos de los botones del modal
      btnAprobar.onclick = () => aprobarPedidoPersonalizado(pedido);
      btnRechazar.onclick = () => rechazarPedidoPersonalizado(pedido);

      // Mostrar modal
      if (modalInstance) {
        modalInstance.show();
      }

    } catch (error) {
      console.error("Error viendo pedido:", error);
      Swal.fire("Error", "No se pudo cargar el pedido", "error");
    }
  };

  // Función para ampliar imagen
  window.ampliarImagen = function(url) {
    Swal.fire({
      imageUrl: url,
      imageAlt: "Imagen de referencia",
      showConfirmButton: false,
      showCloseButton: true,
      background: 'rgba(0,0,0,0.8)',
      padding: '0',
      width: '90%',
      backdrop: true
    });
  };

  // Función para aprobar pedido personalizado
  async function aprobarPedidoPersonalizado(pedido) {
    try {
      // Confirmar aprobación SIN notas
      const confirm = await Swal.fire({
        icon: "question",
        title: "Aprobar pedido personalizado",
        html: `
          <div class="text-start">
            <p>¿Marcar este pedido como <strong>aprobado</strong>?</p>
            <div class="alert alert-info">
              <p><strong>Cliente:</strong> ${pedido.nombre}</p>
              <p><strong>Talla:</strong> ${pedido.talla || 'No especificada'}</p>
              <p><strong>Tipo:</strong> Pedido personalizado</p>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#198754"
      });

      if (!confirm.isConfirmed) return;

      // Mostrar loading
      Swal.fire({
        title: 'Procesando...',
        html: `
          <div class="text-center">
            <div class="spinner-border text-success" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Aprobando pedido...</p>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false
      });

      // 1. Insertar en personalizados_aprobados
      const datosAprobados = {
        uuid: pedido.uuid || pedido.id,
        nombre: pedido.nombre,
        email: pedido.email,
        mensaje: pedido.mensaje,
        talla: pedido.talla,
        imagen_url: pedido.imagen_url,
        status: 'aprobado',
        created_at: pedido.created_at,
        completed_at: new Date().toISOString()
      };

      console.log("Insertando en personalizados_aprobados:", datosAprobados);

      const { error: insertError } = await supabase
        .from("personalizados_aprobados")
        .insert(datosAprobados);

      if (insertError) {
        console.error("Error insertando en aprobados:", insertError);
        Swal.fire("Error", "No se pudo aprobar el pedido", "error");
        return;
      }

      // 2. Eliminar de pedidos_personalizados
      const { error: deleteError } = await supabase
        .from("pedidos_personalizados")
        .delete()
        .eq(pedido.uuid ? "uuid" : "id", pedido.uuid || pedido.id);

      if (deleteError) {
        console.error("Error eliminando de personalizados:", deleteError);
        // Revertir inserción en aprobados si falla la eliminación
        await supabase
          .from("personalizados_aprobados")
          .delete()
          .eq("uuid", pedido.uuid || pedido.id);
        
        Swal.fire("Error", "No se pudo completar la aprobación", "error");
        return;
      }

      // Cerrar modal si está abierto
      if (modalInstance) {
        modalInstance.hide();
      }

      // Mostrar confirmación final
      Swal.fire({
        icon: "success",
        title: "✅ ¡Aprobado!",
        html: `
          <div class="text-start">
            <p>Pedido personalizado aprobado exitosamente.</p>
            <div class="alert alert-success">
              <p class="mb-1"><strong>Cliente:</strong> ${pedido.nombre}</p>
              <p class="mb-1"><strong>Talla:</strong> ${pedido.talla || 'No especificada'}</p>
              <p class="mb-0"><strong>Estado:</strong> Movido a personalizados aprobados</p>
            </div>
          </div>
        `,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
      });

      // Recargar datos
      cargarPersonalizados(input?.value || "");
      actualizarContadores();

    } catch (error) {
      console.error("Error aprobando pedido:", error);
      Swal.fire("Error", "Ocurrió un error al aprobar el pedido", "error");
    }
  }

  // Función para rechazar pedido personalizado
  async function rechazarPedidoPersonalizado(pedido) {
    try {
      // Pedir razón del rechazo (OBLIGATORIO)
      const { value: razon } = await Swal.fire({
        icon: "warning",
        title: "Rechazar pedido personalizado",
        html: `
          <div class="text-start">
            <p>¿Mover este pedido a <strong>rechazados</strong>?</p>
            <div class="alert alert-warning">
              <p><strong>Cliente:</strong> ${pedido.nombre}</p>
              <p><strong>Talla:</strong> ${pedido.talla || 'No especificada'}</p>
              <p><strong>Tipo:</strong> Pedido personalizado</p>
            </div>
            <div class="mb-3">
              <label class="form-label"><strong>Razón del rechazo *</strong></label>
              <textarea id="razon-rechazo" 
                       class="form-control" 
                       placeholder="Explica por qué se rechaza este pedido..."
                       rows="4"
                       required></textarea>
              <small class="text-muted">Esta razón es obligatoria y se guardará en el registro.</small>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, rechazar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#dc3545",
        showCloseButton: true,
        preConfirm: () => {
          const razonInput = document.getElementById('razon-rechazo');
          if (!razonInput.value.trim()) {
            Swal.showValidationMessage('Debe escribir una razón para el rechazo');
            return false;
          }
          return razonInput.value;
        }
      });

      if (!value) return; // Si el usuario cancela

      // Mostrar loading
      Swal.fire({
        title: 'Procesando...',
        html: `
          <div class="text-center">
            <div class="spinner-border text-danger" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Rechazando pedido...</p>
          </div>
        `,
        allowOutsideClick: false,
        showConfirmButton: false
      });

      // 1. Insertar en personalizados_rechazados
      const datosRechazados = {
        uuid: pedido.uuid || pedido.id,
        nombre: pedido.nombre,
        email: pedido.email,
        mensaje: pedido.mensaje,
        talla: pedido.talla,
        imagen_url: pedido.imagen_url,
        status: 'rechazado',
        motivo_rechazo: value,
        created_at: pedido.created_at,
        rejected_at: new Date().toISOString()
      };

      console.log("Insertando en personalizados_rechazados:", datosRechazados);

      const { error: insertError } = await supabase
        .from("personalizados_rechazados")
        .insert(datosRechazados);

      if (insertError) {
        console.error("Error insertando en rechazados:", insertError);
        Swal.fire("Error", "No se pudo rechazar el pedido", "error");
        return;
      }

      // 2. Eliminar de pedidos_personalizados
      const { error: deleteError } = await supabase
        .from("pedidos_personalizados")
        .delete()
        .eq(pedido.uuid ? "uuid" : "id", pedido.uuid || pedido.id);

      if (deleteError) {
        console.error("Error eliminando de personalizados:", deleteError);
        // Revertir inserción en rechazados si falla la eliminación
        await supabase
          .from("personalizados_rechazados")
          .delete()
          .eq("uuid", pedido.uuid || pedido.id);
        
        Swal.fire("Error", "No se pudo completar el rechazo", "error");
        return;
      }

      // Cerrar modal si está abierto
      if (modalInstance) {
        modalInstance.hide();
      }

      // Mostrar confirmación final
      Swal.fire({
        icon: "success",
        title: "✅ ¡Rechazado!",
        html: `
          <div class="text-start">
            <p>Pedido personalizado rechazado exitosamente.</p>
            <div class="alert alert-success">
              <p class="mb-1"><strong>Cliente:</strong> ${pedido.nombre}</p>
              <p class="mb-1"><strong>Talla:</strong> ${pedido.talla || 'No especificada'}</p>
              <p class="mb-0"><strong>Razón:</strong> ${value}</p>
            </div>
          </div>
        `,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
      });

      // Recargar datos
      cargarPersonalizados(input?.value || "");
      actualizarContadores();

    } catch (error) {
      console.error("Error rechazando pedido:", error);
      Swal.fire("Error", "Ocurrió un error al rechazar el pedido", "error");
    }
  }

  // Event listeners
  if (input) {
    input.addEventListener("input", e => cargarPersonalizados(e.target.value));
  }

  // Botón refrescar
  document.getElementById("btn-refrescar-pers")?.addEventListener("click", () => {
    cargarPersonalizados(input?.value || "");
    actualizarContadores();
    Swal.fire({
      icon: "success",
      title: "Actualizado",
      text: "Datos actualizados correctamente",
      timer: 1000,
      showConfirmButton: false
    });
  });

  // Cargar datos iniciales
  cargarPersonalizados();
  actualizarContadores();

})();