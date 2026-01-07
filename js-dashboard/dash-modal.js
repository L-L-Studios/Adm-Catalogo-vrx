// dash-modal.js - VERSIÓN COMPLETA Y FUNCIONAL

// dash-modal.js - VERSIÓN SIN COLUMNA 'estado'

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

    // Formatear el texto del costo extra si existe
    let costoExtraHTML = "";
    if (p.costo_extra) {
      const textoCostoExtra = p.costo_extra.replace(/Token:.*?\|/g, '').trim();
      if (textoCostoExtra && textoCostoExtra !== '') {
        costoExtraHTML = `<p><strong>📝 Notas/costo extra:</strong> ${textoCostoExtra}</p>`;
      }
    }

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
          <p><strong>📅 Fecha pedido:</strong> ${new Date(p.created_at).toLocaleString()}</p>
          ${costoExtraHTML}
          ${p.fecha_entrega_max ? `<p><strong>📅 Fecha máxima de entrega:</strong> ${new Date(p.fecha_entrega_max).toLocaleDateString()}</p>` : ""}
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
    let camisasHTML = '<div class="row g-3"><h5>🛒 Productos</h5>';
    
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
                  <small class="text-muted">✏️ Extra solicitado por cliente:</small>
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

    // Agregar botones de acción si es pedido pendiente
    const modalFooter = document.querySelector("#modalPedido .modal-footer");
    
    if (tabla === "pedidos_camisas" && p.estado === "pendiente") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
        <button class="btn btn-danger" onclick="rechazarPedido('${p.id}')">
          Rechazar
        </button>
        <button class="btn btn-success" onclick="mostrarFormularioAprobacion('${p.id}')">
          Aprobar
        </button>
      `;
    } else if (tabla === "pedidos_completados") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
        <button class="btn btn-danger" onclick="eliminarCompletado('${p.id}')">
          Eliminar
        </button>
      `;
    } else if (tabla === "pedidos_rechazados") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
        <button class="btn btn-warning" onclick="reconsiderarPedido('${p.id}')">
          Reconsiderar
        </button>
        <button class="btn btn-danger" onclick="eliminarRechazado('${p.id}')">
          Eliminar
        </button>
      `;
    } else {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
      `;
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById("modalPedido"));
    modal.show();

  } catch (error) {
    console.error("Error en verPedido:", error);
    Swal.fire("Error", "Ocurrió un error al cargar el pedido", "error");
  }
}

// Función para mostrar formulario de aprobación
async function mostrarFormularioAprobacion(id) {
  try {
    const { data: pedido } = await supabase
      .from("pedidos_camisas")
      .select("*")
      .eq("id", id)
      .single();

    if (!pedido) {
      Swal.fire("Error", "No se encontró el pedido", "error");
      return;
    }

    // Cerrar modal actual
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalPedido"));
    if (modal) modal.hide();

    // Obtener costo extra solicitado por el cliente
    let costoExtraSolicitado = "";
    try {
      const camisasData = typeof pedido.camisas === 'string' ? JSON.parse(pedido.camisas) : pedido.camisas;
      camisasData.forEach(item => {
        if (item.costo_extra && item.costo_extra.trim() !== '') {
          costoExtraSolicitado += (costoExtraSolicitado ? " | " : "") + item.costo_extra;
        }
      });
    } catch (e) {
      console.error("Error obteniendo costo extra:", e);
    }

    // Mostrar formulario de aprobación
    const { value: formValues } = await Swal.fire({
      title: 'Aprobar Pedido',
      html: `
        <div class="text-start">
          <p><strong>Cliente:</strong> ${pedido.nombre}</p>
          <p><strong>Total actual:</strong> $${Number(pedido.total || 0).toFixed(2)}</p>
          
          ${costoExtraSolicitado ? `
            <div class="alert alert-info mb-3">
              <small><strong>✏️ Extra solicitado por cliente:</strong><br>
              ${costoExtraSolicitado}</small>
            </div>
          ` : ''}
          
          <div class="mb-3">
            <label class="form-label"><strong>Costo extra adicional</strong> (si aplica)</label>
            <input type="number" id="costo-extra" class="form-control" 
                  placeholder="0.00" min="0" step="0.01" value="0">
            <small class="text-muted">Agregar costo adicional por modificaciones/adicionales del administrador</small>
          </div>
          
          <div class="mb-3">
            <label class="form-label"><strong>Fecha máxima de entrega</strong> *</label>
            <input type="date" id="fecha-entrega" class="form-control" 
                  min="${new Date().toISOString().split('T')[0]}" required>
            <small class="text-muted">Fecha límite para entregar el pedido</small>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Aprobar y Enviar Correo',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const costoExtra = parseFloat(document.getElementById('costo-extra').value) || 0;
        const fechaEntrega = document.getElementById('fecha-entrega').value;
        
        if (costoExtra < 0) {
          Swal.showValidationMessage('El costo extra no puede ser negativo');
          return false;
        }
        
        if (!fechaEntrega) {
          Swal.showValidationMessage('Debe establecer una fecha de entrega');
          return false;
        }
        
        return {
          costoExtra,
          fechaEntrega
        };
      }
    });

    if (formValues) {
      await aprobarPedido(id, formValues.costoExtra, costoExtraSolicitado, formValues.fechaEntrega);
    }
  } catch (error) {
    console.error("Error en mostrarFormularioAprobacion:", error);
    Swal.fire("Error", "Ocurrió un error al procesar la aprobación", "error");
  }
}

// dash-modal.js - VERSIÓN CON ID GENERADO Y SIN ESTADO

// Función para generar un ID único
function generarUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function aprobarPedido(id, costoExtra, costoExtraSolicitado, fechaEntrega) {
  try {
    // Obtener pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos_camisas")
      .select("*")
      .eq("id", id)
      .single();

    if (pedidoError || !pedido) {
      Swal.fire("Error", "No se encontró el pedido", "error");
      return;
    }

    // Calcular nuevo total
    const totalActual = parseFloat(pedido.total) || 0;
    const nuevoTotal = totalActual + costoExtra;
    
    // Preparar costo extra
    let costoExtraTexto = "";
    if (costoExtraSolicitado) {
      costoExtraTexto += `Solicitado por cliente: ${costoExtraSolicitado}`;
    }
    if (costoExtra > 0) {
      if (costoExtraTexto) costoExtraTexto += " | ";
      costoExtraTexto += `Costo adicional administrador: $${costoExtra.toFixed(2)}`;
    }

    // Confirmar
    const confirm = await Swal.fire({
      title: 'Confirmar Aprobación',
      html: `
        <div class="text-start">
          <p><strong>Cliente:</strong> ${pedido.nombre}</p>
          <p><strong>Total original:</strong> $${totalActual.toFixed(2)}</p>
          ${costoExtra > 0 ? `<p><strong>Costo extra adicional:</strong> +$${costoExtra.toFixed(2)}</p>` : ''}
          <p><strong>Total final:</strong> $${nuevoTotal.toFixed(2)}</p>
          <p><strong>Fecha de entrega:</strong> ${new Date(fechaEntrega).toLocaleDateString()}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Aprobar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    // 1. Insertar en completados - CON ID GENERADO
    const datosCompletados = {
      id: generarUUID(), // <-- GENERAR ID MANUALMENTE
      nombre: pedido.nombre,
      email: pedido.email,
      direccion: pedido.direccion,
      whatsapp: pedido.whatsapp,
      metodo_pago: pedido.metodo_pago,
      camisas: pedido.camisas,
      total: nuevoTotal,
      costo_extra: costoExtraTexto,
      fecha_entrega_max: fechaEntrega,
      created_at: pedido.created_at,
      completed_at: new Date().toISOString(),
      tipo_pedido: 'nuevos'
    };

    console.log("Insertando en completados:", datosCompletados);

    const { error: insertError } = await supabase.from("pedidos_completados").insert(datosCompletados);

    if (insertError) {
      console.error("Error insertando en completados:", insertError);
      Swal.fire("Error", "No se pudo completar el pedido. Error: " + insertError.message, "error");
      return;
    }

    // 2. Opcional: Enviar correo
    let correoEnviado = { success: false };
    try {
      correoEnviado = await enviarCorreoAprobacion(pedido, nuevoTotal, costoExtra, costoExtraSolicitado, fechaEntrega);
    } catch (emailError) {
      console.error("Error enviando correo:", emailError);
    }

    // 3. Eliminar de pendientes
    const { error: deleteError } = await supabase.from("pedidos_camisas").delete().eq("id", id);
    
    if (deleteError) {
      console.error("Error eliminando de pendientes:", deleteError);
    }

    // Mostrar resultado
    Swal.fire({
      icon: "success",
      title: "¡Aprobado!",
      html: `
        <div class="text-start">
          <p>Pedido aprobado exitosamente</p>
          ${correoEnviado.success ? '<p>✓ Correo enviado al cliente</p>' : '<p>⚠️ Correo no enviado</p>'}
          <p><strong>Total final:</strong> $${nuevoTotal.toFixed(2)}</p>
          <p><strong>Fecha entrega:</strong> ${new Date(fechaEntrega).toLocaleDateString()}</p>
        </div>
      `,
      timer: 3000,
      showConfirmButton: false
    });

    // Recargar vista
    setTimeout(() => {
      if (window.cargarVista) {
        window.cargarVista('pendientes');
      }
    }, 1000);

  } catch (error) {
    console.error("Error aprobando pedido:", error);
    Swal.fire("Error", "Ocurrió un error al aprobar el pedido", "error");
  }
}

async function rechazarPedido(id) {
  try {
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos_camisas")
      .select("*")
      .eq("id", id)
      .single();

    if (pedidoError || !pedido) {
      Swal.fire("Error", "No se encontró el pedido", "error");
      return;
    }

    const { value: motivo } = await Swal.fire({
      title: 'Rechazar Pedido',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo (opcional)',
      inputPlaceholder: 'Ingrese el motivo por el cual se rechaza el pedido...',
      inputAttributes: {
        'aria-label': 'Motivo del rechazo'
      },
      showCancelButton: true,
      confirmButtonText: 'Continuar',
      cancelButtonText: 'Cancelar'
    });

    // Si usuario canceló
    if (motivo === undefined) return;

    const confirm = await Swal.fire({
      icon: "warning",
      title: "Confirmar Rechazo",
      html: `
        <div class="text-start">
          <p>El pedido será movido a <strong>Pedidos Rechazados</strong></p>
          <p><strong>Cliente:</strong> ${pedido.nombre}</p>
          <p><strong>Total:</strong> $${Number(pedido.total || 0).toFixed(2)}</p>
          ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545"
    });

    if (!confirm.isConfirmed) return;

    // 1. Insertar en rechazados - CON ID GENERADO
    const datosRechazados = {
      id: generarUUID(), // <-- GENERAR ID MANUALMENTE
      nombre: pedido.nombre,
      email: pedido.email,
      direccion: pedido.direccion,
      whatsapp: pedido.whatsapp,
      metodo_pago: pedido.metodo_pago,
      camisas: pedido.camisas,
      total: pedido.total,
      costo_extra: pedido.costo_extra,
      motivo_rechazo: motivo || 'Sin motivo especificado',
      created_at: pedido.created_at,
      rejected_at: new Date().toISOString(),
      tipo_pedido: 'nuevos'
    };

    console.log("Insertando en rechazados:", datosRechazados);

    const { error: insertError } = await supabase.from("pedidos_rechazados").insert(datosRechazados);

    if (insertError) {
      console.error("Error insertando en rechazados:", insertError);
      Swal.fire("Error", "No se pudo mover el pedido a rechazados. Error: " + insertError.message, "error");
      return;
    }

    // 2. Eliminar de pendientes
    const { error: deleteError } = await supabase.from("pedidos_camisas").delete().eq("id", id);

    if (deleteError) {
      console.error("Error eliminando de pendientes:", deleteError);
      Swal.fire("Error", "No se pudo completar el rechazo", "error");
      return;
    }

    // Cerrar modal
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalPedido"));
    if (modal) modal.hide();

    Swal.fire({
      icon: "success",
      title: "¡Rechazado!",
      html: `
        <div class="text-start">
          <p>Pedido movido a <strong>Pedidos Rechazados</strong></p>
          <p class="text-muted small">Puedes reconsiderarlo desde la sección de rechazados.</p>
        </div>
      `,
      timer: 3000,
      showConfirmButton: false
    });

    // Recargar vista
    setTimeout(() => {
      if (window.cargarVista) {
        window.cargarVista('pendientes');
      }
    }, 1000);

  } catch (error) {
    console.error("Error en rechazarPedido:", error);
    Swal.fire("Error", "Ocurrió un error al rechazar el pedido", "error");
  }
}

// Función para enviar correo de aprobación (opcional - se puede saltar)
async function enviarCorreoAprobacion(pedido, totalFinal, costoExtra, costoExtraSolicitado, fechaEntrega) {
  try {
    // Si no quieres usar correo, solo retorna éxito
    return { success: true };
    
    // Si quieres usar EmailJS, descomenta el código siguiente:
    /*
    if (typeof emailjs === "undefined") {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js";
        script.onload = resolve;
        document.body.appendChild(script);
      });
    }

    emailjs.init('3OTktLhSaXJkgGTcX');

    const templateParams = {
      cliente: pedido.nombre,
      email_cliente: pedido.email,
      total_original: Number(pedido.total || 0).toFixed(2),
      costo_extra: Number(costoExtra || 0).toFixed(2),
      total_final: Number(totalFinal).toFixed(2),
      fecha_entrega: new Date(fechaEntrega).toLocaleDateString(),
      extras_cliente: costoExtraSolicitado || "Ninguno"
    };

    const result = await emailjs.send(
      'pedido_vrx_cliente',
      'template_zsf55a3',
      templateParams
    );

    return { success: true, result };
    */
    
  } catch (error) {
    console.error("Error enviando correo:", error);
    return { success: false, error };
  }
}

// Función para ver pedidos completados o rechazados
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

    // Información básica
    let costoExtraHTML = "";
    if (p.costo_extra) {
      const textoCostoExtra = p.costo_extra.replace(/Token:.*?\|/g, '').trim();
      if (textoCostoExtra && textoCostoExtra !== '') {
        costoExtraHTML = `<p><strong>📝 Notas:</strong> ${textoCostoExtra}</p>`;
      }
    }

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
          ${costoExtraHTML}
          ${p.mensaje ? `<p><strong>💬 Mensaje:</strong> ${p.mensaje}</p>` : ""}
          ${p.fecha_entrega_max ? `<p><strong>📅 Fecha entrega:</strong> ${new Date(p.fecha_entrega_max).toLocaleDateString()}</p>` : ""}
          ${p.motivo_rechazo ? `<p><strong>❌ Motivo rechazo:</strong> ${p.motivo_rechazo}</p>` : ""}
        </div>
      </div>
      <hr>
    `;

    document.getElementById("pedido-info").innerHTML = infoHTML;

    // Contenedor para productos
    const cont = document.getElementById("pedido-camisas");
    cont.innerHTML = "";

    if (p.camisas) {
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

    // Agregar botones de acción
    const modalFooter = document.querySelector("#modalPedido .modal-footer");
    
    if (tabla === "pedidos_completados") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
        <button class="btn btn-danger" onclick="eliminarCompletado('${p.id}')">
          Eliminar
        </button>
      `;
    } else if (tabla === "pedidos_rechazados") {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
        <button class="btn btn-warning" onclick="reconsiderarPedido('${p.id}')">
          Reconsiderar
        </button>
        <button class="btn btn-danger" onclick="eliminarRechazado('${p.id}')">
          Eliminar
        </button>
      `;
    } else {
      modalFooter.innerHTML = `
        <button class="btn btn-secondary" data-bs-dismiss="modal">
          Cerrar
        </button>
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

// Función para eliminar completado
async function eliminarCompletado(id) {
  const confirm = await Swal.fire({
    icon: "warning",
    title: "Eliminar pedido completado",
    text: "Esta acción es permanente y no se puede deshacer",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545"
  });

  if (!confirm.isConfirmed) return;

  const { error } = await supabase.from("pedidos_completados").delete().eq("id", id);

  if (error) {
    Swal.fire("Error", "No se pudo eliminar el pedido", "error");
    return;
  }

  Swal.fire("Eliminado", "Pedido eliminado exitosamente", "success");
  
  const modal = bootstrap.Modal.getInstance(document.getElementById("modalPedido"));
  if (modal) modal.hide();
  
  setTimeout(() => {
    if (window.cargarVista) {
      window.cargarVista("completados");
    }
  }, 500);
}

// Función para eliminar rechazado
async function eliminarRechazado(id) {
  const confirm = await Swal.fire({
    icon: "warning",
    title: "Eliminar pedido rechazado",
    text: "Esta acción es permanente y no se puede deshacer",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#dc3545"
  });

  if (!confirm.isConfirmed) return;

  const { error } = await supabase.from("pedidos_rechazados").delete().eq("id", id);

  if (error) {
    Swal.fire("Error", "No se pudo eliminar el pedido", "error");
    return;
  }

  Swal.fire("Eliminado", "Pedido eliminado exitosamente", "success");
  
  const modal = bootstrap.Modal.getInstance(document.getElementById("modalPedido"));
  if (modal) modal.hide();
  
  setTimeout(() => {
    if (window.cargarVista) {
      window.cargarVista("rechazados");
    }
  }, 500);
}

// Función para reconsiderar pedido rechazado
async function reconsiderarPedido(id) {
  try {
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos_rechazados")
      .select("*")
      .eq("id", id)
      .single();

    if (pedidoError || !pedido) {
      Swal.fire("Error", "No se encontró el pedido", "error");
      return;
    }

    const confirm = await Swal.fire({
      icon: "question",
      title: "Reconsiderar pedido",
      html: `
        <div class="text-start">
          <p><strong>¿Desea volver a poner este pedido en pendientes?</strong></p>
          <p><strong>Cliente:</strong> ${pedido.nombre}</p>
          <p><strong>Total:</strong> $${Number(pedido.total || 0).toFixed(2)}</p>
          ${pedido.motivo_rechazo ? `<p><strong>Motivo anterior:</strong> ${pedido.motivo_rechazo}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Sí, reconsiderar",
      cancelButtonText: "Cancelar"
    });

    if (!confirm.isConfirmed) return;

    // Reinsertar en pendientes
    const { error: insertError } = await supabase.from("pedidos_camisas").insert({
      nombre: pedido.nombre,
      email: pedido.email,
      direccion: pedido.direccion,
      whatsapp: pedido.whatsapp,
      metodo_pago: pedido.metodo_pago,
      camisas: pedido.camisas,
      total: pedido.total,
      estado: 'pendiente',
      costo_extra: pedido.costo_extra,
      created_at: pedido.created_at || new Date().toISOString()
    });

    if (insertError) {
      console.error("Error insertando en pendientes:", insertError);
      Swal.fire("Error", "No se pudo reconsiderar el pedido", "error");
      return;
    }

    // Eliminar de rechazados
    const { error: deleteError } = await supabase.from("pedidos_rechazados").delete().eq("id", id);

    if (deleteError) {
      console.error("Error eliminando de rechazados:", deleteError);
      Swal.fire("Error", "No se pudo completar la reconsideración", "error");
      return;
    }

    const modal = bootstrap.Modal.getInstance(document.getElementById("modalPedido"));
    if (modal) modal.hide();

    Swal.fire({
      icon: "success",
      title: "¡Reconsiderado!",
      html: `
        <div class="text-start">
          <p>Pedido movido a <strong>Pedidos Pendientes</strong></p>
          <p class="text-muted small">Ahora aparece en la sección de pendientes.</p>
        </div>
      `,
      timer: 3000,
      showConfirmButton: false
    });

    setTimeout(() => {
      if (window.cargarVista) {
        window.cargarVista('pendientes');
      }
    }, 1000);

  } catch (error) {
    console.error("Error en reconsiderarPedido:", error);
    Swal.fire("Error", "Ocurrió un error al reconsiderar el pedido", "error");
  }
}

// Hacer las funciones disponibles globalmente
window.verPedido = verPedido;
window.verPedidoGeneral = verPedidoGeneral;
window.mostrarFormularioAprobacion = mostrarFormularioAprobacion;
window.aprobarPedido = aprobarPedido;
window.rechazarPedido = rechazarPedido;
window.enviarCorreoAprobacion = enviarCorreoAprobacion;
window.eliminarCompletado = eliminarCompletado;
window.eliminarRechazado = eliminarRechazado;
window.reconsiderarPedido = reconsiderarPedido;