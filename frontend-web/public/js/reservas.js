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
            console.log('User data:', user);
            if (!user) {
                console.log('No user data, skipping load');
                return;
            }

            const loadingEl = document.getElementById('reservas-loading');
            const emptyEl = document.getElementById('reservas-empty');
            const listEl = document.getElementById('reservas-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            const response = await fetch(`${authManager.baseURL}/estudiantes/reservas/estudiante/${user.id}`, {
                headers: authManager.getAuthHeaders()
            });

            console.log('Response status:', response.status);
            if (response.ok) {
                this.reservas = await response.json();
                console.log('Reservas loaded:', this.reservas);
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

        console.log('Rendering reservas:', this.reservas);
        console.log('Elements found:', { loadingEl, emptyEl, listEl });

        if (loadingEl) loadingEl.style.display = 'none';

        if (!this.reservas || this.reservas.length === 0) {
            console.log('Showing empty message');
            if (emptyEl) emptyEl.style.display = 'block';
            if (listEl) listEl.style.display = 'none';
            return;
        }

        console.log('Showing list with', this.reservas.length, 'reservas');
        if (emptyEl) emptyEl.style.display = 'none';
        if (listEl) listEl.style.display = 'grid';

        try {
            const html = this.reservas.map(reserva => this.createReservaCard(reserva)).join('');
            listEl.innerHTML = html;
            if (!html.trim()) {
                // If no cards rendered, show empty
                if (emptyEl) emptyEl.style.display = 'block';
                if (listEl) listEl.style.display = 'none';
                return;
            }
        } catch (error) {
            console.error('Error rendering reservas:', error);
            listEl.innerHTML = '<p>Error al cargar las reservas. Revisa la consola para más detalles.</p>';
        }
    }

    // Crear HTML para una reserva
    createReservaCard(reserva) {
        const statusClass = this.getStatusClass(reserva.estado || 'Activa');
        const statusText = this.getStatusText(reserva.estado || 'Activa');

        return `
            <div class="reserva-card">
                <div class="reserva-status ${statusClass}">${statusText}</div>
                <div class="reserva-header">
                    <div class="reserva-materia">${reserva.materia || 'Materia no especificada'}</div>
                    <div class="reserva-maestro">${reserva.maestroName || 'N/A'}</div>
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
                    <div class="reserva-info-item">
                        <div class="reserva-info-label">Lugar de Atención</div>
                        <div class="reserva-info-value">${reserva.lugarAtencion || 'N/A'}</div>
                    </div>
                    ${reserva.estado === 'Cancelada' ? `
                    <div class="reserva-info-item">
                        <div class="reserva-info-label">Motivo</div>
                        <div class="reserva-info-value">${reserva.motivoCancelacion || 'Cancelada por el maestro'}</div>
                    </div>
                    ` : `
                    <div class="reserva-actions">
                        <button class="btn-delete" onclick="if(confirm('¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.')) reservasManager.cancelarReserva('${reserva._id}')">
                            🗑️ Cancelar
                        </button>
                    </div>
                    `}
                </div>
            </div>
        `;
    }

    // Obtener clase CSS para el estado
    getStatusClass(estado) {
        const statusMap = {
            'Activa': 'confirmada',
            'Cancelada': 'cancelada'
        };
        return statusMap[estado] || 'pendiente';
    }

    // Obtener texto para el estado
    getStatusText(estado) {
        const statusMap = {
            'Activa': 'Activa',
            'Cancelada': 'Cancelada'
        };
        return statusMap[estado] || 'Activa';
    }

    // Refrescar reservas
    async refresh() {
        await this.loadReservas();
        this.renderReservas();
        // Actualizar dashboard también
        await dashboardManager.refresh();
    }

    // Cancelar reserva
    async cancelarReserva(id) {
        if (!confirm('¿Está seguro de cancelar esta reserva?')) return;

        try {
            const response = await fetch(`${authManager.baseURL}/estudiantes/reservas/${id}/cancel`, {
                method: 'PUT',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                alert('Reserva cancelada exitosamente');
                await this.refresh();
            } else {
                const error = await response.json();
                alert('Error al cancelar: ' + (error.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error cancelando reserva:', error);
            alert('Error de conexión al cancelar la reserva');
        }
    }
}

// Instancia global
const reservasManager = new ReservasManager();