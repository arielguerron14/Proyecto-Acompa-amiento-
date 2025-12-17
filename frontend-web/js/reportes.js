// reportes.js - Gestión de reportes académicos del estudiante

class ReportesManager {
    constructor() {
        this.reportes = [];
    }

    // Inicializar módulo de reportes
    async init() {
        await this.loadReportes();
        this.renderReportes();
    }

    // Cargar reportes del estudiante
    async loadReportes() {
        try {
            const user = await authManager.getUserData();
            if (!user) return;

            const loadingEl = document.getElementById('reportes-loading');
            const emptyEl = document.getElementById('reportes-empty');
            const listEl = document.getElementById('reportes-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            const response = await fetch(`${authManager.baseURL}/reportes/estudiantes/reporte/${user.id}`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.reportes = await response.json();
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
        const progreso = this.calcularProgreso(reporte);
        const fechaFormateada = this.formatearFecha(reporte.createdAt || reporte.dia);

        return `
            <div class="reporte-card">
                <div class="reporte-header">
                    <div class="reporte-materia">${reporte.materia || 'Materia no especificada'}</div>
                    <div class="reporte-fecha">${fechaFormateada}</div>
                </div>
                <div class="reporte-observaciones">
                    ${reporte.observaciones || 'Sin observaciones disponibles'}
                </div>
                <div class="reporte-progreso">
                    <div class="progreso-bar">
                        <div class="progreso-fill" style="width: ${progreso.porcentaje}%"></div>
                    </div>
                    <div class="progreso-text">${progreso.texto}</div>
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
        let progreso = 75; // Default
        let texto = 'En progreso';

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
        try {
            const fecha = new Date(fechaStr);
            return fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return fechaStr || 'Fecha no disponible';
        }
    }

    // Refrescar reportes
    async refresh() {
        await this.loadReportes();
        this.renderReportes();
    }
}

// Instancia global
const reportesManager = new ReportesManager();