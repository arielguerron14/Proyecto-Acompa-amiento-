// reservas.js - Gestión de reservas del estudiante

class ReservasManager {
    constructor() {
        this.reservas = [];
    }

    // Inicializar módulo de reservas
    async init() {
        await this.loadReservas();
        this.renderReservas();
    }

    // Cargar reservas del estudiante
    async loadReservas() {
        try {
            const user = await authManager.getUserData();
            if (!user) return;

            const loadingEl = document.getElementById('reservas-loading');
            const emptyEl = document.getElementById('reservas-empty');
            const listEl = document.getElementById('reservas-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            const response = await fetch(`${authManager.baseURL}/estudiantes/reservas/estudiante/${user.id}`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.reservas = await response.json();
            } else {
                this.reservas = [];
                console.error('Error cargando reservas:', response.status);
            }
        } catch (error) {
            console.error('Error cargando reservas:', error);
            this.reservas = [];
        }
    }

    // Renderizar lista de reservas
    renderReservas() {
        const loadingEl = document.getElementById('reservas-loading');
        const emptyEl = document.getElementById('reservas-empty');
        const listEl = document.getElementById('reservas-list');

        if (loadingEl) loadingEl.style.display = 'none';

        if (!this.reservas || this.reservas.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            if (listEl) listEl.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (listEl) listEl.style.display = 'grid';

        listEl.innerHTML = this.reservas.map(reserva => this.createReservaCard(reserva)).join('');
    }

    // Crear HTML para una reserva
    createReservaCard(reserva) {
        const statusClass = this.getStatusClass(reserva.estado || 'pendiente');
        const statusText = this.getStatusText(reserva.estado || 'pendiente');

        return `
            <div class="reserva-card">
                <div class="reserva-status ${statusClass}">${statusText}</div>
                <div class="reserva-header">
                    <div class="reserva-materia">${reserva.materia || 'Materia no especificada'}</div>
                    <div class="reserva-maestro">Maestro: ${reserva.maestroName || 'N/A'}</div>
                </div>
                <div class="reserva-info">
                    <div class="reserva-info-item">
                        <div class="reserva-info-label">Fecha</div>
                        <div class="reserva-info-value">${reserva.dia || 'N/A'}</div>
                    </div>
                    <div class="reserva-info-item">
                        <div class="reserva-info-label">Hora</div>
                        <div class="reserva-info-value">${reserva.inicio || 'N/A'} - ${reserva.fin || 'N/A'}</div>
                    </div>
                    <div class="reserva-info-item">
                        <div class="reserva-info-label">Modalidad</div>
                        <div class="reserva-info-value">${reserva.modalidad || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Obtener clase CSS para el estado
    getStatusClass(estado) {
        const statusMap = {
            'pendiente': 'pendiente',
            'confirmada': 'confirmada',
            'cancelada': 'cancelada',
            'completada': 'confirmada'
        };
        return statusMap[estado] || 'pendiente';
    }

    // Obtener texto para el estado
    getStatusText(estado) {
        const statusMap = {
            'pendiente': 'Pendiente',
            'confirmada': 'Confirmada',
            'cancelada': 'Cancelada',
            'completada': 'Completada'
        };
        return statusMap[estado] || 'Pendiente';
    }

    // Refrescar reservas
    async refresh() {
        await this.loadReservas();
        this.renderReservas();
        // Actualizar dashboard también
        await dashboardManager.refresh();
    }
}

// Instancia global
const reservasManager = new ReservasManager();