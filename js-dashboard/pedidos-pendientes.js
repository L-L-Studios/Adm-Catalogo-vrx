(async function () {

  // esperar supabase
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const { data, error } = await supabase
    .from("pedidos")
    .select("*")
    .eq("status", "pendiente")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error cargando pedidos:", error);
    return;
  }

  // métricas
  document.getElementById("pedidos-actuales").textContent = data.length;

  const { count } = await supabase
    .from("pedidos")
    .select("*", { count: "exact", head: true });

  document.getElementById("pedidos-totales").textContent = count ?? 0;

  const tbody = document.getElementById("tabla-pedidos");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">
          No hay pedidos pendientes
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
          <button class="btn btn-sm btn-success"
            onclick="aprobarPedido('${p.id}')">
            Aprobar
          </button>
          <button class="btn btn-sm btn-danger"
            onclick="rechazarPedido('${p.id}')">
            Rechazar
          </button>
        </td>
      </tr>`;
  });

})();

