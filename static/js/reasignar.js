document.getElementById("reasignarForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Evita el envío tradicional del formulario

    // Obtener los datos del formulario
    let formData = new FormData(this);
    
    // Convertir FormData a JSON
    let jsonData = {};
    formData.forEach((value, key) => {
        jsonData[key] = value;
    });

    // Enviar datos al backend con Fetch API
    fetch("/reasignar", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(jsonData)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Respuesta del servidor:", data); // Depuración en consola

        if (data.success) {
            alert("Reasignación guardada exitosamente.");

            // Guardamos el ID de la última reasignación
            let reasignacionID = data.id;

            if (reasignacionID) {
                console.log("Se ha generado la reasignación con ID:", reasignacionID);
                
                // Habilitar el botón de Descargar PDF con el ID correcto
                let pdfButton = document.getElementById("btnDescargarPDF");
                pdfButton.href = `/generar_pdf/${reasignacionID}`;
                pdfButton.style.display = "inline"; // Mostrar el botón


                // Habilitar el botón de Descargar Word con el ID correcto
                let wordButton = document.getElementById("btnDescargarWord");
                wordButton.href = `/generar_word/${reasignacionID}`;
                wordButton.style.display = "inline"; // Mostrar el botón




            } else {
                console.error("Error: No se recibió un ID válido del backend.");
            }

        } else {
            alert("Error al guardar la reasignación.");
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Error en la solicitud.");
    });
});
    