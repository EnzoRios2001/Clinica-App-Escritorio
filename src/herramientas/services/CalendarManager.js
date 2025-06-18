export class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.diasDisponibles = [];
        this.horarioEspecialista = null;
        this.uiManager = null;
    }

    init(uiManager) {
        console.log('Inicializando CalendarManager');
        this.uiManager = uiManager;
    }

    setDiasDisponibles(dias) {
        this.diasDisponibles = dias;
    }

    setHorarioEspecialista(horario) {
        this.horarioEspecialista = horario;
    }

    getHorarioEspecialista() {
        return this.horarioEspecialista;
    }

    esDiaDisponible(fecha) {
        if (!this.diasDisponibles.length) {
            console.log('No hay días disponibles configurados');
            return false;
        }
        const nombreDia = this.obtenerNombreDia(fecha);
        console.log(`Verificando disponibilidad para ${nombreDia}:`, {
            fecha: fecha.toISOString(),
            diasDisponibles: this.diasDisponibles,
            estaDisponible: this.diasDisponibles.includes(nombreDia)
        });
        return this.diasDisponibles.includes(nombreDia);
    }

    obtenerNombreDia(fecha) {
        const dias = {
            0: 'Domingo',
            1: 'Lunes',
            2: 'Martes',
            3: 'Miércoles',
            4: 'Jueves',
            5: 'Viernes',
            6: 'Sábado'
        };
        const nombreDia = dias[fecha.getDay()];
        console.log(`Convirtiendo fecha ${fecha.toISOString()} a día: ${nombreDia}`);
        return nombreDia;
    }

    handleDayClick(day) {
        console.log('Día clickeado:', day);
        const fecha = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
        if (this.esDiaDisponible(fecha)) {
            console.log('Es un día disponible, abriendo formulario');
            this.mostrarFormularioTurno(fecha);
        } else {
            console.log('No es un día disponible');
        }
    }

    mostrarFormularioTurno(fecha) {
        if (!this.uiManager) {
            console.error('UIManager no inicializado');
            return;
        }
        this.uiManager.mostrarFormularioTurno(fecha);
    }

    generarDiasCalendario() {
        console.log('Generando días del calendario');
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Crear fecha para el primer día del mes
        const firstDay = new Date(year, month, 1);
        const firstDayIndex = firstDay.getDay(); // 0-6 (Domingo-Sábado)
        
        // Crear fecha para el último día del mes
        const lastDay = new Date(year, month + 1, 0);
        const lastDate = lastDay.getDate();
        
        console.log('Datos del calendario:', {
            año: year,
            mes: month + 1,
            primerDia: firstDayIndex,
            ultimoDia: lastDate
        });

        const calendar = document.getElementById('calendar-days');
        if (!calendar) {
            console.error('No se encontró el elemento calendar-days');
            return;
        }

        calendar.innerHTML = '';
        
        // Agregar días vacíos hasta el primer día del mes
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            calendar.appendChild(emptyDay);
        }

        // Agregar los días del mes
        for (let day = 1; day <= lastDate; day++) {
            const dayElement = document.createElement('div');
            const fecha = new Date(year, month, day);
            dayElement.className = 'calendar-day';
            dayElement.textContent = day;
            
            if (this.esDiaDisponible(fecha)) {
                dayElement.classList.add('disponible');
                dayElement.addEventListener('click', () => {
                    console.log('Día clickeado:', day);
                    this.handleDayClick(day);
                });
            }
            
            calendar.appendChild(dayElement);
        }

        // Actualizar el título del mes
        const monthTitle = document.getElementById('currentMonth');
        if (monthTitle) {
            const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            monthTitle.textContent = `${months[month]} ${year}`;
        }
    }

    avanzarMes() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }

    retrocederMes() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    }

    seleccionarFecha(fecha) {
        this.selectedDate = fecha;
    }

    getFechaSeleccionada() {
        return this.selectedDate;
    }
}
