const { default: fetch } = require('node-fetch');

async function testReportes() {
    try {
        // Login
        console.log('Haciendo login...');
        const loginResponse = await fetch('http://localhost:8080/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'estudiante@test.com',
                password: '123456'
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login response status:', loginResponse.status);
        console.log('Login response:', loginData);

        if (!loginData.success) {
            console.error('Login falló');
            return;
        }

        const token = loginData.token;
        const userId = loginData.user.userId;

        console.log('Token obtenido:', token.substring(0, 50) + '...');
        console.log('User ID:', userId);

        // Obtener reportes
        console.log('Obteniendo reportes...');
        const reportesResponse = await fetch(`http://localhost:8080/reportes/estudiantes/reporte/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Status de reportes:', reportesResponse.status);

        if (reportesResponse.ok) {
            const reportesData = await reportesResponse.json();
            console.log('Datos de reportes:', JSON.stringify(reportesData, null, 2));

            // Simular el procesamiento del frontend
            console.log('\n=== SIMULACIÓN DEL PROCESAMIENTO DEL FRONTEND ===');
            const reportes = reportesData && reportesData.items ? reportesData.items : [];
            console.log('Reportes procesados:', reportes.length);

            reportes.forEach((reporte, index) => {
                console.log(`\nReporte ${index + 1}:`);
                console.log(`- Materia: ${reporte.materia || 'No especificada'}`);
                console.log(`- Semestre: ${reporte.semestre || 'No especificado'}`);
                console.log(`- Paralelo: ${reporte.paralelo || 'No especificado'}`);
                console.log(`- Maestro: ${reporte.maestroName || 'No especificado'}`);
                console.log(`- Día: ${reporte.dia}`);
                console.log(`- Horario: ${reporte.inicio}-${reporte.fin}`);
            });
        } else {
            console.log('Error obteniendo reportes:', await reportesResponse.text());
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testReportes();