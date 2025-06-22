import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { useNavigate } from 'react-router-dom';
import './GestionTurnos.css';

function GestionTurnos() {
  const [turnos, setTurnos] = useState([]);
  const [filtroActual, setFiltroActual] = useState('pendientes');
  const [registroData, setRegistroData] = useState([]);
  const [sortColumn, setSortColumn] = useState('cambiado_en');
  const [sortDirection, setSortDirection] = useState('desc');
  const [expandedRows, setExpandedRows] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        cargarTurnos();
      }
    };
    checkUser();
  }, [navigate, filtroActual]);

  const cargarTurnos = async () => {
    try {
      if (filtroActual === 'registro') {
        await cargarRegistro();
        return;
      }

      let query = supabase.from('solicitudes_turno').select('*');
      
      if (filtroActual === 'pendientes') {
        query = query.eq('estado', 'pendiente');
      } else if (filtroActual === 'confirmados') {
        query = query.eq('estado', 'confirmado');
      } else if (filtroActual === 'rechazados') {
        query = query.or('estado.eq.rechazado,estado.eq.cancelado');
      }

      const { data: turnosData, error } = await query;
      if (error) throw error;

      const turnosConDetalles = await Promise.all(
        turnosData.map(async (turno) => {
          const { data: persona } = await supabase
            .from('persona')
            .select('id, nombre, apellido, dni')
            .eq('id', turno.id_paciente)
            .single();

          const { data: especialista } = await supabase
            .from('persona')
            .select('nombre, apellido')
            .eq('id', turno.id_especialista)
            .single();

          const { data: esp } = await supabase
            .from('especialidades')
            .select('*')
            .eq('id', turno.id_especialidad)
            .single();

          console.log('Datos del turno:', turno);
          console.log('Datos de especialidad:', esp);

          return {
            ...turno,
            persona,
            especialista,
            especialidad: esp
          };
        })
      );

      setTurnos(turnosConDetalles);
    } catch (error) {
      console.error('Error al cargar los turnos:', error);
      alert('Error al cargar los turnos: ' + error.message);
    }
  };

  const cargarRegistro = async () => {
    try {
      const { data: registros, error } = await supabase
        .from('estado_solicitudes_turno')
        .select('*, persona:cambiado_por (nombre, apellido)');

      if (error) throw error;
      setRegistroData(registros);
    } catch (error) {
      alert('Error al cargar el registro: ' + error.message);
    }
  };

  const actualizarEstado = async (id, nuevoEstado) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Obtener los datos del usuario desde la tabla persona
      const { data: userData, error: userError } = await supabase
        .from('persona')
        .select('id')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      const { error: errorUpdate } = await supabase
        .from('solicitudes_turno')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (errorUpdate) throw errorUpdate;

      const { error } = await supabase
        .from('estado_solicitudes_turno')
        .insert({ 
          id_turno: id,
          estado_nuevo: nuevoEstado,
          cambiado_por: userData.id
        });

      if (error) throw error;

      alert('Estado actualizado correctamente');
      cargarTurnos();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar el estado: ' + error.message);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderRegistroTable = () => {
    const sortedData = [...registroData].sort((a, b) => {
      let valorA = a[sortColumn];
      let valorB = b[sortColumn];

      if (sortColumn === 'cambiado_por') {
        valorA = a.persona ? `${a.persona.nombre} ${a.persona.apellido}` : '';
        valorB = b.persona ? `${b.persona.nombre} ${b.persona.apellido}` : '';
      }

      return (sortDirection === 'asc' ? 1 : -1) * (valorA < valorB ? -1 : 1);
    });

    return (
      <div className="registro-container">
        <table id="tablaRegistro">
          <thead>
            <tr>
              <th onClick={() => handleSort('id_turno')}>ID Turno</th>
              <th onClick={() => handleSort('estado_nuevo')}>Estado</th>
              <th onClick={() => handleSort('cambiado_por')}>Cambiado Por</th>
              <th onClick={() => handleSort('cambiado_en')}>Fecha Cambio</th>
              <th onClick={() => handleSort('cambiado_alas')}>Hora Cambio</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((registro) => (
              <tr key={registro.id}>
                <td>{registro.id_turno}</td>
                <td>{registro.estado_nuevo}</td>
                <td>
                  {registro.persona ? 
                    `${registro.persona.nombre} ${registro.persona.apellido}` : 
                    'N/A'}
                </td>
                <td>{new Date(registro.cambiado_en).toLocaleDateString()}</td>
                <td>{registro.cambiado_alas || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const handleSort = (column) => {
    setSortDirection(sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortColumn(column);
  };

  return (
    <div className="container">
      <button className="volver-btn" onClick={() => navigate('/')}>
        Volver al Panel
      </button>
      <h2>Gestión de Turnos</h2>
      
      <div className="filtros-container">
        <button 
          className={`filtro-btn btn-todos ${filtroActual === 'todos' ? 'activo' : ''}`}
          onClick={() => setFiltroActual('todos')}
        >
          Todos los turnos
        </button>
        <button 
          className={`filtro-btn btn-pendientes ${filtroActual === 'pendientes' ? 'activo' : ''}`}
          onClick={() => setFiltroActual('pendientes')}
        >
          Turnos Pendientes
        </button>
        <button 
          className={`filtro-btn btn-confirmados ${filtroActual === 'confirmados' ? 'activo' : ''}`}
          onClick={() => setFiltroActual('confirmados')}
        >
          Turnos Confirmados
        </button>
        <button 
          className={`filtro-btn btn-rechazados ${filtroActual === 'rechazados' ? 'activo' : ''}`}
          onClick={() => setFiltroActual('rechazados')}
        >
          Turnos Cancelados/Rechazados
        </button>
        <button 
          className={`filtro-btn btn-registro ${filtroActual === 'registro' ? 'activo' : ''}`}
          onClick={() => setFiltroActual('registro')}
        >
          Registro de Estados
        </button>
      </div>

      {filtroActual === 'registro' ? (
        renderRegistroTable()
      ) : (
        <div className="tabla-turnos">
          <table id="tablaTurnos">
            <thead>
              <tr>
                <th></th>
                <th>ID</th>
                <th>DNI</th>
                <th>Día Elegido</th>
                <th>Fecha del Turno</th>
                <th>Hora del Turno</th>
                <th>Estado Actual</th>
                <th>Cambiar Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((turno) => (
                <React.Fragment key={turno.id}>
                  <tr>
                    <td>
                      <button 
                        className={`expandir-btn ${expandedRows[turno.id] ? 'activo' : ''}`}
                        onClick={() => toggleExpanded(turno.id)}
                      >
                        ▼
                      </button>
                    </td>
                    <td>{turno.id}</td>
                    <td>{turno.persona?.dni}</td>
                    <td>{turno.id_dia}</td>
                    <td>{turno.fecha_turno}</td>
                    <td>{turno.hora_turno}</td>
                    <td>{turno.estado || 'Sin estado'}</td>
                    <td>
                      <select 
                        className="estado-select"
                        onChange={(e) => actualizarEstado(turno.id, e.target.value)}
                      >
                        <option value="">Seleccionar estado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td>
                      <button 
                        className="actualizar-btn"
                        onClick={() => {
                          const select = document.querySelector(`select[data-id="${turno.id}"]`);
                          if (select && select.value) {
                            actualizarEstado(turno.id, select.value);
                          } else {
                            alert('Por favor seleccione un estado');
                          }
                        }}
                      >
                        Actualizar
                      </button>
                    </td>
                  </tr>
                  {expandedRows[turno.id] && (
                    <tr className="expandible-row">
                      <td colSpan="9">
                        <div className="detalles-turno">
                          <div className="detalles-grid">
                            <div className="detalle-item">
                              <div className="detalle-titulo">Nombre del Paciente</div>
                              <div className="detalle-valor">{turno.persona?.nombre}</div>
                            </div>
                            <div className="detalle-item">
                              <div className="detalle-titulo">Apellido</div>
                              <div className="detalle-valor">{turno.persona?.apellido}</div>
                            </div>
                            <div className="detalle-item">
                              <div className="detalle-titulo">ID Usuario</div>
                              <div className="detalle-valor">{turno.persona?.id}</div>
                            </div>
                            <div className="detalle-item">
                              <div className="detalle-titulo">Especialista: Nombre</div>
                              <div className="detalle-valor">{turno.especialista?.nombre}</div>
                            </div>
                            <div className="detalle-item">
                              <div className="detalle-titulo">Especialista: Apellido</div>
                              <div className="detalle-valor">{turno.especialista?.apellido}</div>
                            </div>
                            <div className="detalle-item">
                              <div className="detalle-titulo">Especialidad</div>
                              <div className="detalle-valor">{turno.id_especialidad}</div>
                            </div>
                            <div className="detalle-item">
                              <div className="detalle-titulo">ID Turno</div>
                              <div className="detalle-valor">{turno.id}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GestionTurnos;
