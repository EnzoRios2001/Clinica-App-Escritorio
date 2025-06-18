// Funciones de utilidad para manejo de fechas y UI

// El array debe coincidir con getDay() de JavaScript (0=Domingo, 1=Lunes, etc.)
export const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sabado'];
export const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Función para manejar errores y mostrar alertas
export function handleError(error, mensaje) {
    console.error(mensaje, error);
    alert(`${mensaje}: ${error.message}`);
}

// Función para mostrar/ocultar elementos
export function toggleElementDisplay(elementId, show) {
    document.getElementById(elementId).style.display = show ? 'block' : 'none';
}

// Función para formatear fecha
export function formatearFecha(fecha) {
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const año = fecha.getFullYear();
    return `${dia} de ${mes} de ${año}`;
}

// Función para generar intervalos de tiempo
export function generarIntervalosHorarios(horaInicio, horaFin) {
    const intervalos = [];
    const [horaInicioHoras, horaInicioMinutos] = horaInicio.split(':').map(Number);
    const [horaFinHoras, horaFinMinutos] = horaFin.split(':').map(Number);
    
    let currentTime = new Date();
    currentTime.setHours(horaInicioHoras, horaInicioMinutos, 0);
    
    const endTime = new Date();
    endTime.setHours(horaFinHoras, horaFinMinutos, 0);
    
    while (currentTime < endTime) {
        intervalos.push(
            currentTime.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            })
        );
        currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return intervalos;
}

// Función para actualizar selects
export function actualizarSelect(selectId, opciones, valorPorDefecto = '', textoInicial = 'Seleccione una opción') {
    const select = document.getElementById(selectId);
    const selectedValue = select.value;
    select.innerHTML = `<option value="">${textoInicial}</option>`;

    opciones.forEach(opcion => {
        const option = document.createElement('option');
        option.value = opcion.id || opcion.value;
        option.textContent = opcion.texto || opcion.nombre;
        if (option.value.toString() === selectedValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    return selectedValue;
} 