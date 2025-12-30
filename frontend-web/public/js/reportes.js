// reportes.js - Gestión de reportes académicos del estudiante

class ReportesManager {
    constructor() {
        this.reportes = [];
    }

    // Inicializar módulo de reportes
    async init() {
        console.log('DEBUG: ReportesManager.init() called');
        await this.loadReportes();
        this.renderReportes();
    }

    // Cargar reportes del estudiante
    async loadReportes() {
        try {
            console.log('DEBUG: loadReportes() called');
            const user = await authManager.getUserData();
            console.log('DEBUG: User data:', user);
            if (!user) {
                console.log('DEBUG: No user data, returning');
                return;
            }

            const loadingEl = document.getElementById('reportes-loading');
            const emptyEl = document.getElementById('reportes-empty');
            const listEl = document.getElementById('reportes-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            const response = await fetch(`${authManager.baseURL}/reportes/estudiantes/reporte/${user.id}`, {
                headers: authManager.getAuthHeaders()
            });
            console.log('DEBUG: Fetch response status:', response.status);
            console.log('DEBUG: Fetch response ok:', response.ok);

            if (response.ok) {
                const reporteData = await response.json();
                console.log('DEBUG: Reporte data received:', reporteData);
                // El backend devuelve un objeto con items (array de reservas)
                // Convertir cada item en un "reporte" para mostrar
                this.reportes = reporteData && reporteData.items ? reporteData.items : [];
                console.log('DEBUG: Processed reportes:', this.reportes);
            } else if (response.status === 404) {
                // 404 significa que no hay reportes para este estudiante, lo cual es válido
                this.reportes = [];
                console.log('DEBUG: No reportes found (404)');
            } else {
                this.reportes = [];
                console.error('Error cargando reportes:', response.status);
            }
        } catch (error) {
            console.error('Error cargando reportes:', error);
            this.reportes = [];
        }
    }

    // Renderizar lista de reportes
    renderReportes() {
        const loadingEl = document.getElementById('reportes-loading');
        const emptyEl = document.getElementById('reportes-empty');
        const listEl = document.getElementById('reportes-list');

        if (loadingEl) loadingEl.style.display = 'none';

        if (!this.reportes || this.reportes.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            if (listEl) listEl.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (listEl) listEl.style.display = 'grid';

        listEl.innerHTML = this.reportes.map(reporte => this.createReporteCard(reporte)).join('');
    }

    // Crear HTML para un reporte
    createReporteCard(reporte) {
        console.log('DEBUG: Creating card for reporte:', reporte);
        console.log('DEBUG: reporte.materia:', reporte.materia);
        console.log('DEBUG: reporte.semestre:', reporte.semestre);
        console.log('DEBUG: reporte.paralelo:', reporte.paralelo);
        console.log('DEBUG: reporte.maestroName:', reporte.maestroName);
        console.log('DEBUG: reporte.dia:', reporte.dia);
        console.log('DEBUG: reporte.inicio:', reporte.inicio);
        console.log('DEBUG: reporte.fin:', reporte.fin);

        const progreso = this.calcularProgreso(reporte);
        const fechaFormateada = this.formatearFecha(reporte.dia);

        return `
            <div class="reporte-card">
                <div class="reporte-header">
                    <div class="reporte-materia">${reporte.materia || 'Materia no especificada'}</div>
                    <div class="reporte-fecha">${fechaFormateada}</div>
                </div>
                <div class="reporte-detalles">
                    <div class="reporte-semestre">Semestre: ${reporte.semestre || 'N/A'}</div>
                    <div class="reporte-paralelo">Paralelo: ${reporte.paralelo || 'N/A'}</div>
                    <div class="reporte-horario">${reporte.dia} ${reporte.inicio}-${reporte.fin}</div>
                    <div class="reporte-maestro">${reporte.maestroName || 'N/A'}</div>
                </div>
            </div>
        `;
    }

    // Calcular progreso del estudiante (simulado por ahora)
    calcularProgreso(reporte) {
        // Lógica básica de progreso - en un sistema real vendría del backend
        const progresos = {
            'Excelente': 90,
            'Muy bueno': 80,
            'Bueno': 70,
            'Regular': 60,
            'Necesita mejorar': 50
        };

        // Buscar indicadores en las observaciones
        const observaciones = (reporte.observaciones || '').toLowerCase();
        let progreso = 100; // Default completado
        let texto = 'Completada';

        if (observaciones.includes('excelente') || observaciones.includes('destacado')) {
            progreso = 90;
            texto = 'Excelente';
        } else if (observaciones.includes('muy bueno') || observaciones.includes('avanzado')) {
            progreso = 80;
            texto = 'Muy bueno';
        } else if (observaciones.includes('bueno') || observaciones.includes('progresando')) {
            progreso = 70;
            texto = 'Bueno';
        } else if (observaciones.includes('regular') || observaciones.includes('mejorar')) {
            progreso = 60;
            texto = 'Regular';
        } else if (observaciones.includes('dificultad') || observaciones.includes('apoyo')) {
            progreso = 50;
            texto = 'Necesita apoyo';
        }

        return {
            porcentaje: progreso,
            texto: texto
        };
    }

    // Formatear fecha
    formatearFecha(fechaStr) {
        // Si es un día de la semana, devolverlo tal cual
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        if (diasSemana.includes(fechaStr)) {
            return fechaStr;
        }

        // Intentar formatear como fecha
        try {
            const fecha = new Date(fechaStr);
            if (!isNaN(fecha.getTime())) {
                return fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
        } catch (error) {
            // Ignorar error
        }

        return fechaStr || 'Fecha no disponible';
    }

    // Refrescar reportes
    async refresh() {
        await this.loadReportes();
        this.renderReportes();
    }
}

// Instancia global
const reportesManager = new ReportesManager();