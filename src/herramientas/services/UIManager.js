import { supabase } from '../supabaseClient.js';

export class UIManager {
    constructor() {
        this.calendar = null;
        this.dbService = null;
    }    init(calendarManager, databaseService) {
        this.calendar = calendarManager;
        this.dbService = databaseService;
        this.isUpdating = false;
        this.inicializarAutenticacion(); // Inicializar el sistema de autenticación
    }

    setupEventListeners() {
        document.getElementById('especialistaSelect')?.addEventListener('change', (e) => this.handleEspecialistaChange(e));
        document.getElementById('especialidadSelect')?.addEventListener('change', (e) => this.handleEspecialidadChange(e));
        document.getElementById('prevMonth')?.addEventListener('click', () => this.handlePrevMonth());
        document.getElementById('nextMonth')?.addEventListener('click', () => this.handleNextMonth());
    }

    async handleEspecialistaChange(e) {
        if (this.isUpdating) return;
        this.isUpdating = true;

        const especialistaId = e.target.value;
        if (especialistaId) {
            // Limpiar solo la especialidad sin triggear su evento
            const especialidadSelect = document.getElementById('especialidadSelect');
            if (especialidadSelect) {
                especialidadSelect.value = '';
            }
            await this.cargarHorariosEspecialista(especialistaId);
        } else {
            await this.resetearSeleccion();
        }
        this.actualizarCalendario();
        this.isUpdating = false;
    }

    async handleEspecialidadChange(e) {
        if (this.isUpdating) return;
        this.isUpdating = true;

        const especialidadId = e.target.value;
        if (especialidadId) {
            // Limpiar solo el especialista sin triggear su evento
            const especialistaSelect = document.getElementById('especialistaSelect');
            if (especialistaSelect) {
                especialistaSelect.value = '';
            }
            await this.cargarEspecialistas(especialidadId);
        } else {
            await this.cargarEspecialistas();
        }
        this.actualizarCalendario();
        this.isUpdating = false;
    }

    async resetearSeleccion() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        const especialistaSelect = document.getElementById('especialistaSelect');
        const especialidadSelect = document.getElementById('especialidadSelect');

        if (especialistaSelect) especialistaSelect.value = '';
        if (especialidadSelect) especialidadSelect.value = '';

        await this.cargarEspecialidades();
        this.calendar.limpiarDiasDisponibles();
        this.isUpdating = false;
    }

    async cargarHorariosEspecialista(especialistaId) {
        const { data: horarios, error } = await this.dbService.getHorariosEspecialista(especialistaId);
        if (error) throw error;        // Convertir números de día a nombres (ajustado para que 1=Lunes, 7=Domingo)
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const diasDisponibles = horarios.map(h => diasSemana[h.dia_semana - 1]);

        this.calendar.setDiasDisponibles(diasDisponibles);
        // También guardar los horarios para uso posterior
        this.calendar.setHorarioEspecialista(horarios);
    }

    handlePrevMonth() {
        this.calendar.retrocederMes();
        this.actualizarCalendario();
    }

    handleNextMonth() {
        this.calendar.avanzarMes();
        this.actualizarCalendario();
    }

    async cargarEspecialistas(especialidadId = null) {
        const { data: especialistas, error } = await this.dbService.getEspecialistas(especialidadId);
        if (error) throw error;
        this.actualizarSelectEspecialistas(especialistas);
    }

    async cargarEspecialidades() {
        const { data: especialidades, error } = await this.dbService.getEspecialidades();
        if (error) throw error;
        this.actualizarSelectEspecialidades(especialidades);
    }

    actualizarSelectEspecialistas(especialistas) {
        const select = document.getElementById('especialistaSelect');
        select.innerHTML = '<option value="">Seleccione un especialista</option>';
        especialistas?.forEach(esp => {
            if (esp.persona) {
                const option = document.createElement('option');
                option.value = esp.id;
                option.textContent = `${esp.persona.nombre} ${esp.persona.apellido}`;
                select.appendChild(option);
            }
        });
    }

    actualizarSelectEspecialidades(especialidades) {
        const select = document.getElementById('especialidadSelect');
        select.innerHTML = '<option value="">Seleccione una especialidad</option>';
        especialidades?.forEach(esp => {
            const option = document.createElement('option');
            option.value = esp.id;
            option.textContent = esp.especialidad;
            select.appendChild(option);
        });
    }

    actualizarCalendario() {
        const calendarDays = document.getElementById('calendar-days');
        const { firstDayIndex, lastDayOfMonth, year, month } = this.calendar.generarDiasCalendario();

        // Actualizar título del mes
        document.getElementById('currentMonth').textContent =
            `${new Date(year, month).toLocaleString('es-ES', { month: 'long' })} ${year}`;

        calendarDays.innerHTML = '';
        this.generarDiasCalendario(firstDayIndex, lastDayOfMonth, year, month);
    }

    generarDiasCalendario(firstDayIndex, lastDayOfMonth, year, month) {
        const calendarDays = document.getElementById('calendar-days');
        const today = new Date();

        // Días del mes actual
        for (let day = 1; day <= lastDayOfMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;

            const currentDayDate = new Date(year, month, day);

            if (this.esFechaHoy(currentDayDate, today)) {
                dayElement.classList.add('today');
            }

            if (this.esFechaPasada(currentDayDate) || !this.calendar.esDiaDisponible(currentDayDate)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.onclick = () => this.seleccionarFecha(dayElement, currentDayDate);
            }

            calendarDays.appendChild(dayElement);
        }
    }

    esFechaHoy(fecha, hoy) {
        return fecha.getDate() === hoy.getDate() &&
            fecha.getMonth() === hoy.getMonth() &&
            fecha.getFullYear() === hoy.getFullYear();
    }

    esFechaPasada(fecha) {
        return fecha < new Date().setHours(0, 0, 0, 0);
    }

    seleccionarFecha(elemento, fecha) {
        document.querySelector('.selected')?.classList.remove('selected');
        elemento.classList.add('selected');
        this.calendar.seleccionarFecha(fecha);
        this.mostrarModalHorarios();
    }

    async mostrarModalHorarios() {
        // Implementar lógica del modal de horarios
    }

    async mostrarFormularioTurno(fecha) {
        if (!fecha) {
            console.error('No se proporcionó una fecha');
            return;
        }

        // Obtener el horario del especialista para el día seleccionado
        const horarioEspecialista = this.calendar.getHorarioEspecialista();
        if (!horarioEspecialista) {
            console.error('No hay horario configurado para el especialista');
            return;
        }

        // Convertir del día de JavaScript (0=Domingo) al formato de la base de datos (1=Lunes)
        let diaSemana = fecha.getDay();
        // Convertir de 0-6 (Domingo a Sábado) a 1-7 (Lunes a Domingo)
        diaSemana = diaSemana === 0 ? 7 : diaSemana; // Si es domingo (0), convertir a 7
        console.log('Día de la semana (BD):', diaSemana);

        const horarioDia = horarioEspecialista.find(h => h.dia_semana === diaSemana);
        
        if (!horarioDia) {
            console.error('No hay horario configurado para este día');
            return;
        }

        await this.mostrarModalHorarios(fecha, horarioDia);
    }

    async mostrarModalHorarios(fecha, horarioDia) {
        if (!fecha || !horarioDia) {
            console.error('No hay horario o fecha seleccionada');
            return;
        }

        // Crear el modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Seleccionar Horario</h2>
                <div class="horarios-container">
                    <p>Fecha: ${fecha.toLocaleDateString()}</p>
                    <p>Horario: ${horarioDia.hora_inicio} - ${horarioDia.hora_fin}</p>
                    <button class="btn-confirmar">Confirmar Turno</button>
                </div>
            </div>
        `;

        // Agregar estilos al modal
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                display: block;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.4);
            }
            .modal-content {
                background-color: #fefefe;
                margin: 15% auto;
                padding: 20px;
                border: 1px solid #888;
                width: 80%;
                max-width: 500px;
                border-radius: 8px;
                position: relative;
            }
            .close {
                color: #aaa;
                float: right;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
            }
            .close:hover {
                color: black;
            }
            .horarios-container {
                margin-top: 20px;
            }
            .btn-confirmar {
                background-color: #4CAF50;
                color: white;
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 15px;
            }
            .btn-confirmar:hover {
                background-color: #45a049;
            }
        `;

        document.head.appendChild(style);
        document.body.appendChild(modal);

        // Manejar el cierre del modal
        const closeBtn = modal.querySelector('.close');
        closeBtn.onclick = () => {
            document.body.removeChild(modal);
        };

        // Cerrar el modal haciendo clic fuera de él
        window.onclick = (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        };        // Manejar la confirmación del turno
        const confirmarBtn = modal.querySelector('.btn-confirmar');
        confirmarBtn.onclick = async () => {
            try {
                const pacienteId = await this.obtenerPacienteId(); // Necesitamos implementar este método
                const especialistaId = document.getElementById('especialistaSelect').value;
                const especialidadId = document.getElementById('especialidadSelect').value;

                if (!pacienteId || !especialistaId || !especialidadId) {
                    alert('Faltan datos necesarios para crear el turno');
                    return;
                }

                const turnoData = {
                    pacienteId: pacienteId,
                    especialistaId: especialistaId,
                    especialidadId: especialidadId,
                    fecha: fecha.toISOString().split('T')[0], // Formato YYYY-MM-DD
                    hora: horarioDia.hora_inicio,
                    nombreDia: horarioDia.dia_semana,
                    mes: fecha.getMonth() + 1,
                    año: fecha.getFullYear()
                };

                console.log('Guardando turno:', turnoData);
                const { data, error } = await this.dbService.crearTurno(turnoData);

                if (error) {
                    console.error('Error al crear el turno:', error);
                    alert('Error al crear el turno: ' + error.message);
                    return;
                }

                console.log('Turno creado exitosamente:', data);
                alert('Turno reservado exitosamente');
                document.body.removeChild(modal);
            } catch (error) {
                console.error('Error al procesar el turno:', error);
                alert('Error al procesar el turno: ' + error.message);
            }
        };
    }

    async obtenerPacienteId() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('No hay un usuario autenticado');
        }

        // Buscar el paciente en la tabla persona usando el id del usuario autenticado
        const { data: persona, error } = await supabase
            .from('persona')
            .select('id')                .eq('id', user.id)
            .single();

        if (error || !persona) {
            console.error('Error al obtener el ID del paciente:', error);
            throw new Error('No se pudo obtener la información del paciente');
        }

        return persona.id;
    }    async mostrarInformacionUsuario() {
        const userIdElement = document.getElementById('userId');
        if (!userIdElement) {
            console.error('No se encontró el elemento userId');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                userIdElement.textContent = 'Usuario no identificado';
                return;
            }

            console.log('ID de usuario autenticado:', user.id);

            // Obtener solo nombre y apellido de la persona usando el id del usuario autenticado
            const { data: persona, error } = await supabase
                .from('persona')
                .select('nombre, apellido')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error al obtener información del usuario:', error);
                userIdElement.textContent = 'Error al cargar información';
                return;
            }

            if (!persona) {
                console.log('No se encontró información del usuario en la tabla persona');
                userIdElement.textContent = `Usuario: ${user.id}`;
                return;
            }

            console.log('Información del paciente encontrada:', persona);
            userIdElement.textContent = `${persona.nombre} ${persona.apellido}`;
        } catch (error) {
            console.error('Error al mostrar información del usuario:', error);
            if (userIdElement) {
                userIdElement.textContent = 'Error al cargar información';
            }
        }
    }

    async inicializarAutenticacion() {
        const { data: { session } } = await supabase.auth.getSession();
        this.actualizarUIAutenticacion(session !== null);

        // Escuchar cambios en la autenticación
        supabase.auth.onAuthStateChange((_event, session) => {
            this.actualizarUIAutenticacion(session !== null);
            if (session) {
                this.mostrarInformacionUsuario();
            }
        });

        // Configurar event listeners para el formulario de login
        const authForm = document.getElementById('authForm');
        const logoutBtn = document.getElementById('logoutBtn');

        authForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            await this.iniciarSesion(email, password);
        });

        logoutBtn?.addEventListener('click', () => this.cerrarSesion());
    }    actualizarUIAutenticacion(estaAutenticado) {
        const loginForm = document.getElementById('loginForm');
        const logoutBtn = document.getElementById('logoutBtn');
        const userId = document.getElementById('userId');

        if (!loginForm || !logoutBtn || !userId) {
            console.error('No se encontraron elementos de la UI');
            return;
        }

        if (estaAutenticado) {
            loginForm.style.display = 'none';
            logoutBtn.style.display = 'block';
            this.mostrarInformacionUsuario();
        } else {
            loginForm.style.display = 'block';
            logoutBtn.style.display = 'none';
            userId.textContent = 'Usuario no identificado';
        }
    }

    async iniciarSesion(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            console.log('Inicio de sesión exitoso:', data);
            document.getElementById('email').value = '';
            document.getElementById('password').value = '';
        } catch (error) {
            console.error('Error al iniciar sesión:', error.message);
            alert('Error al iniciar sesión: ' + error.message);
        }
    }

    async cerrarSesion() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Error al cerrar sesión:', error.message);
            alert('Error al cerrar sesión: ' + error.message);
        }
    }
}
