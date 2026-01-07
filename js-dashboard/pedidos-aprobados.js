// pedidos-aprobados.js - CORREGIDO PARA MOSTRAR FECHA CONSISTENTE
(async function () {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-completados");

  async function cargarCompletados(filtro = "") {
    try {
      let query = supabase
        .from("pedidos_aprobados")
        .select("*")
        .order("completed_at", { ascending: false });

      if (filtro.trim() !== "") {
        query = query.or(
          `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error cargando aprobados:", error);
        const tbody = document.getElementById("tabla-completados");
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-danger py-4">
              Error al cargar los pedidos
            </td>
          </tr>`;
        return;
      }

      const tbody = document.getElementById("tabla-completados");
      tbody.innerHTML = "";

      if (!data || data.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-muted py-4">
              No hay pedidos aprobados
            </td>
          </tr>`;
        return;
      }

      // CORRECCIÓN: Función para formatear fecha de zona horaria
      function formatearFecha(fechaString) {
        if (!fechaString) return 'No asignada';
        
        try {
          // Usar EXACTAMENTE la misma lógica que en el modal
          const fecha = new Date(fechaString);
          if (isNaN(fecha.getTime())) return 'Fecha inválida';
          
          return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
        } catch (e) {
          console.error("Error formateando fecha:", e, "Valor:", fechaString);
          return 'Error formato';
        }
      }

      // Función para formatear fecha de aprobación
      function formatearFechaAprobacion(fechaString) {
        if (!fechaString) return 'N/A';
        
        try {
          const fecha = new Date(fechaString);
          if (isNaN(fecha.getTime())) return 'Fecha inválida';
          
          return fecha.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } catch (e) {
          return 'Error';
        }
      }

      const fragment = document.createDocumentFragment();
      
      data.forEach(p => {
        const tr = document.createElement("tr");
        
        // 🔥 PRIORIDAD: fecha_entrega_max es el campo principal
        // Si no existe, buscar en otros campos
        const fechaEntrega = p.fecha_entrega_max || p.fecha_entrega || p.proxima_entrega;
        
        // Para debugging
        console.log(`Pedido ${p.id}:`, {
          nombre: p.nombre,
          fecha_entrega_max: p.fecha_entrega_max,
          fecha_formateada: formatearFecha(fechaEntrega)
        });
        
        tr.innerHTML = `
          <td>${p.nombre || 'Sin nombre'}</td>
          <td>${p.email || 'Sin email'}</td>
          <td>$${Number(p.total || 0).toFixed(2)}</td>
          <td>${formatearFechaAprobacion(p.completed_at)}</td>
          <td>${formatearFecha(fechaEntrega)}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary"
              onclick="verPedidoGeneral('${p.id}', 'pedidos_aprobados')">
              Ver
            </button>
          </td>`;
        
        fragment.appendChild(tr);
      });
      
      tbody.appendChild(fragment);
      
    } catch (error) {
      console.error("Error en cargarCompletados:", error);
      const tbody = document.getElementById("tabla-completados");
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-danger py-4">
            Error inesperado al cargar
          </td>
        </tr>`;
    }
  }

  if (input) {
    input.addEventListener("input", e => cargarCompletados(e.target.value));
  }

  cargarCompletados();
})();