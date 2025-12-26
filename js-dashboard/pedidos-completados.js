(async function () {

  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const { data, error } = await supabase
    .from("pedidos_completados")
    .select("*")
    .order("completed_at", { ascending: false });

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
        <td>$${Number(p.total).toFixed(2)}</td>
        <td>${new Date(p.completed_at).toLocaleDateString()}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-primary"
            onclick="verPedido('${p.id}','pedidos_completados')">
            Ver
          </button>
          <button class="btn btn-sm btn-danger"
            onclick="eliminarCompletado('${p.id}')">
            Eliminar
          </button>
        </td>
      </tr>`;
  });

})();

async function eliminarCompletado(id) {
  const r = await Swal.fire({
    icon: "warning",
    title: "Eliminar pedido",
    text: "Esta acción es permanente",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar"
  });

  if (!r.isConfirmed) return;

  await supabase.from("pedidos_completados").delete().eq("id", id);

  Swal.fire("Eliminado", "Pedido eliminado", "success");
  cargarVista("completados");
}
