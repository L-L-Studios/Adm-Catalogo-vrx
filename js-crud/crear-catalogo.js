// ============================
//  VARIABLES / REFERENCIAS
// ============================
let modal = new bootstrap.Modal(document.getElementById("modalCamisa"));
let imagenesActuales = [];
let imagenesNuevas = [];

let coloresSeleccionados = [];
let tallasSeleccionadas = new Set();
let editandoID = null;


// ============================
//  UTILIDADES UI
// ============================
function abrirModalCrear() {
  resetForm();
  editandoID = null;

  document.getElementById("modalTitle").textContent = "Nueva Camisa";
  document.getElementById("modalSubtitle").textContent =
    "Completa todos los campos para agregar una nueva camisa";

  cargarIdsMotor();
  cargarCategorias();

  modal.show();
}

function resetForm() {
  document.getElementById("formCamisa").reset();
  document.getElementById("preview").innerHTML = "";
  document.getElementById("colores").innerHTML = "";

  imagenesSeleccionadas = [];
  coloresSeleccionados = [];
  tallasSeleccionadas.clear();

  document.querySelectorAll(".talla").forEach(t => t.classList.remove("active"));
}

async function ver(id) {
  const { data } = await supabase
    .from("catalogo_camisas")
    .select("*")
    .eq("id", id)
    .single();

  document.getElementById("verTitulo").textContent = data.titulo;
  document.getElementById("verCategoria").textContent = data.categoria;
  document.getElementById("verPrecio").textContent = data.precio;
  document.getElementById("verDescripcion").textContent = data.descripcion || "";

  document.getElementById("verTallas").textContent =
    (data.tallas || []).join(", ") || "—";

  // imágenes
  const contImg = document.getElementById("verImagenes");
  contImg.innerHTML = "";
  (data.imagenes || []).forEach(src => {
    contImg.innerHTML += `<img src="${src}" class="preview-img">`;
  });

  // colores
  const contCol = document.getElementById("verColores");
  contCol.innerHTML = "";
  (data.colores || []).forEach(c => {
    contCol.innerHTML += `
      <div class="color-item" title="${c.name}" style="background:${c.hex}"></div>
    `;
  });

  new bootstrap.Modal(document.getElementById("modalVer")).show();
}


// ============================
//  CARGAR IDS (tabla motor)
// ============================
async function cargarIdsMotor() {
  try {
    const { data } = await supabase.from("motor").select("id");
    const sel = document.getElementById("selectId");

    sel.innerHTML = `<option value="">— seleccionar —</option>`;
    data?.forEach(m => {
      const op = document.createElement("option");
      op.value = m.id;
      op.textContent = m.id;
      sel.appendChild(op);
    });

  } catch (e) {
    //console.warn("Tabla motor no existe todavía");
  }
}


// ============================
//  CATEGORÍAS
// ============================
async function cargarCategorias() {
  const { data } = await supabase
    .from("catalogo_camisas")
    .select("categoria");

  const sel = document.getElementById("selectCategoria");
  sel.innerHTML = `<option value="">— seleccionar —</option>`;

  const unicas = [...new Set(data?.map(r => r.categoria))];

  unicas.forEach(c => {
    const op = document.createElement("option");
    op.value = c;
    op.textContent = c;
    sel.appendChild(op);
  });
}

function agregarCategoria() {
  const valor = document.getElementById("categoria").value.trim();
  if (!valor) alerta("Escribe una categoría nueva o selecciona una existente");
}


// ============================
//  TALLAS
// ============================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".talla").forEach(talla => {
    talla.addEventListener("click", () => {
      const value = talla.dataset.talla;

      if (tallasSeleccionadas.has(value)) {
        tallasSeleccionadas.delete(value);
        talla.classList.remove("active");
      } else {
        tallasSeleccionadas.add(value);
        talla.classList.add("active");
      }
    });
  });
});



// ============================
//  COLORES
// ============================
function addColor() {
  const hex = document.getElementById("colorPicker").value;
  const name = document.getElementById("colorName").value.trim();

  if (!name) return alerta("Debes escribir el nombre del color");
  if (coloresSeleccionados.length >= 6)
    return alerta("Máximo 6 colores permitidos");

  coloresSeleccionados.push({ name, hex });
  renderColores();
  document.getElementById("colorName").value = "";
}

function renderColores() {
  const cont = document.getElementById("colores");
  cont.innerHTML = "";

  coloresSeleccionados.forEach((c, i) => {
    const div = document.createElement("div");
    div.className = "color-item";
    div.style.background = c.hex;
    div.title = c.name;

    div.onclick = () => {
      coloresSeleccionados.splice(i, 1);
      renderColores();
    };

    cont.appendChild(div);
  });
}


// ============================
//  IMÁGENES
// ============================
document.getElementById("btnAddImage").onclick = () =>
  document.getElementById("imagenes").click();

document.getElementById("imagenes").addEventListener("change", e => {
  const files = Array.from(e.target.files);

  if (imagenesActuales.length + imagenesNuevas.length + files.length > 6)
    return alerta("Solo puedes subir máximo 6 imágenes");

  imagenesNuevas.push(...files);
  renderPreview();
});


function renderPreview() {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";

  // 🔹 imágenes ya guardadas
  imagenesActuales.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.className = "preview-img";
    img.onclick = () => {
      imagenesActuales.splice(i, 1);
      renderPreview();
    };
    preview.appendChild(img);
  });

  // 🔹 imágenes nuevas
  imagenesNuevas.forEach((file, i) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.className = "preview-img";
    img.onclick = () => {
      imagenesNuevas.splice(i, 1);
      renderPreview();
    };
    preview.appendChild(img);
  });
}



// ============================
//  SUBIR IMÁGENES AL STORAGE
// ============================
async function subirImagenesStorage(id) {
  const rutas = [];

    for (let i = 0; i < imagenesNuevas.length; i++) {
    const file = imagenesNuevas[i];
    const path = `${id}/${Date.now()}-${file.name}`;

    const { error } = await supabase
      .storage.from("catalogo_camisas")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase
      .storage.from("catalogo_camisas")
      .getPublicUrl(path);

    rutas.push(data.publicUrl);
  }

  return rutas;
}


// ============================
//  GUARDAR (CREAR / EDITAR)
// ============================
document.getElementById("formCamisa").addEventListener("submit", async e => {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value.trim();
  const categoria = document.getElementById("categoria").value.trim();
  const precio = parseFloat(document.getElementById("precio").value || 0);
  const descripcion = document.getElementById("descripcion").value.trim();

  if (!titulo || !categoria)
    return alerta("Completa los campos obligatorios");

  // 👉 ID ÚNICO RANDOM SOLO AL CREAR
  const id = editandoID || crypto.randomUUID();

    let imagenes = [...imagenesActuales];

    if (imagenesNuevas.length) {
    const nuevas = await subirImagenesStorage(id);
    imagenes = [...imagenesActuales, ...nuevas];
    }

  const payload = {
    id,
    titulo,
    categoria,
    precio,
    descripcion,
    imagenes,
    tallas: Array.from(tallasSeleccionadas),
    colores: coloresSeleccionados
  };

  let resp;

  if (editandoID) {
    resp = await supabase
      .from("catalogo_camisas")
      .update(payload)
      .eq("id", editandoID);
  } else {
    resp = await supabase.from("catalogo_camisas").insert([payload]);
  }

  if (resp.error)
    return alerta("Error guardando: " + resp.error.message);

  await Swal.fire({
    icon: "success",
    title: "Guardado correctamente",
    timer: 1200,
    showConfirmButton: false
  });

  cargarTabla();
  modal.hide();
});


// ============================
//  TABLA
// ============================
async function cargarTabla() {
  const { data } = await supabase
    .from("catalogo_camisas")
    .select("*")
    .order("created_at", { ascending: false });

  const body = document.getElementById("lista");
  body.innerHTML = "";

data?.forEach(r => {
  const img = r.imagenes?.[0] || "/img/no-image.png";

  body.innerHTML += `
    <tr>
      <td><img src="${img}" class="producto-img"></td>
      <td>${r.titulo}</td>
      <td>${r.categoria}</td>
      <td>$${Number(r.precio).toFixed(2)}</td>
      <td>${r.tallas?.join(", ") || "—"}</td>
      <td class="text-end acciones-btn">

        <button class="btn-accion btn-ver" onclick="ver('${r.id}')">
          <i class="fas fa-eye"></i>
        </button>

        <button class="btn-accion btn-editar" onclick="editar('${r.id}')">
          <i class="fas fa-edit"></i>
        </button>

        <button class="btn-accion btn-eliminar" onclick="eliminar('${r.id}')">
          <i class="fas fa-trash"></i>
        </button>

      </td>
    </tr>
  `;

  });
}

// 👉 cargar tabla SOLO cuando supabase está listo
window.addEventListener("supabase-ready", () => cargarTabla());


// ============================
//  EDITAR
// ============================
async function editar(id) {
  const { data } = await supabase
    .from("catalogo_camisas")
    .select("*")
    .eq("id", id)
    .single();

  abrirModalCrear();
  editandoID = id;

  document.getElementById("modalTitle").textContent = "Editar Camisa";

  document.getElementById("titulo").value = data.titulo;
  document.getElementById("categoria").value = data.categoria;
  document.getElementById("precio").value = data.precio;
  document.getElementById("descripcion").value = data.descripcion || "";

  // --- TALLAS ---
  tallasSeleccionadas = new Set(data.tallas || []);
  document.querySelectorAll(".talla").forEach(t => {
    if (tallasSeleccionadas.has(t.dataset.talla)) t.classList.add("active");
  });

  // --- COLORES ---
  coloresSeleccionados = data.colores || [];
  renderColores();

  // --- IMÁGENES ---
    imagenesActuales = [...(data.imagenes || [])];
    imagenesNuevas = [];
    renderPreview();
}





// ============================
//  ELIMINAR
// ============================
async function eliminar(id) {

  const r = await Swal.fire({
    title: "¿Eliminar este producto?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar"
  });

  if (!r.isConfirmed) return;

  const { error } = await supabase
    .from("catalogo_camisas")
    .delete()
    .eq("id", id);

  if (error) return alerta("Error eliminando");

  await Swal.fire({
    icon: "success",
    text: "Eliminado correctamente",
    timer: 1200,
    showConfirmButton: false
  });

  cargarTabla();
}


// ============================
//  FILTRO BÚSQUEDA
// ============================
document.getElementById("filtro").addEventListener("keyup", async e => {
  const q = e.target.value.toLowerCase();

  const { data } = await supabase.from("catalogo_camisas").select("*");

  const filtrado = data.filter(
    x =>
      x.titulo.toLowerCase().includes(q) ||
      x.categoria.toLowerCase().includes(q) ||
      x.id.toLowerCase().includes(q)
  );

  const body = document.getElementById("lista");
  body.innerHTML = "";

  filtrado.forEach(r => {
    body.innerHTML += `
      <tr>
        <td><img src="${r.imagenes?.[0] || ""}" class="producto-img"></td>
        <td>${r.titulo}</td>
        <td>${r.categoria}</td>
        <td>$${r.precio}</td>
        <td>${r.tallas?.length || 0}</td>
        <td class="text-end acciones-btn">
          <button class="btn-accion btn-editar" onclick="editar('${r.id}')">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-accion btn-eliminar" onclick="eliminar('${r.id}')">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`;
  });
});


// ============================
//  ALERTA SWEETALERT
// ============================
function alerta(msg) {
  Swal.fire({
    icon: "warning",
    title: "Aviso",
    text: msg
  });
}
