// dashboard.js - Gestión del dashboard y contadores del estudiante

class DashboardManager {
    constructor() {
        this.reservasCount = 0;
        this.proximaTutoria = null;
        this.notificacionesCount = 0;
    }

    // Inicializar dashboard
    async init() {
        await this.loadDashboardData();
        this.updateUI();
    }

    // Cargar datos del dashboard
    async loadDashboardData() {
        try {
            // Cargar reservas activas
            await this.loadReservasCount();

            // Cargar próxima tutoría
            await this.loadProximaTutoria();

            // Cargar contador de notificaciones
            await this.loadNotificacionesCount();

        } catch (error) {
            console.error('Error cargando datos del dashboard:', error);
        }
    }

    // Cargar contador de reservas activas
    async loadReservasCount() {
        try {
            const user = await authManager.getUserData();
            if (!user) return;

            const base = authManager.baseURL || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://52.71.188.181:8080';
            const response = await fetch(`${base.replace(/\/$/, '')}/estudiantes/reservas/estudiante/${user.id}`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const reservas = await response.json();
                // Count only active (non-cancelled) reservations
                const activeReservas = Array.isArray(reservas) ? reservas.filter(r => r.estado === 'Activa') : [];
                this.reservasCount = activeReservas.length;
            } else {
                this.reservasCount = 0;
            }
        } catch (error) {
            console.error('Error cargando reservas:', error);
            this.reservasCount = 0;
        }
    }

    // Cargar próxima tutoría
    async loadProximaTutoria() {
        try {
            const user = await authManager.getUserData();
            if (!user) return;

            const base2 = authManager.baseURL || (window.API_CONFIG && window.API_CONFIG.API_BASE) || 'http://52.71.188.181:8080';
            const response = await fetch(`${base2.replace(/\/$/, '')}/estudiantes/reservas/estudiante/${user.id}`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const reservas = await response.json();
                if (Array.isArray(reservas) && reservas.length > 0) {
                    // Encontrar la reserva más próxima en el futuro
                    const ahora = new Date();
                    const futuras = reservas
                        .filter(r => new Date(`${r.dia} ${r.inicio}`) > ahora)
                        .sort((a, b) => new Date(`${a.dia} ${a.inicio}`) - new Date(`${b.dia} ${b.inicio}`));

                    if (futuras.length > 0) {
                        const proxima = futuras[0];
                        this.proximaTutoria = {
                            fecha: proxima.dia,
                            hora: proxima.inicio,
                            maestro: proxima.maestroName,
                            materia: proxima.materia || 'N/A'
                        };
                    } else {
                        this.proximaTutoria = null;
                    }
                } else {
                    this.proximaTutoria = null;
                }
            }
        } catch (error) {
            console.error('Error cargando próxima tutoría:', error);
            this.proximaTutoria = null;
        }
    }

    // Cargar contador de notificaciones (simulado por ahora)
    async loadNotificacionesCount() {
        // TODO: Implementar cuando esté disponible el endpoint de notificaciones
        this.notificacionesCount = 0;
    }

    // Actualizar la UI del dashboard
    updateUI() {
        // Actualizar contador de reservas
        const reservasCountEl = document.getElementById('reservas-count');
        if (reservasCountEl) {
            reservasCountEl.textContent = this.reservasCount;
        }

        // Actualizar próxima tutoría
        const proximaTutoriaEl = document.getElementById('proxima-tutoria');
        if (proximaTutoriaEl) {
            if (this.proximaTutoria) {
                proximaTutoriaEl.innerHTML = `
                    <div>${this.proximaTutoria.fecha}</div>
                    <div style="font-size: 12px; color: #64748b;">${this.proximaTutoria.hora} - ${this.proximaTutoria.maestro}</div>
                `;
            } else {
                proximaTutoriaEl.textContent = 'Sin tutorías próximas';
            }
        }

        // Actualizar contador de notificaciones
        const notificacionesCountEl = document.getElementById('notificaciones-count');
        if (notificacionesCountEl) {
            notificacionesCountEl.textContent = this.notificacionesCount;
        }
    }

    // Refrescar datos del dashboard
    async refresh() {
        await this.loadDashboardData();
        this.updateUI();
    }
}

// Instancia global
const dashboardManager = new DashboardManager();