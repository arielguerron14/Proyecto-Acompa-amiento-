// reservar.js - Gestión de reserva de horarios por estudiantes

class ReservarManager {
    constructor() {
        this.horarios = [];
        this.selectedHorario = null;
        this.materias = new Set();
        this.semestres = new Set();
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
                // Filtrar solo horarios activos
                this.horarios = allHorarios.filter(h => h.estado === 'Activo');

                // Extraer materias únicas para el filtro
                this.materias = new Set(this.horarios.map(h => h.materiaNombre).filter(Boolean));
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
            filteredHorarios = filteredHorarios.filter(h => h.materiaNombre === filtroMateria);
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
            <div class="horario-card" data-horario-id="${horario.id}">
                <div class="horario-header">
                    <div class="horario-materia">${horario.materiaNombre || 'Materia no especificada'}</div>
                    <div class="horario-maestro">${horario.maestroName || 'Maestro no especificado'}</div>
                </div>
                <div class="horario-info">
                    <div class="horario-info-item">
                        <span class="info-icon">📅</span>
                        ${horario.dia || 'N/A'}
                    </div>
                    <div class="horario-info-item">
                        <span class="info-icon">⏰</span>
                        ${horario.horaInicio || 'N/A'} - ${horario.horaFin || 'N/A'}
                    </div>
                    <div class="horario-info-item">
                        <span class="info-icon">📍</span>
                        ${horario.modalidad || 'N/A'}
                    </div>
                </div>
                <button class="btn-reservar" onclick="reservarManager.selectHorario('${horario.id}')">
                    Reservar Horario
                </button>
            </div>
        `;
    }

    // Seleccionar horario para reserva
    selectHorario(horarioId) {
        const horario = this.horarios.find(h => h.id === horarioId);
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
            <p><strong>Materia:</strong> ${this.selectedHorario.materiaNombre || 'N/A'}</p>
            <p><strong>Maestro:</strong> ${this.selectedHorario.maestroName || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${this.selectedHorario.dia || 'N/A'}</p>
            <p><strong>Hora:</strong> ${this.selectedHorario.horaInicio || 'N/A'} - ${this.selectedHorario.horaFin || 'N/A'}</p>
            <p><strong>Modalidad:</strong> ${this.selectedHorario.modalidad || 'N/A'}</p>
            <p><strong>Lugar:</strong> ${this.selectedHorario.lugarAtencion || 'N/A'}</p>
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
    }

    // Confirmar reserva
    async confirmarReserva() {
        if (!this.selectedHorario) return;

        try {
            const user = await authManager.getUserData();
            if (!user) return;

            const reservaData = {
                estudianteId: user.id,
                estudianteName: user.name,
                maestroId: this.selectedHorario.maestroId,
                maestroName: this.selectedHorario.maestroName,
                materia: this.selectedHorario.materiaNombre,
                dia: this.selectedHorario.dia,
                inicio: this.selectedHorario.horaInicio,
                fin: this.selectedHorario.horaFin,
                modalidad: this.selectedHorario.modalidad
            };

            const response = await fetch(`${authManager.baseURL}/estudiantes/reservar`, {
                method: 'POST',
                headers: authManager.getAuthHeaders(),
                body: JSON.stringify(reservaData)
            });

            if (response.ok) {
                authManager.showMessage('Reserva creada exitosamente', 'success');
                this.closeModal();
                // Remover el horario reservado de la lista local
                this.horarios = this.horarios.filter(h => h.id !== this.selectedHorario.id);
                this.applyFilters();
                // Refrescar datos relacionados
                await reservasManager.refresh();
                await dashboardManager.refresh();
            } else {
                const error = await response.json();
                authManager.showMessage(error.message || 'Error al crear la reserva', 'error');
            }
        } catch (error) {
            console.error('Error creando reserva:', error);
            authManager.showMessage('Error de conexión', 'error');
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