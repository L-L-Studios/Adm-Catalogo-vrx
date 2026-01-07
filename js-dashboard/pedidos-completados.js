// pedidos-completados.js
(async function () {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-completados");

  async function cargarCompletados(filtro = "") {
    let query = supabase
      .from("pedidos_completados")
      .select("*")
      .order("completed_at", { ascending: false });

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

    const tbody = document.getElementById("tabla-completados");
    tbody.innerHTML = "";

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-4">
            No hay pedidos completados
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
          <td>${new Date(p.completed_at).toLocaleDateString()}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-primary"
              onclick="verPedidoGeneral('${p.id}', 'pedidos_completados')">
              Ver
            </button>
            <button class="btn btn-sm btn-danger"
              onclick="eliminarCompletado('${p.id}')">
              Eliminar
            </button>
          </td>
        </tr>`;
    });
  }

  if (input) {
    input.addEventListener("input", e => cargarCompletados(e.target.value));
  }

  cargarCompletados();
})();