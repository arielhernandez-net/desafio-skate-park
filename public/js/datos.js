async function accessDatos() {
  const token = sessionStorage.getItem('token');
  if (!token) {
      alert('No hay token disponible. Inicie sesión primero.');
      window.location.href = '/login';
      return;
  }

  const response = await fetch('/datos', {
      method: 'GET',
      headers: {
          'Authorization': `Bearer ${token}`
      }
  });

  if (response.ok) {
      return response.text();
  } else {
      alert('Acceso denegado');
      window.location.href = '/';
  }
}
accessDatos();

document.addEventListener('DOMContentLoaded', async () => {
  try {
      const token = sessionStorage.getItem('token');
      if (!token) {
          throw new Error('Token no encontrado');
      }

      const response = await fetch('/datos', {
          method: 'GET',
          headers: {
              'Authorization': `Bearer ${token}`
          }
      });

      if (!response.ok) {
          throw new Error('Error al obtener los datos');
      }

      const userData = await response.json();

      document.getElementById('email').value = userData.email || '';
      document.getElementById('nombre').value = userData.nombre || '';
      document.getElementById('aniosExperiencia').value = userData.anos_experiencia || '';
      document.getElementById('especialidad').value = userData.especialidad || '';


  } catch (error) {
      console.error('Error:', error);
      alert('Error al obtener los datos del perfil');
      window.location.href = '/login';
  }
});

document.getElementById('actualizar').addEventListener('click', async (event) => {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const anos_experiencia = document.getElementById('aniosExperiencia').value;
  const especialidad = document.getElementById('especialidad').value;
  const password = document.getElementById('password').value;

  try {
      const token = sessionStorage.getItem('token');
      if (!token) {
          throw new Error('Token no encontrado');
      }

      const response = await fetch('/actualizar', {
          method: 'PUT',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({nombre,anos_experiencia, especialidad, password })
      });

      if (!response.ok) {
          throw new Error('Error al actualizar el perfil');
      }

      alert('Perfil actualizado correctamente');

  } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el perfil');
  }
});

document.getElementById('eliminar').addEventListener('click', async (event) => {
  event.preventDefault();

  if (confirm('¿Estás seguro de que deseas eliminar tu cuenta?')) {
      try {
          const token = sessionStorage.getItem('token');
          if (!token) {
              throw new Error('Token no encontrado');
          }

          const response = await fetch('/eliminar', {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`
              }
          });

          if (!response.ok) {
              throw new Error('Error al eliminar la cuenta');
          }

          alert('Cuenta eliminada correctamente');
          window.location.href = '/login';

      } catch (error) {
          console.error('Error:', error);
          alert('Error al eliminar la cuenta');
      }
  }
});
