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
  const [reprogramandoId, setReprogramandoId] = useState(null);
  const [reprogramarData, setReprogramarData] = useState({});
  const navigate = useNavigate();

    // --- VERIFICACIÓN DE ROL ADMINISTRACION ---
  useEffect(() => {
    const verificarRolAdministracion = async () => {
      // 1. Obtener usuario autenticado y su uuid
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("No posee rol administracion");
        navigate("/");
        return;
      }
      const uuid = user.id;
      // 2. Verificar si tiene el rol administracion en rol_persona
      const { data: roles, error: rolError } = await supabase
        .from('rol_persona')
        .select('rol')
        .eq('id', uuid)
        .eq('rol', 'administracion');
      if (rolError || !roles || roles.length === 0) {
        alert("No posee rol administracion");
        navigate("/");
        return;
      }
    };
    verificarRolAdministracion();
  }, [navigate]);
  // --- FIN VERIFICACIÓN DE ROL ADMINISTRACION ---

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
      } else if (filtroActual === 'reprogramados') {
        query = query.eq('estado', 'reprogramado');
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
        .select('*');

      if (error) throw error;

      // Obtener los datos de la persona para cada registro
      const registrosConPersona = await Promise.all(
        registros.map(async (registro) => {
          let persona = null;
          if (registro.cambiado_por) {
            const { data } = await supabase
              .from('persona')
              .select('nombre, apellido')
              .eq('id', registro.cambiado_por)
              .single();
            persona = data;
          }
          return { ...registro, persona };
        })
      );
      setRegistroData(registrosConPersona);
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

  const handleReprogramarClick = (turno) => {
    setReprogramandoId(turno.id);
    setReprogramarData({
      fecha_turno: turno.fecha_turno,
      hora_turno: turno.hora_turno,
      id_especialista: turno.id_especialista,
      id_especialidad: turno.id_especialidad,
      id_dia: turno.id_dia
    });
  };

  const handleReprogramarChange = (e) => {
    const { name, value } = e.target;
    setReprogramarData((prev) => ({ ...prev, [name]: value }));
  };

  const confirmarReprogramacion = async (turno) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      const { data: userData, error: userError } = await supabase
        .from('persona')
        .select('id')
        .eq('id', user.id)
        .single();
      if (userError) throw userError;
      const { error: errorUpdate } = await supabase
        .from('solicitudes_turno')
        .update({
          ...reprogramarData,
          estado: 'reprogramado'
        })
        .eq('id', turno.id);
      if (errorUpdate) throw errorUpdate;
      const { error } = await supabase
        .from('estado_solicitudes_turno')
        .insert({
          id_turno: turno.id,
          estado_nuevo: 'reprogramado',
          cambiado_por: userData.id
        });
      if (error) throw error;
      alert('Turno reprogramado correctamente');
      setReprogramandoId(null);
      cargarTurnos();
    } catch (error) {
      alert('Error al reprogramar el turno: ' + error.message);
    }
  };

  // Diccionarios para mostrar texto en vez de id
  const diasSemana = {
    1: 'Lunes',
    2: 'Martes',
    3: 'Miércoles',
    4: 'Jueves',
    5: 'Viernes',
    6: 'Sábado',
    7: 'Domingo'
  };
  const especialidades = {
    1: 'General',
    2: 'Cardiología',
    3: 'Pediatría',
    4: 'Ginecología'
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
        <button 
          className={`filtro-btn btn-reprogramados ${filtroActual === 'reprogramados' ? 'activo' : ''}`}
          onClick={() => setFiltroActual('reprogramados')}
        >
          Turnos Reprogramados
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
                    <td>
                      {reprogramandoId === turno.id ? (
                        <input
                          type="text"
                          name="id_dia"
                          value={reprogramarData.id_dia || ''}
                          onChange={handleReprogramarChange}
                          style={{width:'80px'}}
                        />
                      ) : (
                        diasSemana[turno.id_dia] || turno.id_dia
                      )}
                    </td>
                    <td>
                      {reprogramandoId === turno.id ? (
                        <input
                          type="date"
                          name="fecha_turno"
                          value={reprogramarData.fecha_turno || ''}
                          onChange={handleReprogramarChange}
                        />
                      ) : (
                        turno.fecha_turno
                      )}
                    </td>
                    <td>
                      {reprogramandoId === turno.id ? (
                        <input
                          type="time"
                          name="hora_turno"
                          value={reprogramarData.hora_turno || ''}
                          onChange={handleReprogramarChange}
                        />
                      ) : (
                        turno.hora_turno
                      )}
                    </td>
                    <td>{turno.estado || 'Sin estado'}</td>
                    <td>
                      <select 
                        className="estado-select"
                        onChange={(e) => actualizarEstado(turno.id, e.target.value)}
                        disabled={reprogramandoId === turno.id}
                      >
                        <option value="">Seleccionar estado</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="rechazado">Rechazado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td>
                      {reprogramandoId === turno.id ? (
                        <>
                          <button className="actualizar-btn" onClick={() => confirmarReprogramacion(turno)}>
                            Confirmar
                          </button>
                          <button className="volver-btn" style={{marginLeft:4}} onClick={() => setReprogramandoId(null)}>
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button 
                          className="actualizar-btn"
                          onClick={() => handleReprogramarClick(turno)}
                        >
                          Reprogramar
                        </button>
                      )}
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
                              <div className="detalle-valor">{especialidades[turno.id_especialidad] || turno.id_especialidad}</div>
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
