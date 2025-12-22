// Script para verificar qué datos llegan al frontend
console.log('=== VERIFICACIÓN DE DATOS DE REPORTES ===');

// Simular la carga de reportes
async function verificarDatosReportes() {
    try {
        // Obtener datos del usuario (simulado)
        const user = { id: '694752c0293c986c2e059efe' }; // ID del estudiante de prueba

        console.log('Usuario:', user);

        // Simular la petición HTTP (usando datos conocidos)
        const mockResponse = {
            "_id": "694752e8072b0f53a597b4e8",
            "estudianteId": "694752c0293c986c2e059efe",
            "estudianteName": "Estudiante Test",
            "items": [
                {
                    "maestroId": "1",
                    "maestroName": "Prof. García",
                    "dia": "Lunes",
                    "inicio": "08:00",
                    "fin": "10:00",
                    "duracionHoras": 2,
                    "_id": "694752e8072b0f53a597b4e9"
                },
                {
                    "maestroId": "2",
                    "maestroName": "Prof. López",
                    "materia": "BIO101",
                    "semestre": "2",
                    "paralelo": "A",
                    "dia": "Viernes",
                    "inicio": "10:00",
                    "fin": "12:00",
                    "duracionHoras": 2,
                    "_id": "694753ad1c61be5b34afe039"
                }
            ],
            "totalHoras": 10
        };

        console.log('Datos de respuesta simulada:', mockResponse);

        // Procesar como lo hace el frontend
        const reportes = mockResponse && mockResponse.items ? mockResponse.items : [];
        console.log('Reportes procesados:', reportes.length);

        // Mostrar cada reporte
        reportes.forEach((reporte, index) => {
            console.log(`\n--- REPORTE ${index + 1} ---`);
            console.log('Datos crudos:', reporte);
            console.log('Materia:', reporte.materia || 'Materia no especificada');
            console.log('Semestre:', reporte.semestre || 'N/A');
            console.log('Paralelo:', reporte.paralelo || 'N/A');
            console.log('Maestro:', reporte.maestroName || 'N/A');
            console.log('Día:', reporte.dia);
            console.log('Horario:', `${reporte.dia} ${reporte.inicio}-${reporte.fin}`);
            console.log('Observaciones:', reporte.observaciones || 'Sin observaciones disponibles');
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

verificarDatosReportes();