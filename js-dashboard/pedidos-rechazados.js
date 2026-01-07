// pedidos-rechazados.js
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

    if (error) {
      console.error(error);
      return;
    }

    const tbody = document.getElementById("tabla-rechazados");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No hay pedidos rechazados
          </td>
        </tr>`;
      return;
    }

    data.forEach(p => {
      const fechaRechazo = p.rejected_at ? new Date(p.rejected_at).toLocaleDateString() : 'N/A';
      
      tbody.innerHTML += `
        <tr>
          <td>${p.nombre}</td>
          <td>${p.email}</td>
          <td>${p.total ? `$${Number(p.total).toFixed(2)}` : 'N/A'}</td>
          <td>${fechaRechazo}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary" 
              onclick="verPedidoGeneral('${p.id}', 'pedidos_rechazados')">
              Ver
            </button>
          </td>
        </tr>`;
    });
  }

  if (input) {
    input.addEventListener("input", e => cargarRechazados(e.target.value));
  }

  cargarRechazados();
})();