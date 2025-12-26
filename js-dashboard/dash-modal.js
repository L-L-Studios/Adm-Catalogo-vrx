// ===== MODAL =====
async function verPedido(id, tabla = "pedidos") {
  const { data: p } = await supabase
    .from(tabla)
    .select("*")
    .eq("id", id)
    .single();

  document.getElementById("pedido-info").innerHTML = `
    <p><strong>Cliente:</strong> ${p.nombre}</p>
    <p><strong>Email:</strong> ${p.email}</p>
    <p><strong>Total:</strong> $${Number(p.total).toFixed(2)}</p>
    <hr>
  `;

  const cont = document.getElementById("pedido-camisas");
  cont.innerHTML = "";

  const items = p.camisas.split(",").map(c => c.trim());

  items.forEach(i => {
    const [nombre, talla, color, cantidad] =
      i.split("|").map(x => x.trim());

    cont.innerHTML += `
      <div class="col-md-6">
        <div class="card shadow-sm h-100">
          <div class="card-body">
            <h6>${nombre}</h6>
            <p class="mb-1">👕 Talla: ${talla}</p>
            <p class="mb-1">🎨 Color: ${color}</p>
            <p class="fw-bold">${cantidad}</p>
          </div>
        </div>
      </div>
    `;
  });

  const modal = new bootstrap.Modal(
    document.getElementById("modalPedido")
  );
  modal.show();
}
