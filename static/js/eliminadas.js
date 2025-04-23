// ✅ Solo si no ha sido definido antes
if (!window.Eliminadas) {
    const Eliminadas = (() => {
        // Función principal para cargar datos
        const cargar = async () => {
            try {
                const response = await fetch('/api/computadoras_eliminadas');
                if (!response.ok) throw new Error('Error al obtener eliminadas');
                const data = await response.json();

                const tabla = document.getElementById('tablaEliminadas');
                if (!tabla) return;

                tabla.innerHTML = '';

                if (data.length === 0) {
                    tabla.innerHTML = `<tr><td colspan="9" class="text-center">No hay registros</td></tr>`;
                    return;
                }

                data.forEach(comp => {
                    const tr = document.createElement("tr");
                
                    // Asignar los atributos que los filtros necesitan
                    tr.dataset.estado = comp.estado;
                    tr.dataset.tipo = comp.tipo_propiedad;
                
                    tr.innerHTML = `
                        <td>${comp.numero_inventario}</td>
                        <td>${comp.estado}</td>
                        <td>${comp.departamento}</td>
                        <td>${comp.ubicacion_campus}</td>
                        <td>${comp.monitor || 'N/A'}</td>
                        <td>${comp.teclado || 'N/A'}</td>
                        <td>${comp.tipo_propiedad}</td>
                        <td>${comp.fecha_eliminacion}</td>
                        <td>${comp.empleado_nombre}</td>
                    `;
                
                    tabla.appendChild(tr);
                });
            } catch (err) {
                console.error("Error al cargar eliminadas:", err);
            }
        };

        // Función para aplicar filtros
        const aplicarFiltros = () => {
            const texto = document.getElementById("filtroBusqueda")?.value.toLowerCase();
            const estado = document.getElementById("filtroEstado")?.value;
            const tipo = document.getElementById("filtroPropiedad")?.value;

            const filas = document.querySelectorAll("#tablaEliminadas tr");

            filas.forEach(fila => {
                const textoFila = fila.textContent.toLowerCase();
                const coincideTexto = textoFila.includes(texto);

                const coincideEstado = !estado || fila.dataset.estado?.toLowerCase() === estado.toLowerCase();
                const coincideTipo = !tipo || fila.dataset.tipo?.toLowerCase() === tipo.toLowerCase();

                if (coincideTexto && coincideEstado && coincideTipo) {
                    fila.style.display = "";
                } else {
                    fila.style.display = "none";
                }
            });
        };

        // Función para limpiar filtros
        const limpiarFiltros = () => {
            document.getElementById("filtroBusqueda").value = "";
            document.getElementById("filtroEstado").value = "";
            document.getElementById("filtroPropiedad").value = "";
            aplicarFiltros(); // vuelve a mostrar todo
        };

        // Configurar eventos
        const configurarEventos = () => {
            const btnAplicar = document.getElementById("aplicarFiltros");
            const btnLimpiar = document.getElementById("limpiarFiltros");
            const btnExportar = document.getElementById("btnExportarEliminadas");

            if (btnAplicar) {
                btnAplicar.addEventListener("click", aplicarFiltros);
            }

            if (btnLimpiar) {
                btnLimpiar.addEventListener("click", limpiarFiltros);
            }

            if (btnExportar) {
                btnExportar.addEventListener("click", (e) => {
                    e.preventDefault();

                    const texto = document.getElementById("filtroBusqueda")?.value.trim();
                    const estado = document.getElementById("filtroEstado")?.value;
                    const tipo = document.getElementById("filtroPropiedad")?.value;

                    const params = new URLSearchParams();
                    if (texto) params.append("texto", texto);
                    if (estado) params.append("estado", estado);
                    if (tipo) params.append("tipo", tipo);

                    window.location.href = `/reporte/exportar_excel_eliminadas?${params.toString()}`;
                });
            }
        };

        // Inicialización
        const init = () => {
            configurarEventos();
            cargar();
        };

        return { 
            init,
            cargar // Expón cargar para poder recargar cuando sea necesario
        };
    })();

    // Guardar en window para evitar doble carga
    window.Eliminadas = Eliminadas;

    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', Eliminadas.init);
    } else {
        Eliminadas.init();
    }
}

