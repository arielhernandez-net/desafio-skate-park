document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const response = await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    });

    if (response.ok) {
        const data = await response.json(); 
        const token = data.token;
        console.log('Token recibido:', token);
        sessionStorage.setItem('token', token);
        window.location.href = '/Datos.html';
    } else {
        alert('Credenciales inválidas');
    }
});