let paginaActual = "";

async function cargarScript(src) {
    return new Promise((resolve, reject) => {
        // Elimina scripts duplicados primero
        document.querySelectorAll(`script[src="${src}"]`).forEach(s => s.remove());
        
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}


async function cargarContenido(pagina) {
    if (pagina === paginaActual) return;  // 👈 No volver a cargar si ya estás en esa página
    paginaActual = pagina;
    try {
        const usaFragmento = ['accesorios_generales', 'componentes_obsoletos', 'eliminadas','dashboard', 'reasignar'].includes(pagina);
        const url = usaFragmento ? `/${pagina}?fragment=true` : `/${pagina}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

        const html = await response.text();
        eliminarScriptsPrevios();
        document.getElementById('contenido').innerHTML = html;

        // Scripts específicos por página
        if (pagina === 'accesorios_generales') {
            await cargarScript("/static/js/accesorios_generales.js");
        }

        if (pagina === 'componentes_obsoletos') {
            await cargarScript("/static/js/componentes.js");
        }
        if (pagina === 'eliminadas') {
            await cargarScript("/static/js/eliminadas.js");
        }
        if (pagina === 'dashboard') {
            await cargarScript("/static/js/dashboard.js");
        }
        if (pagina === 'reasignar') {
            await cargarScript("/static/js/reasignar.js");
        }
        history.pushState(null, null, `/${pagina}`);
    } catch (error) {
        console.error('Error:', error);
        mostrarError(`Error al cargar la página: ${error.message}`);
    }
    
}

function eliminarScriptsPrevios() {
    const scripts = document.querySelectorAll('script[data-dinamico]');
    scripts.forEach(s => s.remove());

    // Limpiar variables globales si las tenés
    delete window.AccesoriosGenerales;
    delete window.ComponentesObsoletos;
    delete window.Eliminadas;
    
}


function mostrarError(mensaje) {
    document.getElementById('contenido').innerHTML = `
        <div class="alert alert-danger">
            ${mensaje}
            <button onclick="location.reload()" class="btn btn-sm btn-warning ms-2">Recargar Página</button>
        </div>`;
}

// Función de ayuda
function waitForFunction(check, interval = 100, timeout = 3000) {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const checkInterval = setInterval(() => {
            if (check()) {
                clearInterval(checkInterval);
                resolve();
            } else if (Date.now() - start > timeout) {
                clearInterval(checkInterval);
                reject(new Error("Timeout waiting for function"));
            }
        }, interval);
    });
}