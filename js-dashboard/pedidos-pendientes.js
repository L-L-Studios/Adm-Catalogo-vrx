// pedidos-pendientes.js - ACTUALIZADO
(async function () {

  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 100));
  }

  const input = document.getElementById("busqueda-pendientes");

  async function cargarPendientes(filtro = "") {

    let query = supabase
      .from("pedidos_camisas")
      .select("*")
      .eq("estado", "pendiente")
      .order("created_at", { ascending: false });

    if (filtro.trim() !== "") {
      query = query.or(
        `nombre.ilike.%${filtro}%,email.ilike.%${filtro}%`
      );
    }

    const { data, error } = await query;

    if (error) return console.error(error);

    document.getElementById("pedidos-actuales").textContent = data.length;

    // Contar pedidos personalizados pendientes
    const { count: countPersonalizados } = await supabase
      .from("pedidos_personalizados")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendiente");

    document.getElementById("pedidos-personalizados").textContent = countPersonalizados ?? 0;

    // Contar total de pedidos
    const { count: countTotal } = await supabase
      .from("pedidos_camisas")
      .select("*", { count: "exact", head: true });

    document.getElementById("pedidos-totales").textContent = countTotal ?? 0;

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
            <button class="btn btn-sm btn-primary" onclick="verPedido('${p.id}')">Ver</button>
          </td>
        </tr>`;
    });
  }

  if (input) {
    input.addEventListener("input", e => cargarPendientes(e.target.value));
  }

  cargarPendientes();

})();