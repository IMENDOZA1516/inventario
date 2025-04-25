document.getElementById('formRecuperar').addEventListener('submit', function (e) {
    e.preventDefault();

    const email = document.getElementById('emailRecuperar').value;

    fetch('/enviar_codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    })
    .then(async response => {
        const data = await response.json();  // ⬅️ ahora obtenemos ambos: data y estado
        const mensaje = document.getElementById('mensajeRecuperacion');

        if (response.ok) {
            mensaje.style.color = 'green';
            mensaje.textContent = '✅ Código enviado correctamente. Revisa tu correo.';
            document.getElementById('formCodigo').style.display = 'block';  // ⬅️ ¡esto ahora sí se mostrará!
        } else {
            mensaje.style.color = 'red';
            mensaje.textContent = '❌ ' + (data.mensaje || 'No se pudo enviar el código.');
        }
    })
    .catch(err => {
        console.error(err);
        alert("Ocurrió un error al enviar el correo.");
    });
});
document.getElementById('formRestablecer').addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('emailRecuperar').value;
    const codigo = document.getElementById('codigo').value;
    const nuevaContrasena = document.getElementById('nuevaContrasena').value;

    try {
        const response = await fetch('/restablecer_contrasena', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email,
                codigo,
                nueva_contrasena: nuevaContrasena
            })
        });

        const data = await response.json();
        const mensaje = document.getElementById('mensajeRestablecer');

        if (response.ok) {
            mensaje.style.color = 'green';
            mensaje.textContent = '✅ Contraseña actualizada correctamente. Serás redirigido.';
            setTimeout(() => {
                window.location.href = "/login";
            }, 2000);
        } else {
            mensaje.style.color = 'red';
            mensaje.textContent = '❌ ' + (data.mensaje || 'Error al restablecer la contraseña.');
        }
    } catch (err) {
        console.error(err);
        alert("Ocurrió un error al restablecer la contraseña.");
    }
});

