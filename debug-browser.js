// Script para ejecutar en la consola del navegador
// para verificar qué datos está recibiendo el frontend

console.log('=== VERIFICACIÓN DE DATOS EN NAVEGADOR ===');

// Verificar si authManager está disponible
if (typeof authManager === 'undefined') {
    console.error('authManager no está disponible');
    return;
}

// Verificar datos del usuario
authManager.getUserData().then(user => {
    console.log('Usuario actual:', user);

    if (!user) {
        console.error('No hay datos de usuario');
        return;
    }

    // Hacer la petición manualmente
    fetch(`${authManager.baseURL}/reportes/estudiantes/reporte/${user.id}`, {
        headers: authManager.getAuthHeaders()
    })
    .then(response => {
        console.log('Status de respuesta:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Datos recibidos de la API:', data);

        if (data && data.items) {
            console.log('Items procesados:', data.items.length);
            data.items.forEach((item, index) => {
                console.log(`Item ${index + 1}:`, {
                    materia: item.materia,
                    semestre: item.semestre,
                    paralelo: item.paralelo,
                    maestroName: item.maestroName,
                    dia: item.dia,
                    horario: `${item.inicio}-${item.fin}`
                });
            });
        } else {
            console.log('No hay items en la respuesta');
        }
    })
    .catch(error => {
        console.error('Error al obtener datos:', error);
    });
}).catch(error => {
    console.error('Error al obtener user data:', error);
});