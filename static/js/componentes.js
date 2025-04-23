if (!window.ComponentesObsoletos) {
    const ComponentesObsoletos = (() => {
        // Función para cargar y filtrar los componentes
        const cargarComponentes = async (filtros = {}) => {
            try {
                // Mostrar loader
                const tabla = document.getElementById('tablaComponentesObsoletos');
                if (!tabla) return;
                
                tabla.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Cargando...</span>
                            </div>
                        </td>
                    </tr>`;

                // Construir parámetros de filtro
                const params = new URLSearchParams();
                if (filtros.inventario) params.append('inventario', filtros.inventario);
                if (filtros.tipo) params.append('tipo', filtros.tipo);
                if (filtros.fecha) {
                    const fechaLimite = calcularFechaLimite(filtros.fecha);
                    if (fechaLimite) {
                        params.append('fecha_desde', fechaLimite.toISOString());
                    }
                }

                const response = await fetch(`/api/componentes_obsoletos?${params.toString()}`);
                
                if (!response.ok) {
                    throw new Error(`Error HTTP: ${response.status}`);
                }

                const data = await response.json();

                // Verificar si hay error de acceso
                if (data.error) {
                    tabla.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center text-danger">
                                ${data.error}
                            </td>
                        </tr>`;
                    return;
                }

                // Mostrar resultados
                tabla.innerHTML = '';

                if (data.length === 0) {
                    tabla.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center text-muted">
                                No se encontraron componentes con los filtros aplicados
                            </td>
                        </tr>`;
                    return;
                }

                data.forEach(comp => {
                    const fila = document.createElement('tr');
                    fila.innerHTML = `
                        <td>${comp.tipo_componente || 'N/A'}</td>
                        <td>${comp.inventario || 'N/A'}</td>
                        <td>${comp.modelo || 'N/A'}</td>
                        <td>${comp.motivo || 'N/A'}</td>
                        <td>${comp.fecha_marcado || 'N/A'}</td>
                        <td>${comp.numero_inventario_computadora || 'N/A'}</td>
                        <td>${comp.empleado || 'Sin asignar'}</td>
                    `;
                    tabla.appendChild(fila);
                });

            } catch (err) {
                console.error('Error al cargar componentes:', err);
                const tabla = document.getElementById('tablaComponentesObsoletos');
                if (tabla) {
                    tabla.innerHTML = `
                        <tr>
                            <td colspan="6" class="text-center text-danger">
                                Error al cargar los datos. Por favor intente nuevamente.
                            </td>
                        </tr>`;
                }
            }
        };

        // Función auxiliar para calcular fechas límite
        const calcularFechaLimite = (rango) => {
            const ahora = new Date();
            switch(rango) {
                case 'ultimo_mes':
                    return new Date(ahora.setMonth(ahora.getMonth() - 1));
                case 'ultimos_3_meses':
                    return new Date(ahora.setMonth(ahora.getMonth() - 3));
                case 'ultimo_anio':
                    return new Date(ahora.setFullYear(ahora.getFullYear() - 1));
                default:
                    return null;
            }
        };

        // Función para aplicar filtros
        const aplicarFiltros = () => {
            const filtros = {
                inventario: document.getElementById('filtroInventario')?.value.trim(),
                tipo: document.getElementById('filtroTipo')?.value,
                fecha: document.getElementById('filtroFecha')?.value
            };
            cargarComponentes(filtros);
        };

        // Función para limpiar filtros
        const limpiarFiltros = () => {
            const filtroInventario = document.getElementById('filtroInventario');
            const filtroTipo = document.getElementById('filtroTipo');
            const filtroFecha = document.getElementById('filtroFecha');
            
            if (filtroInventario) filtroInventario.value = '';
            if (filtroTipo) filtroTipo.value = '';
            if (filtroFecha) filtroFecha.value = '';
            
            cargarComponentes();
        };

        // Configurar eventos
        const configurarEventos = () => {
            const btnAplicar = document.getElementById('aplicarFiltrosComponentes');
            const btnLimpiar = document.getElementById('limpiarFiltrosComponentes');
            const inputInventario = document.getElementById('filtroInventario');
            
            if (btnAplicar) {
                btnAplicar.addEventListener('click', aplicarFiltros);
            }
            
            if (btnLimpiar) {
                btnLimpiar.addEventListener('click', limpiarFiltros);
            }
            
            if (inputInventario) {
                inputInventario.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        aplicarFiltros();
                    }
                });
            }
        };

        const btnExportar = document.getElementById('btnExportarExcel');
        if (btnExportar) {
            btnExportar.addEventListener('click', () => {
                const inventario = document.getElementById('filtroInventario')?.value.trim();
                const tipo = document.getElementById('filtroTipo')?.value;
                const fecha = document.getElementById('filtroFecha')?.value;
        
                const params = new URLSearchParams();
                if (inventario) params.append('inventario', inventario);
                if (tipo) params.append('tipo', tipo);
                if (fecha) {
                    const fechaLimite = calcularFechaLimite(fecha);
                    if (fechaLimite) {
                        params.append('fecha_desde', fechaLimite.toISOString());
                    }
                }
        
                // Redirige para descargar el Excel
                window.location.href = `/reporte/componentes_obsoletos/excel?${params.toString()}`;
            });
        }
        
        // Inicializar
        const init = () => {
            configurarEventos();
            cargarComponentes();
        };

        return {
            init,
            aplicarFiltros,
            limpiarFiltros
        };
    })();

    // Guardar en el global
    window.ComponentesObsoletos = ComponentesObsoletos;

    // Ejecutar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ComponentesObsoletos.init);
    } else {
        ComponentesObsoletos.init();
    }
}
