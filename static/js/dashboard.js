// FUNCION PARA CARGAR COMPUTADORAS


function cargarComputadoras(pagina = 1) {
    console.log("Iniciando carga de computadoras..."); // Debug
    paginaActual = pagina;
    fetch(`/computadoras?page=${pagina}`)
        .then(response => response.json())
        .then(data => {
            const lista = document.getElementById('computadorasList');
            lista.innerHTML = '';

            fetch('/obtener_rol')
                .then(response => response.json())
                .then(userData => {
                    const userRole = userData.rol;
                    const userId = userData.id;

                    const computadorasAMostrar = (userRole === "admin")
                        ? data.computadoras
                        : data.computadoras.filter(comp => comp.empleado_id === userId);

                    computadorasAMostrar.forEach(comp => {
                        const empleado = comp.empleado;

                        const empleadoInfo = empleado ? `
                            <h5 class="text-center fw-bold">👤 ${empleado.nombre}</h5>
                            <p class="mb-1 text-center text-muted">${empleado.email}</p>
                            <p class="mb-1"><strong>📍 Departamento:</strong> ${comp.departamento}</p>
                            <p class="mb-1"><strong>🏢 Campus:</strong> ${comp.ubicacion_campus}</p>
                        ` : `
                            <h5 class="text-center text-muted">Sin empleado asignado</h5>
                            <p class="mb-1"><strong>📍 Departamento:</strong> ${comp.departamento}</p>
                            <p class="mb-1"><strong>🏢 Campus:</strong> ${comp.ubicacion_campus}</p>
                        `;

                        const computadoraInfo = `
                            <p class="mb-1 mt-2"><strong>💻 Computadora:</strong></p>
                            <ul class="mb-2">
                                <li><strong>CPU:</strong> ${comp.numero_inventario}</li>
                                <li><strong>Monitor:</strong> ${comp.monitor ?? 'N/A'}</li>
                                <li><strong>Teclado:</strong> ${comp.teclado ?? 'N/A'}</li>
                                <li><strong>Propiedad:</strong> ${comp.tipo_propiedad}</li>
                            </ul>
                        `;

                        const accesoriosInfo = (comp.accesorios && comp.accesorios.length > 0) ? `
                            <p class="mb-1"><strong>📦 Accesorios:</strong></p>
                            <ul>
                                ${comp.accesorios.map(a => `<li>${a.tipo} - Inventario #${a.numero_inventario}</li>`).join('')}
                            </ul>
                        ` : '';

                        const estadoInfo = `<p class="mb-2"><strong>🛠 Estado:</strong> ${comp.estado}</p>`;

                        const botonesAdmin = (userRole === "admin") ? `
                        <div class="d-flex gap-2 justify-content-center">
                            <button class="btn btn-warning btn-sm" onclick="editarComputadora(${comp.id})">Editar</button>
                            ${comp.tipo_propiedad === 'Alquilada' ? `
                                <button class="btn btn-danger btn-sm" onclick="eliminarComputadora(${comp.id})">Retirar del sistema</button>
                            ` : ''}
                            <button class="btn btn-secondary btn-sm" onclick="marcarObsoleta(${comp.id})">Obsoleta</button>
                        </div>
                        ` : '';

                        const card = `
                            <div class="col-md-6 col-lg-4 mb-3">
                                <div class="card shadow-sm h-100">
                                    <div class="card-body">
                                        ${empleadoInfo}
                                        ${computadoraInfo}
                                        ${accesoriosInfo}
                                        ${estadoInfo}
                                        ${botonesAdmin}
                                    </div>
                                </div>
                            </div>
                        `;

                        lista.innerHTML += card;
                    });

                    const paginacion = document.getElementById('paginacion');
                    paginacion.innerHTML = `
                        <button class="btn btn-sm btn-outline-primary me-2" ${pagina <= 1 ? 'disabled' : ''} onclick="cargarComputadoras(${pagina - 1})">Anterior</button>
                        <span>Página ${pagina}</span>
                        <button class="btn btn-sm btn-outline-primary ms-2" ${pagina >= data.total_paginas ? 'disabled' : ''} onclick="cargarComputadoras(${pagina + 1})">Siguiente</button>
                    `;
                });
        });
}

document.getElementById('addComputerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const id = document.getElementById('computerId').value;

    const data = {
        numero_inventario: document.getElementById('numeroInventario').value,
        ubicacion_campus: document.getElementById('ubicacionCampus').value,
        departamento: document.getElementById('departamento').value,
        estado: document.getElementById('estado').value,
        tipo_propiedad: document.getElementById('tipoPropiedad').value,
        monitor: document.getElementById('monitorObsoleto').checked ? null : document.getElementById('monitor').value.trim(),
        teclado: document.getElementById('tecladoObsoleto').checked ? null : document.getElementById('teclado').value.trim(),
        monitor_obsoleto: document.getElementById('monitorObsoleto').checked,
        teclado_obsoleto: document.getElementById('tecladoObsoleto').checked,
        cpu_obsoleta: document.getElementById('cpuObsoleta').checked,
        empleado_id: document.getElementById('empleadoSelect').value || null,

        // 👇 Motivos personalizados (si existen)
        motivo_monitor: document.getElementById('motivo_monitor')?.value || null,
        motivo_teclado: document.getElementById('motivo_teclado')?.value || null,
        motivo_cpu: document.getElementById('motivo_cpu')?.value || null,
    };

    const accesorios = [];
document.querySelectorAll('.accesorio-group').forEach(group => {
    const tipo = group.querySelector('.tipoAccesorio').value;
    const inventario = group.querySelector('.inventarioAccesorio').value;
    const esObsoleto = group.querySelector('.obsoletoAccesorio')?.checked || false;
    const motivo = group.querySelector('.motivoAccesorio')?.value || '';

    if (tipo && inventario) {
        accesorios.push({
            tipo,
            numero_inventario: inventario,
            obsoleto: esObsoleto,
            motivo: motivo
        });
    }
});


    data.accesorios = accesorios;

    if (id) {
        // PUT (editar computadora existente)
        fetch(`/computadoras/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                alert('Computadora actualizada correctamente');
                document.getElementById('addComputerForm').reset();
                cargarComputadoras(1);
                bootstrap.Modal.getInstance(document.getElementById('addComputerModal')).hide();
            } else {
                alert('Error al actualizar la computadora');
            }
        })
        .catch(error => console.error('Error al actualizar:', error));
    } else {
        // POST (crear nueva computadora)
        fetch('/computadoras', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                alert('Computadora agregada correctamente');
                document.getElementById('addComputerForm').reset();
                cargarComputadoras();
                bootstrap.Modal.getInstance(document.getElementById('addComputerModal')).hide();
            } else {
                alert('Error al agregar la computadora');
            }
        })
        .catch(error => console.error('Error al agregar:', error));
    }
});


//----- funcion para abrir el modal de cumputadora

function abrirModalAgregarComputadora() {
    console.log("📌 Abriendo modal de computadora...");

    // Configuración inicial del modal
    document.getElementById('modalTitle').textContent = 'Agregar Nueva Computadora';
    document.querySelector('#addComputerForm button[type="submit"]').textContent = 'Guardar Computadora';
    document.getElementById('addComputerForm').reset();
    document.getElementById('computerId').value = '';

    // Obtener referencia al modal
    const modalElement = document.getElementById('addComputerModal');
    const modal = new bootstrap.Modal(modalElement);

    // Evento que se dispara cuando el modal está completamente visible
    modalElement.addEventListener('shown.bs.modal', function() {
        console.log("🔄 Modal completamente visible, cargando empleados...");
        cargarEmpleados();
    });

    // Mostrar el modal
    modal.show();
}








function eliminarComputadora(id) {
    if (confirm('⚠️ Esta acción retirará del sistema esta computadora alquilada.\n¿Estás seguro?')) {
        fetch(`/computadoras/${id}`, { method: 'DELETE' })
        .then(response => {
            if (response.ok) {
                alert('✅ Computadora retirada correctamente');
                cargarComputadoras(paginaActual);
            } else {
                alert('❌ Error al retirar la computadora');
            }
        })
        .catch(err => {
            console.error('Error:', err);
            alert('❌ Hubo un problema al retirar la computadora.');
        });
    }
}

function editarComputadora(id) {
    fetch(`/computadoras/${id}`)
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById('modalTitle').textContent = 'Editar Computadora';
        document.querySelector('#addComputerForm button[type="submit"]').textContent = 'Guardar Cambios';

        document.getElementById('computerId').value = data.id;
        document.getElementById('numeroInventario').value = data.numero_inventario;
        document.getElementById('ubicacionCampus').value = data.ubicacion_campus;
        document.getElementById('departamento').value = data.departamento;
        document.getElementById('estado').value = data.estado;
        document.getElementById('tipoPropiedad').value = data.tipo_propiedad;
        document.getElementById('monitor').value = data.monitor || '';
        document.getElementById('teclado').value = data.teclado || '';
        document.getElementById('cpuObsoleta').checked = data.cpu_obsoleta || false;
        document.getElementById('tecladoObsoleto').checked = data.teclado_obsoleto;

        document.getElementById('empleadoFields').style.display = 'none';
        document.getElementById('empleadoSelect').removeAttribute('required');

        const accesoriosContainer = document.getElementById('accesoriosContainer');
accesoriosContainer.innerHTML = '';

if (data.accesorios && data.accesorios.length > 0) {
    data.accesorios.forEach((acc, index) => {
        const div = document.createElement('div');
        div.classList.add('mb-3', 'accesorio-group');

        div.innerHTML = `
            <div class="row g-2">
                <div class="col-md-6">
                    <label class="form-label">Tipo de Accesorio</label>
                    <select class="form-select tipoAccesorio">
                        <option value="">Seleccione...</option>
                        <option value="Teléfono">Teléfono</option>
                        <option value="Impresora">Impresora</option>
                        <option value="UPS">UPS</option>
                        <option value="Escáner">Escáner</option>
                        <option value="Servidor">Servidor</option>
                        <option value="Televisor">Televisor</option>
                        <option value="Datashow">Datashow</option>
                    </select>
                </div>
                <div class="col-md-6">
                    <label class="form-label">Número de Inventario</label>
                    <input type="text" class="form-control inventarioAccesorio" value="${acc.numero_inventario}">
                </div>
                <div class="form-check mt-2">
                    <input class="form-check-input obsoletoAccesorio" type="checkbox" ${acc.obsoleto ? 'checked' : ''}>
                    <label class="form-check-label">Marcar como obsoleto</label>
                </div>
                <input type="hidden" class="motivoAccesorio" value="${acc.motivo || ''}">
            </div>
        `;

        div.querySelector('.tipoAccesorio').value = acc.tipo;

        const checkObsoleto = div.querySelector('.obsoletoAccesorio');
        const inputMotivo = div.querySelector('.motivoAccesorio');

        checkObsoleto.addEventListener('change', () => {
            if (checkObsoleto.checked) {
                const motivo = prompt(`🛠️ Ingresa el motivo por el cual este accesorio es obsoleto:`);
                if (motivo && motivo.trim()) {
                    inputMotivo.value = motivo.trim();
                } else {
                    checkObsoleto.checked = false;
                    inputMotivo.value = '';
                }
            } else {
                inputMotivo.value = '';
            }
        });

        accesoriosContainer.appendChild(div);
    });
}


// Función auxiliar para preguntar el motivo
const registrarEventoMotivo = (checkboxId, inputId, tipoTexto) => {
    const checkbox = document.getElementById(checkboxId);
    checkbox.addEventListener("change", function () {
        const inputMotivo = document.getElementById(inputId);
        if (this.checked) {
            const motivo = prompt(`🛠️ Ingresa el motivo por el cual ${tipoTexto} es obsoleto:`);
            if (motivo && motivo.trim()) {
                inputMotivo.value = motivo.trim();
            } else {
                this.checked = false;
                inputMotivo.value = '';
            }
        } else {
            inputMotivo.value = '';
        }
    });
};

// Activar eventos
registrarEventoMotivo("monitorObsoleto", "motivo_monitor", "el MONITOR");
registrarEventoMotivo("tecladoObsoleto", "motivo_teclado", "el TECLADO");
registrarEventoMotivo("cpuObsoleta", "motivo_cpu", "la CPU");


        const modal = new bootstrap.Modal(document.getElementById('addComputerModal'));
        modal.show();
    })
    .catch(error => console.error('Error al cargar computadora:', error));
}

function Obsoletas(id) {
    if (confirm('¿Marcar esta computadora como obsoleta?')) {
        fetch(`/computadoras/${id}/obsoleta`, { method: 'PUT' })
        .then(response => response.json())
        .then(data => {
            alert(data.mensaje);
            cargarComputadoras();
        });
    }
}

function configurarBuscador() {
    const inputBuscar = document.getElementById("searchInput");
    if (!inputBuscar) return;

    inputBuscar.addEventListener("input", function () {
        const query = this.value.trim();

        if (query === "") {
            cargarComputadoras();
            return;
        }

        fetch(`/buscar_computadoras?q=${query}`)
            .then(response => response.json())
            .then(data => {
                const lista = document.getElementById('computadorasList');
                lista.innerHTML = '';

                fetch('/obtener_rol')
                    .then(response => response.json())
                    .then(userData => {
                        const userRole = userData.rol;
                        const userId = userData.id;

                        const computadorasAMostrar = (userRole === "admin")
                            ? data
                            : data.filter(comp => comp.empleado_id === userId);

                        computadorasAMostrar.forEach(comp => {
                            const empleado = comp.empleado;

                            const empleadoInfo = empleado ? `
                                <h5 class="text-center fw-bold">👤 ${empleado.nombre}</h5>
                                <p class="mb-1 text-center text-muted">${empleado.email}</p>
                                <p class="mb-1"><strong>📍 Departamento:</strong> ${comp.departamento}</p>
                                <p class="mb-1"><strong>🏢 Campus:</strong> ${comp.ubicacion_campus}</p>
                            ` : `
                                <h5 class="text-center text-muted">Sin empleado asignado</h5>
                                <p class="mb-1"><strong>📍 Departamento:</strong> ${comp.departamento}</p>
                                <p class="mb-1"><strong>🏢 Campus:</strong> ${comp.ubicacion_campus}</p>
                            `;

                            const computadoraInfo = `
                                <p class="mb-1 mt-2"><strong>💻 Computadora:</strong></p>
                                <ul class="mb-2">
                                    <li><strong>CPU:</strong> ${comp.numero_inventario}</li>
                                    <li><strong>Monitor:</strong> ${comp.monitor ?? 'N/A'}</li>
                                    <li><strong>Teclado:</strong> ${comp.teclado ?? 'N/A'}</li>
                                    <li><strong>Propiedad:</strong> ${comp.tipo_propiedad}</li>
                                </ul>
                            `;

                            const accesoriosInfo = (comp.accesorios && comp.accesorios.length > 0) ? `
                                <p class="mb-1"><strong>📦 Accesorios:</strong></p>
                                <ul>
                                    ${comp.accesorios.map(a => `<li>${a.tipo} - Inventario #${a.numero_inventario}</li>`).join('')}
                                </ul>
                            ` : '';

                            const estadoInfo = `<p class="mb-2"><strong>🛠 Estado:</strong> ${comp.estado}</p>`;

                            const botonesAdmin = (userRole === "admin") ? `
                                <div class="d-flex gap-2 justify-content-center">
                                    <button class="btn btn-warning btn-sm" onclick="editarComputadora(${comp.id})">Editar</button>
                                    ${comp.tipo_propiedad === 'Alquilada' ? `
                                        <button class="btn btn-danger btn-sm" onclick="eliminarComputadora(${comp.id})">Retirar del sistema</button>
                                    ` : ''}
                                    <button class="btn btn-secondary btn-sm" onclick="marcarObsoleta(${comp.id})">Obsoleta</button>
                                </div>
                            ` : '';

                            const card = `
                                <div class="col-md-6 col-lg-4 mb-3">
                                    <div class="card shadow-sm h-100">
                                        <div class="card-body">
                                            ${empleadoInfo}
                                            ${computadoraInfo}
                                            ${accesoriosInfo}
                                            ${estadoInfo}
                                            ${botonesAdmin}
                                        </div>
                                    </div>
                                </div>
                            `;

                            lista.innerHTML += card;
                        });

                        const paginacion = document.getElementById('paginacion');
                        paginacion.innerHTML = '';
                    });
            });
    });
}




document.getElementById("filtroTipo").addEventListener("change", function() {
    const tipoPropiedad = this.value;

    let url = "/buscar_computadoras";
    if (tipoPropiedad) {
        url += `?tipo=${encodeURIComponent(tipoPropiedad)}`;
    }

    fetch(url)
    .then(response => response.json())
    .then(data => {
        const tablaBody = document.getElementById('tablaComputadoras');
        tablaBody.innerHTML = '';

        data.forEach(comp => {
            tablaBody.innerHTML += `
                <tr>
                    <td>${comp.numero_inventario}</td>
                    <td>${comp.estado}</td>
                    <td>${comp.departamento}</td>
                    <td>${comp.ubicacion_campus}</td>
                    <td>${comp.monitor}</td>
                    <td>${comp.teclado}</td>
                    <td>${comp.tipo_propiedad}</td>
                    <td>${comp.empleado ? comp.empleado.nombre : "Sin asignar"}</td>
                </tr>`;
        });
    })
    .catch(error => console.error("❌ Error al filtrar computadoras:", error));
});

function verificarRol() {
    fetch('/obtener_rol')
    .then(response => response.json())
    .then(userData => {
        if (userData.rol !== "admin") {
            document.getElementById('btnAgregarComputadora').style.display = 'none';
            document.getElementById('btnReasignarComputadora').style.display = 'none';

            const btnAgregarEmpleado = document.querySelector('button[data-bs-target="#addEmployeeModal"]');
            if (btnAgregarEmpleado) {
                btnAgregarEmpleado.style.display = 'none';
            }
        }
    });
}




// REEMPLAZA el código problemático con esta versión mejorada
function safeAddListener(selector, eventType, callback) {
    const element = document.querySelector(selector);
    if (element) {
        element.addEventListener(eventType, callback);
    } else {
        console.warn(`Elemento no encontrado: ${selector}`);
        // Reintentar después de un breve retraso si es necesario
        setTimeout(() => {
            const el = document.querySelector(selector);
            if (el) el.addEventListener(eventType, callback);
        }, 300);
    }
}

// 2. Versión mejorada de setupEventListeners
// 1. Función para verificar y agregar listeners de forma segura
function safeAddListener(selector, eventType, callback) {
    const element = document.querySelector(selector);
    if (element) {
        element.addEventListener(eventType, callback);
    } else {
        console.warn(`Elemento no encontrado: ${selector}`);
        // Reintentar después de un breve retraso si es necesario
        setTimeout(() => {
            const el = document.querySelector(selector);
            if (el) el.addEventListener(eventType, callback);
        }, 300);
    }
}

// 2. Versión mejorada de setupEventListeners
function setupEventListeners() {
    // 1. Delegación de eventos global
    document.addEventListener('click', function(e) {
        // Logout (versión segura que funciona aunque no exista el botón)
        const logoutBtn = e.target.closest('#logoutBtn, [data-logout]');
        if (logoutBtn) {
            e.preventDefault();
            fetch('/logout', { method: 'GET' })
                .then(() => window.location.href = "/login");
            return;
        }
        
        // Botón agregar computadora
        if (e.target.closest('#btnAgregarComputadora')) {
            e.preventDefault();
            abrirModalAgregarComputadora();
            return;
        }
    });

    // 2. Listeners específicos con verificación
    const addListener = (selector, event, handler) => {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(event, handler);
        else console.warn(`Elemento no encontrado: ${selector}`);
    };
}

// Versión mejorada de initDashboard
function initDashboard() {
    setupEventListeners();
    configurarBuscador();
    cargarComputadoras();
    window.abrirModalAgregarComputadora = abrirModalAgregarComputadora;
    window.agregarCampoAccesorio = agregarCampoAccesorio;
    console.log("✅ Dashboard inicializado correctamente");
}

// ✅ Bloque único y limpio para asegurar la carga
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (document.getElementById('empleadoSelect')) {
            cargarEmpleados();
        }
        verificarRol();
        initDashboard();
    });
} else {
    // Ya cargado
    if (document.getElementById('empleadoSelect')) {
        cargarEmpleados();
    }
    verificarRol();
    initDashboard();
}






function cargarEmpleados() {
    const select = document.getElementById('empleadoSelect');
    if (!select) {
        console.error("❌ Error: No se encontró el elemento select");
        return;
    }

    select.innerHTML = '<option value="">Cargando empleados...</option>';
    select.disabled = true;

    fetch(`/empleados?t=${Date.now()}`)
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return response.json();
    })
    .then(empleados => {
        select.innerHTML = '<option value="">Seleccionar empleado...</option>';
        select.disabled = false;
        
        empleados.forEach(emp => {
            if (emp.id && emp.nombre && emp.puesto && emp.campus) {
                const option = new Option(
                    `${emp.nombre} - ${emp.puesto} (${emp.campus})`, 
                    emp.id
                );
                select.add(option);
            }
        });
    })
    .catch(error => {
        console.error("❌ Error al cargar empleados:", error);
        select.innerHTML = '<option value="">Error al cargar empleados</option>';
        select.disabled = false;
    });
}

if (!window.formEmpleado) {
    const formEmpleado = document.getElementById('addEmployeeForm');
    if (formEmpleado) {
        formEmpleado.addEventListener('submit', function(event) {
            event.preventDefault();

            const data = {
                nombre: document.getElementById('nombreEmpleado').value,
                email: document.getElementById('emailEmpleado').value,
                puesto: document.getElementById('puestoEmpleado').value,
                campus: document.getElementById('campusEmpleado').value,
                password: document.getElementById('passwordEmpleado').value
            };

            fetch('/empleados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.mensaje) {
                    alert(data.mensaje);
                    formEmpleado.reset();
                    bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal')).hide();
                    cargarEmpleados();
                } else {
                    alert('Error al crear empleado');
                }
            })
            .catch(error => console.error('Error en la solicitud:', error));
        });

        // Marca como ya registrado
        window.formEmpleado = true;
    }
}



function descargarExcel() {
    window.location.href = "/reporte/excel";
}


if (!window.tipoAccesorioInicializado) {
    const tipoAccesorio = document.getElementById('tipoAccesorio');
    if (tipoAccesorio) {
        tipoAccesorio.addEventListener('change', function () {
            const campo = document.getElementById('campoInventarioAccesorio');
            if (this.value) {
                campo.style.display = 'block';
            } else {
                campo.style.display = 'none';
                document.getElementById('inventarioAccesorio').value = '';
            }
        });

        // Marca como ya inicializado
        window.tipoAccesorioInicializado = true;
    }
}




function agregarCampoAccesorio() {
    const container = document.getElementById('accesoriosContainer');

    const div = document.createElement('div');
    div.classList.add('accesorio-group', 'mb-3');

    const index = container.children.length; // Para identificar cada motivo

    div.innerHTML = `
        <div class="form-check mt-1">
            <input class="form-check-input obsoletoAccesorio" type="checkbox" data-index="${index}">
            <label class="form-check-label">Marcar como obsoleto</label>
        </div>
        <input type="hidden" class="motivoAccesorio" data-index="${index}">
        <div class="row g-2">
            <div class="col-md-6">
                <label class="form-label">Tipo de Accesorio</label>
                <select class="form-select tipoAccesorio">
                    <option value="">Seleccione...</option>
                    <option value="Teléfono">Teléfono</option>
                    <option value="Impresora">Impresora</option>
                    <option value="UPS">UPS</option>
                    <option value="Escáner">Escáner</option>
                    <option value="Servidor">Servidor</option>
                    <option value="Televisor">Televisor</option>
                    <option value="Datashow">Datashow</option>
                </select>
            </div>
            <div class="col-md-6">
                <label class="form-label">Número de Inventario</label>
                <input type="text" class="form-control inventarioAccesorio">
            </div>
        </div>
    `;

    container.appendChild(div);

    // Agregar evento al nuevo checkbox
    const checkbox = div.querySelector('.obsoletoAccesorio');
    checkbox.addEventListener('change', function () {
        const index = this.dataset.index;
        const motivoInput = div.querySelector(`.motivoAccesorio[data-index="${index}"]`);
        if (this.checked) {
            const motivo = prompt("🛠️ Ingresa el motivo por el cual este accesorio es obsoleto:");
            if (motivo && motivo.trim()) {
                motivoInput.value = motivo.trim();
            } else {
                this.checked = false;
                motivoInput.value = '';
            }
        } else {
            motivoInput.value = '';
        }
    });
}



// Motivos para obsoletos 
function mostrarModalMotivo(computadoraId, tipoComponente) {
    document.getElementById('motivo_computadora_id').value = computadoraId;
    document.getElementById('motivo_tipo_componente').value = tipoComponente;
    document.getElementById('motivo_texto').value = ""; // limpiar
    const modal = new bootstrap.Modal(document.getElementById('motivoModal'));
    modal.show();
}
document.getElementById("formMotivoObsoleto").addEventListener("submit", function (e) {
    e.preventDefault();

    const computadoraId = document.getElementById('motivo_computadora_id').value;
    const tipoComponente = document.getElementById('motivo_tipo_componente').value;
    const motivo = document.getElementById('motivo_texto').value.trim();

    if (!motivo) {
        alert("Por favor escribe el motivo.");
        return;
    }

    const formData = new FormData();
    formData.append("computadora_id", computadoraId);
    formData.append("tipo_componente", tipoComponente);
    formData.append("motivo", motivo);

    fetch("/marcar_componente_obsoleto", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message || "Componente marcado como obsoleto.");
        const modal = bootstrap.Modal.getInstance(document.getElementById('motivoModal'));
        modal.hide();
        cargarComputadoras(); // refresca las cards
    })
    .catch(err => {
        console.error("Error al marcar obsoleto:", err);
        alert("Error al procesar la solicitud.");
    });
});
