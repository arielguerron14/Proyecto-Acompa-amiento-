// notificaciones.js - Gestión de notificaciones del estudiante

class NotificacionesManager {
    constructor() {
        this.notificaciones = [];
    }

    // Inicializar módulo de notificaciones
    async init() {
        await this.loadNotificaciones();
        this.renderNotificaciones();
    }

    // Cargar notificaciones del estudiante
    async loadNotificaciones() {
        try {
            const user = await authManager.getUserData();
            if (!user) return;

            const loadingEl = document.getElementById('notificaciones-loading');
            const emptyEl = document.getElementById('notificaciones-empty');
            const listEl = document.getElementById('notificaciones-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            // TODO: Implementar endpoint real de notificaciones
            // Por ahora simulamos algunas notificaciones
            this.notificaciones = this.getMockNotificaciones();

        } catch (error) {
            console.error('Error cargando notificaciones:', error);
            this.notificaciones = [];
        }
    }

    // Obtener notificaciones simuladas (hasta que esté el endpoint real)
    getMockNotificaciones() {
        return [
            {
                id: '1',
                titulo: 'Reserva Confirmada',
                mensaje: 'Tu reserva para Matemáticas el lunes 15 de enero ha sido confirmada.',
                tipo: 'reserva',
                leida: false,
                fecha: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
            },
            {
                id: '2',
                titulo: 'Recordatorio de Tutoría',
                mensaje: 'Recuerda que tienes una tutoría de Física mañana a las 14:00.',
                tipo: 'recordatorio',
                leida: false,
                fecha: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hora atrás
            },
            {
                id: '3',
                titulo: 'Nuevo Reporte Disponible',
                mensaje: 'Ya está disponible tu reporte de progreso en Química.',
                tipo: 'reporte',
                leida: true,
                fecha: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 día atrás
            }
        ];
    }

    // Renderizar lista de notificaciones
    renderNotificaciones() {
        const loadingEl = document.getElementById('notificaciones-loading');
        const emptyEl = document.getElementById('notificaciones-empty');
        const listEl = document.getElementById('notificaciones-list');

        if (loadingEl) loadingEl.style.display = 'none';

        if (!this.notificaciones || this.notificaciones.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            if (listEl) listEl.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (listEl) listEl.style.display = 'grid';

        listEl.innerHTML = this.notificaciones.map(notif => this.createNotificacionCard(notif)).join('');

        // Actualizar contador en dashboard
        this.updateDashboardCount();
    }

    // Crear HTML para una notificación
    createNotificacionCard(notificacion) {
        const unreadClass = notificacion.leida ? '' : 'unread';
        const icon = this.getNotificacionIcon(notificacion.tipo);
        const timeAgo = this.getTimeAgo(notificacion.fecha);

        return `
            <div class="notificacion-card ${unreadClass}" data-id="${notificacion.id}">
                <div class="notificacion-icon">${icon}</div>
                <div class="notificacion-content">
                    <div class="notificacion-title">${notificacion.titulo}</div>
                    <div class="notificacion-message">${notificacion.mensaje}</div>
                    <div class="notificacion-time">${timeAgo}</div>
                </div>
                ${!notificacion.leida ? `<button class="btn-marcar-leida" onclick="notificacionesManager.marcarComoLeida('${notificacion.id}')">Marcar como leída</button>` : ''}
            </div>
        `;
    }

    // Obtener icono según tipo de notificación
    getNotificacionIcon(tipo) {
        const iconos = {
            'reserva': '✅',
            'recordatorio': '⏰',
            'reporte': '📊',
            'sistema': '🔔',
            'cancelacion': '❌'
        };
        return iconos[tipo] || '🔔';
    }

    // Calcular tiempo transcurrido
    getTimeAgo(fecha) {
        const ahora = new Date();
        const diff = ahora - fecha;
        const minutos = Math.floor(diff / (1000 * 60));
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutos < 1) return 'Ahora mismo';
        if (minutos < 60) return `Hace ${minutos} min`;
        if (horas < 24) return `Hace ${horas} h`;
        return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    }

    // Marcar notificación como leída
    marcarComoLeida(id) {
        const notificacion = this.notificaciones.find(n => n.id === id);
        if (notificacion) {
            notificacion.leida = true;
            this.renderNotificaciones();
            authManager.showMessage('Notificación marcada como leída', 'success');
        }
    }

    // Actualizar contador en dashboard
    updateDashboardCount() {
        const unreadCount = this.notificaciones.filter(n => !n.leida).length;
        const notificacionesCountEl = document.getElementById('notificaciones-count');
        if (notificacionesCountEl) {
            notificacionesCountEl.textContent = unreadCount;
        }
    }

    // Refrescar notificaciones
    async refresh() {
        await this.loadNotificaciones();
        this.renderNotificaciones();
        // Actualizar dashboard también
        await dashboardManager.refresh();
    }
}

// Instancia global
const notificacionesManager = new NotificacionesManager();