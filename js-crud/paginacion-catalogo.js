// ============================
//  CONFIGURACIÓN DE PAGINACIÓN
// ============================
let paginaActual = 1;
const registrosPorPagina = 10;
let datosCompletos = [];
let datosFiltrados = [];

// ============================
//  INICIALIZAR PAGINACIÓN
// ============================
function inicializarPaginacion() {
    // Escuchar el evento cuando los datos se cargan
    window.addEventListener('catalogo-datos-cargados', (e) => {
        datosCompletos = e.detail;
        datosFiltrados = [...datosCompletos];
        renderizarTabla();
        renderizarPaginacion();
    });
}

// ============================
//  RENDERIZAR TABLA CON PAGINACIÓN
// ============================
function renderizarTabla() {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    const datosPagina = datosFiltrados.slice(inicio, fin);
    
    const body = document.getElementById("lista");
    body.innerHTML = "";
    
    if (datosPagina.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="text-muted">
                        <i class="fas fa-inbox fa-2x mb-2"></i>
                        <p>No hay registros para mostrar</p>
                    </div>
                </td>
            </tr>
        `;
        actualizarContadorRegistros();
        return;
    }
    
    datosPagina.forEach(r => {
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
    
    actualizarContadorRegistros();
}

// ============================
//  RENDERIZAR CONTROLES DE PAGINACIÓN
// ============================
function renderizarPaginacion() {
    const totalPaginas = Math.ceil(datosFiltrados.length / registrosPorPagina);
    const paginacion = document.getElementById("paginacion");
    
    // Si no hay datos, no mostrar paginación
    if (totalPaginas <= 1 && datosFiltrados.length > 0) {
        paginacion.innerHTML = "";
        return;
    }
    
    let html = '';
    
    // Botón "Anterior"
    html += `
        <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1})" aria-label="Anterior">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;
    
    // Calcular rango de páginas a mostrar
    let inicioRango = Math.max(1, paginaActual - 2);
    let finRango = Math.min(totalPaginas, paginaActual + 2);
    
    // Ajustar rango si estamos cerca de los extremos
    if (paginaActual <= 3) {
        finRango = Math.min(5, totalPaginas);
    } else if (paginaActual >= totalPaginas - 2) {
        inicioRango = Math.max(totalPaginas - 4, 1);
    }
    
    // Botón primera página si no está en el rango
    if (inicioRango > 1) {
        html += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="cambiarPagina(1)">1</a>
            </li>
            ${inicioRango > 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
        `;
    }
    
    // Números de página
    for (let i = inicioRango; i <= finRango; i++) {
        html += `
            <li class="page-item ${i === paginaActual ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cambiarPagina(${i})">${i}</a>
            </li>
        `;
    }
    
    // Botón última página si no está en el rango
    if (finRango < totalPaginas) {
        html += `
            ${finRango < totalPaginas - 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
            <li class="page-item">
                <a class="page-link" href="#" onclick="cambiarPagina(${totalPaginas})">${totalPaginas}</a>
            </li>
        `;
    }
    
    // Botón "Siguiente"
    html += `
        <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1})" aria-label="Siguiente">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginacion.innerHTML = html;
}

// ============================
//  CAMBIAR PÁGINA
// ============================
function cambiarPagina(numeroPagina) {
    if (numeroPagina < 1 || numeroPagina > Math.ceil(datosFiltrados.length / registrosPorPagina)) {
        return;
    }
    
    paginaActual = numeroPagina;
    renderizarTabla();
    renderizarPaginacion();
    
    // Scroll suave hacia la tabla
    document.querySelector('.table-responsive')?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// ============================
//  ACTUALIZAR CONTADOR DE REGISTROS
// ============================
function actualizarContadorRegistros() {
    const inicio = (paginaActual - 1) * registrosPorPagina + 1;
    const fin = Math.min(paginaActual * registrosPorPagina, datosFiltrados.length);
    
    document.getElementById('registrosMostrados').textContent = 
        datosFiltrados.length > 0 ? `${inicio}-${fin}` : '0';
    document.getElementById('totalRegistros').textContent = datosFiltrados.length;
}

// ============================
//  FILTRAR DATOS (se integra con el filtro existente)
// ============================
function aplicarFiltroPaginacion(terminoBusqueda) {
    paginaActual = 1; // Resetear a primera página
    
    if (!terminoBusqueda) {
        datosFiltrados = [...datosCompletos];
    } else {
        const q = terminoBusqueda.toLowerCase();
        datosFiltrados = datosCompletos.filter(
            x =>
                x.titulo?.toLowerCase().includes(q) ||
                x.categoria?.toLowerCase().includes(q) ||
                x.id?.toLowerCase().includes(q) ||
                x.descripcion?.toLowerCase().includes(q)
        );
    }
    
    renderizarTabla();
    renderizarPaginacion();
}

// ============================
//  ACTUALIZAR DATOS DESDE EL ARCHIVO PRINCIPAL
// ============================
function actualizarDatosPaginacion(nuevosDatos) {
    datosCompletos = nuevosDatos;
    datosFiltrados = [...datosCompletos];
    paginaActual = 1;
    renderizarTabla();
    renderizarPaginacion();
}

// ============================
//  INICIALIZAR CUANDO EL DOCUMENTO ESTÉ LISTO
// ============================
document.addEventListener('DOMContentLoaded', () => {
    inicializarPaginacion();
});