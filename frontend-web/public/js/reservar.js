// reservar.js - Gestión de reserva de horarios por estudiantes

class ReservarManager {
    constructor() {
        this.horarios = [];
        this.selectedHorario = null;
        this.materias = new Set();
        this.semestres = new Set();
        this.isReserving = false; // Flag to prevent multiple reservations
    }

    // Inicializar módulo de reservar
    async init() {
        this.setupEventListeners();
        await this.loadHorarios();
        this.renderHorarios();
    }

    // Configurar event listeners
    setupEventListeners() {
        // Filtros
        const filtroSemestre = document.getElementById('filtro-semestre');
        const filtroMateria = document.getElementById('filtro-materia');
        const filtroDia = document.getElementById('filtro-dia');

        if (filtroSemestre) {
            filtroSemestre.addEventListener('change', () => this.applyFilters());
        }

        if (filtroMateria) {
            filtroMateria.addEventListener('change', () => this.applyFilters());
        }

        if (filtroDia) {
            filtroDia.addEventListener('change', () => this.applyFilters());
        }

        // Botón de refrescar
        const refreshBtn = document.getElementById('refresh-horarios');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshHorarios());
        }

        // Modal
        const modal = document.getElementById('reserva-modal');
        const modalClose = modal?.querySelector('.modal-close');
        const cancelarBtn = document.getElementById('cancelar-reserva');
        const confirmarBtn = document.getElementById('confirmar-reserva');

        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        if (cancelarBtn) {
            cancelarBtn.addEventListener('click', () => this.closeModal());
        }

        if (confirmarBtn) {
            confirmarBtn.addEventListener('click', () => this.confirmarReserva());
        }

        // Cerrar modal al hacer click fuera
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    // Cargar horarios disponibles
    async loadHorarios() {
        try {
            const loadingEl = document.getElementById('horarios-loading');
            const emptyEl = document.getElementById('horarios-empty');
            const listEl = document.getElementById('horarios-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            // Obtener todos los horarios disponibles
            const response = await fetch(`${authManager.baseURL}/horarios`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const allHorarios = await response.json();
                // Filtrar solo horarios activos (ya filtrado en backend)
                this.horarios = allHorarios;

                // Extraer materias únicas para el filtro
                this.materias = new Set(this.horarios.map(h => h.materia).filter(Boolean));
                this.updateFiltroMaterias();

                // Extraer semestres únicos para el filtro
                this.semestres = new Set(this.horarios.map(h => h.semestre).filter(Boolean));
                this.updateFiltroSemestres();
            } else {
                this.horarios = [];
                console.error('Error cargando horarios:', response.status);
            }
        } catch (error) {
            console.error('Error cargando horarios:', error);
            this.horarios = [];
        }
    }

    // Refrescar horarios disponibles
    async refreshHorarios() {
        const refreshBtn = document.getElementById('refresh-horarios');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="refresh-icon">⏳</span> Actualizando...';
        }

        try {
            await this.loadHorarios();
            this.renderHorarios();
            // Mostrar mensaje de éxito temporal
            this.showRefreshMessage('Horarios actualizados correctamente', 'success');
        } catch (error) {
            console.error('Error refrescando horarios:', error);
            this.showRefreshMessage('Error al actualizar horarios', 'error');
        } finally {
            if (refreshBtn) {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<span class="refresh-icon">🔄</span> Actualizar';
            }
        }
    }

    // Mostrar mensaje de refresco
    showRefreshMessage(message, type) {
        // Crear elemento de mensaje temporal
        const messageEl = document.createElement('div');
        messageEl.className = `refresh-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        if (type === 'success') {
            messageEl.style.backgroundColor = '#28a745';
        } else {
            messageEl.style.backgroundColor = '#dc3545';
        }

        document.body.appendChild(messageEl);

        // Remover después de 3 segundos
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    // Actualizar opciones del filtro de materias
    updateFiltroMaterias() {
        const filtroMateria = document.getElementById('filtro-materia');
        if (!filtroMateria) return;

        const currentValue = filtroMateria.value;
        filtroMateria.innerHTML = '<option value="">Todas las materias</option>';

        Array.from(this.materias).sort().forEach(materia => {
            const option = document.createElement('option');
            option.value = materia;
            option.textContent = materia;
            filtroMateria.appendChild(option);
        });

        // Restaurar valor seleccionado si existe
        if (currentValue && this.materias.has(currentValue)) {
            filtroMateria.value = currentValue;
        }
    }

    // Actualizar opciones del filtro de semestres
    updateFiltroSemestres() {
        const filtroSemestre = document.getElementById('filtro-semestre');
        if (!filtroSemestre) return;

        const currentValue = filtroSemestre.value;
        filtroSemestre.innerHTML = '<option value="">Todos los semestres</option>';

        Array.from(this.semestres).sort((a, b) => a - b).forEach(semestre => {
            const option = document.createElement('option');
            option.value = semestre;
            option.textContent = `Semestre ${semestre}`;
            filtroSemestre.appendChild(option);
        });

        // Restaurar valor seleccionado si existe
        if (currentValue && this.semestres.has(Number(currentValue))) {
            filtroSemestre.value = currentValue;
        }
    }

    // Aplicar filtros
    applyFilters() {
        const filtroSemestre = document.getElementById('filtro-semestre')?.value || '';
        const filtroMateria = document.getElementById('filtro-materia')?.value || '';
        const filtroDia = document.getElementById('filtro-dia')?.value || '';

        let filteredHorarios = [...this.horarios];

        // Aplicar filtros en orden: semestre, materia, día
        if (filtroSemestre) {
            filteredHorarios = filteredHorarios.filter(h => h.semestre == filtroSemestre);
        }

        if (filtroMateria) {
            filteredHorarios = filteredHorarios.filter(h => h.materia === filtroMateria);
        }

        if (filtroDia) {
            filteredHorarios = filteredHorarios.filter(h => h.dia === filtroDia);
        }

        this.renderHorarios(filteredHorarios);
    }

    // Renderizar horarios
    renderHorarios(horariosToRender = null) {
        const loadingEl = document.getElementById('horarios-loading');
        const emptyEl = document.getElementById('horarios-empty');
        const listEl = document.getElementById('horarios-list');

        if (loadingEl) loadingEl.style.display = 'none';

        const horarios = horariosToRender || this.horarios;

        // Verificar si hay filtros activos
        const hasActiveFilters = (document.getElementById('filtro-semestre')?.value || '') ||
                                 (document.getElementById('filtro-materia')?.value || '') ||
                                 (document.getElementById('filtro-dia')?.value || '');

        if (!horarios || horarios.length === 0) {
            if (emptyEl) {
                emptyEl.style.display = 'block';
                // Cambiar mensaje según filtros
                const h4 = emptyEl.querySelector('h4');
                const p = emptyEl.querySelector('p');
                if (hasActiveFilters) {
                    if (h4) h4.textContent = 'No hay horarios para los filtros seleccionados';
                    if (p) p.textContent = 'Intenta con otros filtros';
                } else {
                    if (h4) h4.textContent = 'No existen horarios registrados';
                    if (p) p.textContent = 'Contacta a tu coordinador académico';
                }
            }
            if (listEl) listEl.style.display = 'none';
            return;
        }

        if (emptyEl) emptyEl.style.display = 'none';
        if (listEl) listEl.style.display = 'grid';

        listEl.innerHTML = horarios.map(horario => this.createHorarioCard(horario)).join('');
    }

    // Crear HTML para un horario
    createHorarioCard(horario) {
        return `
            <div class="horario-card" data-horario-id="${horario._id}">
                <div class="horario-header">
                    <div class="horario-materia">${horario.materia || 'Materia no especificada'}</div>
                    <div class="horario-maestro">${horario.maestroName || 'Maestro no especificado'}</div>
                </div>
                <div class="horario-info">
                    <div class="horario-info-item">
                        <span class="info-icon">📅</span>
                        ${horario.dia || 'N/A'}
                    </div>
                    <div class="horario-info-item">
                        <span class="info-icon">⏰</span>
                        ${horario.inicio || 'N/A'} - ${horario.fin || 'N/A'}
                    </div>
                    <div class="horario-info-item">
                        <span class="info-icon">📚</span>
                        Semestre ${horario.semestre || 'N/A'} - Paralelo ${horario.paralelo || 'N/A'}
                    </div>
                </div>
                <button class="btn-reservar" onclick="reservarManager.selectHorario('${horario._id}')">
                    Reservar Horario
                </button>
            </div>
        `;
    }

    // Seleccionar horario para reserva
    selectHorario(horarioId) {
        const horario = this.horarios.find(h => h._id === horarioId);
        if (!horario) return;

        this.selectedHorario = horario;
        this.showModal();
    }

    // Mostrar modal de confirmación
    showModal() {
        const modal = document.getElementById('reserva-modal');
        const detailsEl = document.getElementById('reserva-details');

        if (!modal || !detailsEl || !this.selectedHorario) return;

        detailsEl.innerHTML = `
            <p><strong>Materia:</strong> ${this.selectedHorario.materia || 'N/A'}</p>
            <p><strong>Maestro:</strong> ${this.selectedHorario.maestroName || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${this.selectedHorario.dia || 'N/A'}</p>
            <p><strong>Hora:</strong> ${this.selectedHorario.inicio || 'N/A'} - ${this.selectedHorario.fin || 'N/A'}</p>
            <p><strong>Semestre:</strong> ${this.selectedHorario.semestre || 'N/A'}</p>
            <p><strong>Paralelo:</strong> ${this.selectedHorario.paralelo || 'N/A'}</p>
        `;

        modal.style.display = 'flex';
    }

    // Cerrar modal
    closeModal() {
        const modal = document.getElementById('reserva-modal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.selectedHorario = null;
        this.isReserving = false; // Reset flag
    }

    // Confirmar reserva
    async confirmarReserva() {
        if (!this.selectedHorario || !this.selectedHorario._id) {
            console.error('No hay horario seleccionado para reservar');
            return;
        }

        if (this.isReserving) {
            console.log('Reserva ya en proceso, ignorando clic adicional');
            return;
        }

        this.isReserving = true;
        const confirmarBtn = document.getElementById('confirmar-reserva');
        if (confirmarBtn) {
            confirmarBtn.disabled = true;
            confirmarBtn.textContent = 'Reservando...';
        }

        try {
            const user = await authManager.getUserData();
            if (!user) {
                authManager.showMessage('No se encontró sesión de usuario. Inicia sesión nuevamente.', 'error');
                return;
            }
            // Defensive: support both `id` and `userId` fields from token payload
            const estudianteId = user.id || user.userId || null;
            if (!estudianteId) {
                authManager.showMessage('No se pudo identificar al estudiante. Intenta iniciar sesión de nuevo.', 'error');
                return;
            }

            if (!this.selectedHorario || !this.selectedHorario.maestroId) {
                authManager.showMessage('Horario inválido: falta información del maestro.', 'error');
                this.isReserving = false;
                if (confirmarBtn) {
                    confirmarBtn.disabled = false;
                    confirmarBtn.textContent = 'Confirmar Reserva';
                }
                return;
            }

            const reservaData = {
                estudianteId: estudianteId,
                estudianteName: user.name,
                maestroId: this.selectedHorario.maestroId,
                maestroName: this.selectedHorario.maestroName,
                materia: this.selectedHorario.materia,
                dia: this.selectedHorario.dia,
                inicio: this.selectedHorario.inicio,
                fin: this.selectedHorario.fin,
                semestre: this.selectedHorario.semestre,
                paralelo: this.selectedHorario.paralelo
            };

            // Debug: log the payload so we can inspect what the client will send
            console.debug('Reservar: sending reservaData', reservaData);

            // Pre-check availability to provide faster feedback and avoid server 409 when possible
            try {
                // Note: availability check is served under the estudiantes proxy at /estudiantes/reservas/check
                const checkUrl = `${authManager.baseURL}/estudiantes/reservas/check?maestroId=${encodeURIComponent(reservaData.maestroId)}&dia=${encodeURIComponent(reservaData.dia)}&inicio=${encodeURIComponent(reservaData.inicio)}`;
                const checkRes = await fetch(checkUrl, { headers: authManager.getAuthHeaders() });
                if (checkRes.ok) {
                    const j = await checkRes.json();
                    if (!j.available) {
                        authManager.showMessage('Lo siento, este horario ya fue reservado. Se actualizará la lista.', 'error');
                        // Remove from local list and refresh
                        if (this.selectedHorario && this.selectedHorario._id) {
                            this.horarios = this.horarios.filter(h => h._id !== this.selectedHorario._id);
                            this.applyFilters();
                        }
                        this.closeModal();
                        return;
                    }
                }
            } catch (err) {
                console.warn('Availability check failed, proceeding to reserve (will rely on server validation):', err);
            }

            const response = await fetch(`${authManager.baseURL}/estudiantes/reservar`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(reservaData)
            });

            if (response.ok) {
                authManager.showMessage('Reserva creada exitosamente', 'success');
                // Remover el horario reservado de la lista local antes de cerrar el modal
                if (this.selectedHorario && this.selectedHorario._id) {
                    this.horarios = this.horarios.filter(h => h._id !== this.selectedHorario._id);
                    this.applyFilters();
                }
                this.closeModal();
                // Refrescar datos relacionados
                // Force refresh to avoid cached 304 responses
                await reservasManager.loadReservas(true);
                reservasManager.renderReservas();
                await dashboardManager.refresh();
            } else if (response.status === 409) {
                // Horario ya reservado, remover de la lista
                authManager.showMessage('Este horario ya fue reservado por otro estudiante', 'error');
                if (this.selectedHorario && this.selectedHorario._id) {
                    this.horarios = this.horarios.filter(h => h._id !== this.selectedHorario._id);
                    this.applyFilters();
                }
                this.closeModal();
                // Force refresh reservas so UI reflects current state
                await reservasManager.loadReservas(true);
                reservasManager.renderReservas();
                await dashboardManager.refresh();
            } else {
                const error = await response.json();
                authManager.showMessage(error.message || 'Error al crear la reserva', 'error');
            }
        } catch (error) {
            console.error('Error creando reserva:', error);
            authManager.showMessage('Error de conexión', 'error');
        } finally {
            this.isReserving = false;
            if (confirmarBtn) {
                confirmarBtn.disabled = false;
                confirmarBtn.textContent = 'Confirmar Reserva';
            }
        }
    }

    // Refrescar horarios
    async refresh() {
        await this.loadHorarios();
        this.applyFilters();
    }
}

// Instancia global
const reservarManager = new ReservarManager();