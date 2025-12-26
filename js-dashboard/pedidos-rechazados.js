(async function () {

  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("status", "rechazado")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const tbody = document.getElementById("tabla-rechazados");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          No hay pedidos rechazados
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
        <td class="text-end">
          <button class="btn btn-sm btn-primary"
            onclick="verPedido('${p.id}')">
            Ver
          </button>
          <button class="btn btn-sm btn-warning"
            onclick="reconsiderarPedido('${p.id}')">
            Reconsiderar
          </button>
          <button class="btn btn-sm btn-danger"
            onclick="eliminarRechazado('${p.id}')">
            Eliminar
          </button>
        </td>
      </tr>`;
  });

})();
