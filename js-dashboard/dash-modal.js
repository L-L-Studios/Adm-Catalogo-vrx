// dash-modal.js - VERSIÓN CORREGIDA PARA JSON
async function verPedido(id, tabla = "pedidos_camisas") {
  try {
    const { data: p, error } = await supabase
      .from(tabla)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error al obtener pedido:", error);
      Swal.fire("Error", "No se pudo cargar el pedido", "error");
      return;
    }

    console.log("📦 Pedido obtenido:", p);

    // Información básica del pedido
    document.getElementById("pedido-info").innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <p><strong>👤 Cliente:</strong> ${p.nombre || "No especificado"}</p>
          <p><strong>📧 Email:</strong> ${p.email || "No especificado"}</p>
          <p><strong>📱 WhatsApp:</strong> ${p.whatsapp || "No especificado"}</p>
        </div>
        <div class="col-md-6">
          <p><strong>📍 Dirección:</strong> ${p.direccion || "No especificada"}</p>
          <p><strong>💰 Método de pago:</strong> ${p.metodo_pago || "Efectivo"}</p>
          <p><strong>💵 Total:</strong> $${Number(p.total || 0).toFixed(2)}</p>
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12">
          <p><strong>📅 Fecha:</strong> ${new Date(p.created_at).toLocaleString()}</p>
          ${p.costo_extra ? `<p><strong>📝 Notas adicionales:</strong> ${p.costo_extra}</p>` : ""}
        </div>
      </div>
      <hr>
    `;

    // Contenedor para las camisas
    const cont = document.getElementById("pedido-camisas");
    cont.innerHTML = "";

    // Verificar si camisas es string JSON o ya es objeto
    let camisasData;
    try {
      if (typeof p.camisas === 'string') {
        camisasData = JSON.parse(p.camisas);
      } else {
        camisasData = p.camisas;
      }
    } catch (e) {
      console.error("Error parseando camisas:", e);
      camisasData = [];
    }

    // Si no hay camisas o está vacío
    if (!camisasData || camisasData.length === 0) {
      cont.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning">
            <i class="ph ph-warning-circle"></i> No se encontraron productos en este pedido
          </div>
        </div>
      `;
      const modal = new bootstrap.Modal(document.getElementById("modalPedido"));
      modal.show();
      return;
    }

    // Mostrar cada camisa
    let camisasHTML = '<div class="row g-3">';
    
    camisasData.forEach((item, index) => {
      const subtotal = (item.precio || 0) * (item.cantidad || 1);
      
      camisasHTML += `
        <div class="col-md-6">
          <div class="card shadow-sm h-100">
            <div class="card-body">
              <h6 class="card-title">${item.nombre || "Producto sin nombre"}</h6>
              
              <div class="d-flex justify-content-between mb-2">
                <span class="badge bg-primary">👕 Talla: ${item.talla || "No especificada"}</span>
                <span class="badge bg-success">🎨 Color: ${item.color || "No especificado"}</span>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted">Cantidad:</span>
                <span class="fw-bold">${item.cantidad || 1}</span>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted">Precio unitario:</span>
                <span class="fw-bold">$${(item.precio || 0).toFixed(2)}</span>
              </div>
              
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="text-muted">Subtotal:</span>
                <span class="fw-bold text-primary">$${subtotal.toFixed(2)}</span>
              </div>
              
              ${item.costo_extra ? `
                <div class="mt-2 p-2 bg-light rounded">
                  <small class="text-muted">✏️ Extra:</small>
                  <p class="mb-0 small">${item.costo_extra}</p>
                </div>
              ` : ''}
              
              ${item.imagen ? `
                <div class="mt-2">
                  <img src="${item.imagen}" alt="${item.nombre}" 
                       class="img-fluid rounded" style="max-height: 150px;">
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    camisasHTML += '</div>';
    
    // Resumen del pedido
    const totalGeneral = camisasData.reduce((sum, item) => 
      sum + ((item.precio || 0) * (item.cantidad || 1)), 0
    );
    
    const resumenHTML = `
      <div class="row mt-4">
        <div class="col-12">
          <div class="card bg-light">
            <div class="card-body">
              <h6 class="card-title">📋 Resumen del Pedido</h6>
              <div class="row">
                <div class="col-md-6">
                  <p class="mb-1"><strong>Total de productos:</strong> ${camisasData.length}</p>
                  <p class="mb-1"><strong>Unidades totales:</strong> ${camisasData.reduce((sum, item) => sum + (item.cantidad || 1), 0)}</p>
                </div>
                <div class="col-md-6 text-end">
                  <h5 class="text-primary">Total: $${totalGeneral.toFixed(2)}</h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    cont.innerHTML = camisasHTML + resumenHTML;

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("modalPedido"));
    modal.show();

  } catch (error) {
    console.error("Error en verPedido:", error);
    Swal.fire("Error", "Ocurrió un error al cargar el pedido", "error");
  }
}

// Función para ver pedidos de otras tablas (personalizados, completados, rechazados)
async function verPedidoGeneral(id, tabla) {
  try {
    const { data: p, error } = await supabase
      .from(tabla)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error al obtener pedido:", error);
      Swal.fire("Error", "No se pudo cargar el pedido", "error");
      return;
    }

    console.log(`📦 Pedido de ${tabla}:`, p);

    // Información básica
    let infoHTML = `
      <div class="row">
        <div class="col-md-6">
          <p><strong>👤 Cliente:</strong> ${p.nombre || "No especificado"}</p>
          <p><strong>📧 Email:</strong> ${p.email || "No especificado"}</p>
          ${p.whatsapp ? `<p><strong>📱 WhatsApp:</strong> ${p.whatsapp}</p>` : ""}
        </div>
        <div class="col-md-6">
          ${p.direccion ? `<p><strong>📍 Dirección:</strong> ${p.direccion}</p>` : ""}
          ${p.metodo_pago ? `<p><strong>💰 Método de pago:</strong> ${p.metodo_pago}</p>` : ""}
          ${p.total ? `<p><strong>💵 Total:</strong> $${Number(p.total || 0).toFixed(2)}</p>` : ""}
        </div>
      </div>
      <div class="row mt-2">
        <div class="col-12">
          <p><strong>📅 Fecha:</strong> ${new Date(p.created_at || p.completed_at || p.rejected_at || new Date()).toLocaleString()}</p>
          ${p.costo_extra ? `<p><strong>📝 Notas:</strong> ${p.costo_extra}</p>` : ""}
          ${p.mensaje ? `<p><strong>💬 Mensaje:</strong> ${p.mensaje}</p>` : ""}
        </div>
      </div>
      <hr>
    `;

    document.getElementById("pedido-info").innerHTML = infoHTML;

    // Contenedor para productos
    const cont = document.getElementById("pedido-camisas");
    cont.innerHTML = "";

    // Manejar diferentes tipos de pedidos
    if (tabla === "pedidos_personalizados") {
      // Pedidos personalizados
      cont.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">
            <i class="ph ph-info"></i> Este es un pedido personalizado/solicitud de contacto.
          </div>
          ${p.mensaje ? `
            <div class="card">
              <div class="card-body">
                <h6>📝 Mensaje del cliente:</h6>
                <p class="mb-0">${p.mensaje}</p>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } else if (p.camisas) {
      // Pedidos con camisas (completados, rechazados)
      let camisasData;
      try {
        if (typeof p.camisas === 'string') {
          camisasData = JSON.parse(p.camisas);
        } else {
          camisasData = p.camisas;
        }
      } catch (e) {
        console.error("Error parseando camisas:", e);
        camisasData = [];
      }

      if (camisasData && camisasData.length > 0) {
        let camisasHTML = '<div class="row g-3"><h5>🛒 Productos</h5>';
        
        camisasData.forEach((item, index) => {
          const subtotal = (item.precio || 0) * (item.cantidad || 1);
          
          camisasHTML += `
            <div class="col-md-6">
              <div class="card">
                <div class="card-body">
                  <h6>${item.nombre || "Producto"}</h6>
                  <p class="mb-1">👕 Talla: ${item.talla || "N/A"}</p>
                  <p class="mb-1">🎨 Color: ${item.color || "N/A"}</p>
                  <p class="mb-1">📦 Cantidad: ${item.cantidad || 1}</p>
                  <p class="mb-1 fw-bold">💰 Subtotal: $${subtotal.toFixed(2)}</p>
                  ${item.costo_extra ? `<p class="mb-0 small text-muted">✏️ Extra: ${item.costo_extra}</p>` : ''}
                </div>
              </div>
            </div>
          `;
        });
        
        camisasHTML += '</div>';
        cont.innerHTML = camisasHTML;
      } else {
        cont.innerHTML = `
          <div class="col-12">
            <div class="alert alert-warning">
              No hay productos detallados en este pedido
            </div>
          </div>
        `;
      }
    } else {
      cont.innerHTML = `
        <div class="col-12">
          <div class="alert alert-secondary">
            No hay información de productos disponible
          </div>
        </div>
      `;
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("modalPedido"));
    modal.show();

  } catch (error) {
    console.error(`Error en verPedidoGeneral (${tabla}):`, error);
    Swal.fire("Error", "Ocurrió un error al cargar el pedido", "error");
  }
}