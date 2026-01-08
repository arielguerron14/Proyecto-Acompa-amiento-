// reservas-combined.js - Gestión completa de reservas (crear, listar, cancelar)

class ReservasManager {
    constructor() {
        this.horarios = [];
        this.reservas = [];
        this.selectedHorario = null;
        this.materias = new Set();
        this.semestres = new Set();
        this.isReserving = false;
    }

    // ==================== SECCIÓN: Inicialización ====================
    
    async init() {
        this.setupEventListeners();
        await this.loadHorarios();
        await this.loadReservas();
        this.applyFilters();  // Apply filters after loading both horarios and reservas
        this.renderReservas();
    }

    // ==================== SECCIÓN: Event Listeners ====================
    
    setupEventListeners() {
        // Filtros de horarios
        const filtroSemestre = document.getElementById('filtro-semestre');
        const filtroMateria = document.getElementById('filtro-materia');
        const filtroDia = document.getElementById('filtro-dia');

        if (filtroSemestre) filtroSemestre.addEventListener('change', () => this.applyFilters());
        if (filtroMateria) filtroMateria.addEventListener('change', () => this.applyFilters());
        if (filtroDia) filtroDia.addEventListener('change', () => this.applyFilters());

        // Botón refrescar horarios
        const refreshBtn = document.getElementById('refresh-horarios');
        if (refreshBtn) refreshBtn.addEventListener('click', () => this.refreshHorarios());

        // Modal
        const modal = document.getElementById('reserva-modal');
        const modalClose = modal?.querySelector('.modal-close');
        const cancelarBtn = document.getElementById('cancelar-reserva');
        const confirmarBtn = document.getElementById('confirmar-reserva');

        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        if (cancelarBtn) cancelarBtn.addEventListener('click', () => this.closeModal());
        if (confirmarBtn) confirmarBtn.addEventListener('click', () => this.confirmarReserva());

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        }
    }

    // ==================== SECCIÓN: Cargar Horarios ====================
    
    async loadHorarios() {
        try {
            const loadingEl = document.getElementById('horarios-loading');
            const emptyEl = document.getElementById('horarios-empty');
            const listEl = document.getElementById('horarios-list');

            if (loadingEl) loadingEl.style.display = 'block';
            if (emptyEl) emptyEl.style.display = 'none';
            if (listEl) listEl.style.display = 'none';

            const response = await fetch(`${authManager.baseURL}/horarios`, {
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                this.horarios = await response.json();
                this.materias = new Set(this.horarios.map(h => h.materia).filter(Boolean));
                this.updateFiltroMaterias();
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

    async refreshHorarios() {
        const refreshBtn = document.getElementById('refresh-horarios');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<span class="refresh-icon">⏳</span> Actualizando...';
        }

        try {
            await this.loadHorarios();
            await this.loadReservas(true);  // Also refresh reservas to get latest state
            this.applyFilters();  // Apply filters to exclude reserved horarios
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

    showRefreshMessage(message, type) {
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
        messageEl.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';

        document.body.appendChild(messageEl);
        setTimeout(() => {
            messageEl.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (messageEl.parentNode) messageEl.parentNode.removeChild(messageEl);
            }, 300);
        }, 3000);
    }

    // ==================== SECCIÓN: Filtros de Horarios ====================
    
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

        if (currentValue && this.materias.has(currentValue)) {
            filtroMateria.value = currentValue;
        }
    }

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

        if (currentValue && this.semestres.has(Number(currentValue))) {
            filtroSemestre.value = currentValue;
        }
    }

    applyFilters() {
        const filtroSemestre = document.getElementById('filtro-semestre')?.value || '';
        const filtroMateria = document.getElementById('filtro-materia')?.value || '';
        const filtroDia = document.getElementById('filtro-dia')?.value || '';

        let filteredHorarios = [...this.horarios];

        // Excluir horarios que ya están reservados (activos)
        const activeReservedSlots = this.reservas
            .filter(r => r.estado === 'Activa')
            .map(r => `${r.maestroId}|${r.dia}|${r.inicio}`);
        
        filteredHorarios = filteredHorarios.filter(h => 
            !activeReservedSlots.includes(`${h.maestroId}|${h.dia}|${h.inicio}`)
        );

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

    // ==================== SECCIÓN: Renderizar Horarios ====================
    
    renderHorarios(horariosToRender = null) {
        const loadingEl = document.getElementById('horarios-loading');
        const emptyEl = document.getElementById('horarios-empty');
        const listEl = document.getElementById('horarios-list');

        if (loadingEl) loadingEl.style.display = 'none';

        const horarios = horariosToRender || this.horarios;
        const hasActiveFilters = (document.getElementById('filtro-semestre')?.value || '') ||
                                 (document.getElementById('filtro-materia')?.value || '') ||
                                 (document.getElementById('filtro-dia')?.value || '');

        if (!horarios || horarios.length === 0) {
            if (emptyEl) {
                emptyEl.style.display = 'block';
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
                <button class="btn-reservar" onclick="reservasManager.selectHorario('${horario._id}')">
                    Reservar Horario
                </button>
            </div>
        `;
    }

    // ==================== SECCIÓN: Modal de Reserva ====================
    
    selectHorario(horarioId) {
        const horario = this.horarios.find(h => h._id === horarioId);
        if (!horario) return;

        this.selectedHorario = horario;
        this.showModal();
    }

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

    closeModal() {
        const modal = document.getElementById('reserva-modal');
        if (modal) modal.style.display = 'none';
        this.selectedHorario = null;
        this.isReserving = false;
    }

    // ==================== SECCIÓN: Crear Reserva ====================
    
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

            console.debug('Reservar: sending reservaData', reservaData);

            // Pre-check availability
            try {
                const checkUrl = `${authManager.baseURL}/estudiantes/reservas/check?maestroId=${encodeURIComponent(reservaData.maestroId)}&dia=${encodeURIComponent(reservaData.dia)}&inicio=${encodeURIComponent(reservaData.inicio)}`;
                const checkRes = await fetch(checkUrl, { headers: authManager.getAuthHeaders() });
                if (checkRes.ok) {
                    const j = await checkRes.json();
                    if (!j.available) {
                        authManager.showMessage('Lo siento, este horario ya fue reservado. Se actualizará la lista.', 'error');
                        if (this.selectedHorario && this.selectedHorario._id) {
                            this.horarios = this.horarios.filter(h => h._id !== this.selectedHorario._id);
                            this.applyFilters();
                        }
                        this.closeModal();
                        return;
                    }
                }
            } catch (err) {
                console.warn('Availability check failed, proceeding to reserve:', err);
            }

            const response = await fetch(`${authManager.baseURL}/estudiantes/reservar`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(reservaData)
            });

            if (response.ok) {
                const newReserva = await response.json();
                authManager.showMessage('Reserva creada exitosamente', 'success');
                
                // Optimistic update: add the new reservation to the list immediately
                if (newReserva && newReserva._id) {
                    this.reservas.push(newReserva);
                }
                
                if (this.selectedHorario && this.selectedHorario._id) {
                    this.horarios = this.horarios.filter(h => h._id !== this.selectedHorario._id);
                    this.applyFilters();
                }
                this.closeModal();
                this.renderReservas();
                
                // Reload in background to sync with server
                setTimeout(() => {
                    this.loadReservas(true).then(() => this.renderReservas());
                }, 500);
                
                await dashboardManager.refresh();
            } else if (response.status === 409) {
                authManager.showMessage('Este horario ya fue reservado por otro estudiante', 'error');
                if (this.selectedHorario && this.selectedHorario._id) {
                    this.horarios = this.horarios.filter(h => h._id !== this.selectedHorario._id);
                    this.applyFilters();
                }
                this.closeModal();
                await this.loadReservas(true);
                this.renderReservas();
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

    // ==================== SECCIÓN: Cargar Reservas ====================
    
    async loadReservas(force = false) {
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

            let url = `${authManager.baseURL}/estudiantes/reservas/estudiante/${user.id || user.userId}`;
            if (force) url += `?_ts=${Date.now()}`;

            const response = await fetch(url, {
                headers: Object.assign({}, authManager.getAuthHeaders()),
                cache: 'no-store'
            });

            console.log('Response status:', response.status);
            if (response.status === 304) {
                console.log('Reservas sin cambios (304), manteniendo lista en memoria');
                this.renderReservas();
                return;
            }

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

    // ==================== SECCIÓN: Renderizar Reservas ====================
    
    renderReservas() {
        const loadingEl = document.getElementById('reservas-loading');
        const emptyEl = document.getElementById('reservas-empty');
        const listEl = document.getElementById('reservas-list');

        console.log('Rendering reservas (filter active only):', this.reservas);
        console.log('Elements found:', { loadingEl, emptyEl, listEl });

        if (loadingEl) loadingEl.style.display = 'none';

        // Filter to show only active reservas
        const activeReservas = (this.reservas || []).filter(r => r.estado === 'Activa');

        if (!activeReservas || activeReservas.length === 0) {
            console.log('Showing empty message (no active reservas)');
            if (emptyEl) emptyEl.style.display = 'block';
            if (listEl) listEl.style.display = 'none';
            return;
        }

        console.log('Showing list with', activeReservas.length, 'active reservas');
        if (emptyEl) emptyEl.style.display = 'none';
        if (listEl) listEl.style.display = 'grid';

        try {
            const html = activeReservas.map(reserva => this.createReservaCard(reserva)).join('');
            listEl.innerHTML = html;
            if (!html.trim()) {
                if (emptyEl) emptyEl.style.display = 'block';
                if (listEl) listEl.style.display = 'none';
                return;
            }
        } catch (error) {
            console.error('Error rendering reservas:', error);
            listEl.innerHTML = '<p>Error al cargar las reservas. Revisa la consola para más detalles.</p>';
        }
    }

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
                    <div class="reserva-actions">
                        <button class="btn-delete" onclick="if(confirm('¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.')) reservasManager.cancelarReserva('${reserva._id}')">
                            🗑️ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getStatusClass(estado) {
        const statusMap = {
            'Activa': 'confirmada',
            'Cancelada': 'cancelada'
        };
        return statusMap[estado] || 'pendiente';
    }

    getStatusText(estado) {
        const statusMap = {
            'Activa': 'Activa',
            'Cancelada': 'Cancelada'
        };
        return statusMap[estado] || 'Activa';
    }

    // ==================== SECCIÓN: Cancelar Reserva ====================
    
    async cancelarReserva(id) {
        if (!confirm('¿Está seguro de cancelar esta reserva?')) return;

        try {
            const response = await fetch(`${authManager.baseURL}/estudiantes/reservas/${id}/cancel`, {
                method: 'PUT',
                headers: authManager.getAuthHeaders()
            });

            if (response.ok) {
                const updatedReserva = await response.json();
                
                // Optimistic update: update the reservation in the list immediately
                const index = this.reservas.findIndex(r => r._id === id);
                if (index !== -1) {
                    this.reservas[index] = updatedReserva;
                }
                
                authManager.showMessage('Reserva cancelada exitosamente', 'success');
                this.renderReservas();
                
                // Reload in background to sync with server
                setTimeout(() => {
                    this.loadReservas(true).then(() => this.renderReservas());
                }, 500);
                
                await dashboardManager.refresh();
            } else {
                const error = await response.json();
                authManager.showMessage('Error al cancelar: ' + (error.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error cancelando reserva:', error);
            authManager.showMessage('Error de conexión al cancelar la reserva', 'error');
        }
    }

    // ==================== SECCIÓN: Refrescar ====================
    
    async refresh() {
        await this.loadReservas(true);
        this.renderReservas();
    }
}

// Instancia global
const reservasManager = new ReservasManager();
