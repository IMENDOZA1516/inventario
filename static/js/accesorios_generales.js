if (!window.AccesoriosGenerales) {
    const AccesoriosGenerales = (() => {
        let empleadoSeleccionado = null;

        const mostrarInfoEmpleado = (empleado) => {
            const contenedor = document.getElementById('infoEmpleado');
            if (!contenedor) return;

            contenedor.innerHTML = `
                <div class="card shadow-sm mb-3">
                    <div class="card-body">
                        <h5 class="card-title">👤 ${empleado.nombre}</h5>
                        <p class="mb-1"><strong>📧 Correo:</strong> ${empleado.email}</p>
                        <p class="mb-0"><strong>🏢 Campus:</strong> ${empleado.campus}</p>
                    </div>
                </div>
            `;
            contenedor.style.display = 'block';
        };

        const mostrarAccesorios = (accesorios) => {
            const tabla = document.getElementById('tablaAccesoriosGenerales');
            if (!tabla) return;

            tabla.innerHTML = '';

            if (accesorios.length === 0) {
                tabla.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay accesorios asignados</td></tr>';
                return;
            }

            accesorios.forEach(acc => {
                const fila = document.createElement('tr');
                fila.innerHTML = `
                    <td>${acc.tipo}</td>
                    <td>${acc.numero_inventario}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="AccesoriosGenerales.eliminarAccesorio(${acc.id})">
                            <i class="bi bi-trash"></i> Marcar como obsoleto
                        </button>
                    </td>
                `;
                tabla.appendChild(fila);
            });
        };

        const cargarEmpleados = async () => {
            try {
                const response = await fetch('/empleados_json');
                if (!response.ok) throw new Error('Error al cargar empleados');
                const data = await response.json();

                const select = document.getElementById('empleadoSelectGeneral');
                if (!select) return;

                select.innerHTML = '<option value="">Seleccione un empleado...</option>';
                data.forEach(emp => {
                    const option = document.createElement('option');
                    option.value = emp.id;
                    option.textContent = emp.nombre;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error:', error);
                alert('Error al cargar la lista de empleados');
            }
        };

        const cargarAccesorios = async (empleadoId) => {
            try {
                const response = await fetch(`/accesorios_generales/${empleadoId}`);
                if (!response.ok) throw new Error('Error al cargar accesorios');
                const data = await response.json();

                mostrarInfoEmpleado(data.empleado);
                mostrarAccesorios(data.accesorios);
                document.getElementById('seccionAccesorios').style.display = 'block';
            } catch (error) {
                console.error('Error:', error);
                alert('Error al cargar los accesorios');
            }
        };

        const manejarCambioEmpleado = (event) => {
            empleadoSeleccionado = event.target.value;
            if (empleadoSeleccionado) {
                cargarAccesorios(empleadoSeleccionado);
            } else {
                document.getElementById('seccionAccesorios').style.display = 'none';
                document.getElementById('infoEmpleado').style.display = 'none';
            }
        };

        const agregarAccesorio = async () => {
            const tipo = document.getElementById('tipoAccesorioGeneral')?.value;
            const inventario = document.getElementById('inventarioAccesorioGeneral')?.value;

            if (!tipo || !inventario || !empleadoSeleccionado) {
                alert('Por favor complete todos los campos');
                return;
            }

            try {
                const response = await fetch('/accesorios_generales', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tipo: tipo,
                        numero_inventario: inventario,
                        empleado_id: empleadoSeleccionado
                    })
                });

                if (!response.ok) throw new Error('Error en la respuesta del servidor');

                document.getElementById('tipoAccesorioGeneral').value = '';
                document.getElementById('inventarioAccesorioGeneral').value = '';
                await cargarAccesorios(empleadoSeleccionado);
            } catch (error) {
                console.error('Error:', error);
                alert('Error al agregar accesorio: ' + error.message);
            }
        };

        const eliminarAccesorio = async (id) => {
            const motivo = prompt('🛠️ Ingresa el motivo por el cual este accesorio es obsoleto:');
            if (!motivo || !motivo.trim()) {
                alert('⚠️ No se proporcionó un motivo válido.');
                return;
            }
        
            try {
                const response = await fetch(`/accesorios_generales/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ motivo: motivo.trim() })
                });
        
                if (!response.ok) throw new Error('Error en la respuesta del servidor');
        
                await cargarAccesorios(empleadoSeleccionado);
            } catch (error) {
                console.error('Error al eliminar accesorio:', error);
                alert('❌ Error al eliminar accesorio: ' + error.message);
            }
        };
        

        const init = () => {
            cargarEmpleados();

            const select = document.getElementById('empleadoSelectGeneral');
            if (select) {
                select.addEventListener('change', manejarCambioEmpleado);
            }

            const btnAgregar = document.getElementById('btnAgregarAccesorio');
            if (btnAgregar) {
                btnAgregar.addEventListener('click', agregarAccesorio);
            }
        };

        return {
            init,
            eliminarAccesorio,
            agregarAccesorio
        };
    })();

    // Inicializar y exponer
    window.AccesoriosGenerales = AccesoriosGenerales;
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', AccesoriosGenerales.init);
    } else {
        AccesoriosGenerales.init();
    }

    window.eliminarAccesorioGeneral = AccesoriosGenerales.eliminarAccesorio;
}
