import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import "./GestionEspecialistas.css";

function GestionEspecialistas() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState(['especialista']);
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState([]);
  const [diasSemana, setDiasSemana] = useState([]);

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
    cargarEspecialistas();
    cargarEspecialidadesDisponibles();
    cargarDiasSemana();
  }, []);

  const cargarEspecialistas = async () => {
    try {
      // Obtener usuarios que son especialistas
      const { data: roles_persona, error: rolesError } = await supabase
        .from('rol_persona')
        .select('*')
        .eq('rol', 'especialista');

      if (rolesError) throw rolesError;

      // Obtener los IDs de los especialistas
      const especialistasIds = roles_persona.map(rol => rol.id);

      // Obtener los datos de las personas que son especialistas
      const { data: personas, error: personasError } = await supabase
        .from('persona')
        .select('*')
        .in('id', especialistasIds);

      if (personasError) throw personasError;

      // Obtener las especialidades y sus asignaciones
      const { data: especialidades_asignadas, error: especialidadesError } = await supabase
        .from('espe_espe')
        .select(`
          id_persona,
          especialidad:id_especialidad (
            id,
            especialidad
          )
        `)
        .in('id_persona', especialistasIds);

      if (especialidadesError) throw especialidadesError;

      // Obtener los horarios de los especialistas
      const { data: horarios, error: horariosError } = await supabase
        .from('horarios_especialistas')
        .select(`
          id_horario,
          hora_inicio,
          hora_fin,
          dia_semana,
          id_especialista,
          cupos
        `)
        .in('id_especialista', especialistasIds);

      if (horariosError) throw horariosError;

      // Obtener los días de la semana
      const { data: dias_semana, error: diasError } = await supabase
        .from('dias_semana')
        .select('*');

      if (diasError) throw diasError;

      // Combinar usuarios con sus roles, especialidades y horarios
      const especialistasConRoles = personas.map(persona => ({
        ...persona,
        rol_persona: roles_persona.filter(rol => rol.id === persona.id),
        especialidades: especialidades_asignadas.filter(ea => ea.id_persona === persona.id),
        horarios: horarios
          .filter(h => h.id_especialista === persona.id)
          .map(h => ({
            ...h,
            dia_nombre: dias_semana.find(d => d.id === parseInt(h.dia_semana))?.dia || h.dia_semana
          }))
      }));

      setUsuarios(especialistasConRoles);
    } catch (error) {
      setErrorMessage("Error al cargar especialistas: " + error.message);
    }
  };

  const cargarEspecialidadesDisponibles = async () => {
    try {
      const { data: especialidades, error } = await supabase
        .from('especialidades')
        .select('*');

      if (error) throw error;
      setEspecialidadesDisponibles(especialidades);
    } catch (error) {
      setErrorMessage("Error al cargar especialidades: " + error.message);
    }
  };

  const cargarDiasSemana = async () => {
    try {
      const { data: dias, error } = await supabase
        .from('dias_semana')
        .select('*')
        .order('id');

      if (error) throw error;
      setDiasSemana(dias);
    } catch (error) {
      setErrorMessage("Error al cargar días de la semana: " + error.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({
      ...user,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      dni: user.dni || '',
      roles: ['especialista'],
      especialidadesSeleccionadas: user.especialidades?.map(esp => esp.especialidad.id) || [],
      horarios: user.horarios || []
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      // Actualizar datos de la persona
      const { error: personaError } = await supabase
        .from('persona')
        .update({
          nombre: editingUser.nombre,
          apellido: editingUser.apellido,
          dni: editingUser.dni
        })
        .eq('id', editingUser.id);

      if (personaError) throw personaError;

      // Manejar especialidades
      const especialidadesActuales = editingUser.especialidades?.map(esp => esp.especialidad.id) || [];
      const especialidadesNuevas = editingUser.especialidadesSeleccionadas || [];
      
      const especialidadesParaAgregar = especialidadesNuevas.filter(esp => !especialidadesActuales.includes(esp));
      const especialidadesParaEliminar = especialidadesActuales.filter(esp => !especialidadesNuevas.includes(esp));

      if (especialidadesParaEliminar.length > 0) {
        const { error: deleteEspecError } = await supabase
          .from('espe_espe')
          .delete()
          .eq('id_persona', editingUser.id)
          .in('id_especialidad', especialidadesParaEliminar);

        if (deleteEspecError) throw deleteEspecError;
      }

      if (especialidadesParaAgregar.length > 0) {
        const especToInsert = especialidadesParaAgregar.map(id_especialidad => ({
          id_persona: editingUser.id,
          id_especialidad: id_especialidad
        }));

        const { error: insertEspecError } = await supabase
          .from('espe_espe')
          .insert(especToInsert);

        if (insertEspecError) throw insertEspecError;
      }

      // Manejar horarios
      // Primero, eliminar todos los horarios existentes
      const { error: deleteHorariosError } = await supabase
        .from('horarios_especialistas')
        .delete()
        .eq('id_especialista', editingUser.id);

      if (deleteHorariosError) throw deleteHorariosError;      // Luego, insertar todos los horarios actuales
      if (editingUser.horarios.length > 0) {
        const horariosToInsert = editingUser.horarios.map(({ id_horario, dia_nombre, ...horario }) => ({
          ...horario,
          id_especialista: editingUser.id,
          dia_semana: parseInt(horario.dia_semana), // Asegurarnos de que sea número
          cupos: parseInt(horario.cupos) || 1 // Cupos como número, valor por defecto 1
        }));

        const { error: insertHorariosError } = await supabase
          .from('horarios_especialistas')
          .insert(horariosToInsert);

        if (insertHorariosError) throw insertHorariosError;
      }

      await cargarEspecialistas(); // Recargar especialistas para ver los cambios
      handleCloseEditModal();
      setErrorMessage("");
    } catch (error) {
      setErrorMessage("Error al guardar los cambios: " + error.message);
    }
  };

  const handleRoleChange = (rol, isChecked) => {
    setEditingUser(prev => {
      const currentRoles = prev.roles || [];
      if (isChecked) {
        return { ...prev, roles: [...currentRoles, rol] };
      } else {
        return { ...prev, roles: currentRoles.filter(r => r !== rol) };
      }
    });
  };

  const handleEspecialidadChange = (idEspecialidad, isChecked) => {
    setEditingUser(prev => {
      const especialidadesActuales = prev.especialidadesSeleccionadas || [];
      if (isChecked) {
        return { ...prev, especialidadesSeleccionadas: [...especialidadesActuales, idEspecialidad] };
      } else {
        return { ...prev, especialidadesSeleccionadas: especialidadesActuales.filter(id => id !== idEspecialidad) };
      }
    });
  };

  const handleAddHorario = () => {
    setEditingUser(prev => ({
      ...prev,
      horarios: [
        ...prev.horarios,
        {
          id_horario: 'temp_' + Date.now(), // ID temporal para nuevo horario
          dia_semana: 1, // Ahora es un número
          hora_inicio: '08:00',
          hora_fin: '16:00',
          id_especialista: prev.id
        }
      ]
    }));
  };

  const handleHorarioChange = (horarioId, field, value) => {
    setEditingUser(prev => ({
      ...prev,
      horarios: prev.horarios.map(h => 
        h.id_horario === horarioId 
          ? { 
              ...h, 
              [field]: field === 'dia_semana' ? parseInt(value) : value // Convertir a número si es dia_semana
            } 
          : h
      )
    }));
  };

  const handleDeleteHorario = (horarioId) => {
    setEditingUser(prev => ({
      ...prev,
      horarios: prev.horarios.filter(h => h.id_horario !== horarioId)
    }));
  };

  const eliminarUsuario = async (id) => {
    if (window.confirm('¿Está seguro de que desea quitar el rol especialista a este usuario?')) {
      try {
        // Eliminar solo el rol especialista del usuario en rol_persona
        const { error: rolError } = await supabase
          .from('rol_persona')
          .delete()
          .eq('id', id)
          .eq('rol', 'especialista');

        if (rolError) throw rolError;

        await cargarEspecialistas(); // Refrescar la lista
      } catch (error) {
        setErrorMessage("Error al quitar el rol especialista: " + error.message);
      }
    }
  };

  return (
    <div className="gestion-usuarios-container">      <header>
        <div className="header-container">
          <h1>Gestión de Especialistas</h1>
          <button className="volver-btn" onClick={() => navigate('/')}>
            Volver
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <div className="tabla-usuarios">
        <table>
          <thead>            <tr>              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Rol</th>
              <th>Especialidades</th>
              <th>Horarios</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id}>
                <td>{usuario.id}</td>
                <td>{usuario.nombre}</td>
                <td>{usuario.apellido}</td>
                <td>{usuario.dni}</td>
                <td>
                  {usuario.rol_persona?.map(rol => (
                    <span key={rol.rol} className={`rol-badge rol-${rol.rol}`}>
                      {rol.rol}
                    </span>
                  ))}
                </td>                <td>                  {usuario.especialidades?.map(esp => (
                    <span key={esp.especialidad.id} className="especialidad-badge">
                      {esp.especialidad.especialidad}
                    </span>
                  ))}
                </td>
                <td>
                  {usuario.horarios?.map(horario => (
                    <div key={horario.id_horario} className="horario-item">                      <span className="dia-semana">{horario.dia_nombre}</span>
                      <span className="horario-tiempo">
                        {horario.hora_inicio?.substring(0, 5)} - {horario.hora_fin?.substring(0, 5)}
                      </span>
                      <span className="horario-cupos">Cupos: {horario.cupos}</span>
                    </div>
                  ))}
                </td>
                <td>
                  <button
                    className="btn-editar"
                    onClick={() => handleEdit(usuario)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-eliminar"
                    onClick={() => eliminarUsuario(usuario.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edición de Usuario */}
      {showEditModal && editingUser && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleCloseEditModal}>&times;</span>
            <h2>Editar Usuario</h2>
            <form onSubmit={handleSaveEdit} className="form-registro">
              <label>ID:</label>
              <input type="text" value={editingUser.id} disabled />

              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={editingUser.nombre || ''}
                onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                required
              />

              <label>Apellido:</label>
              <input
                type="text"
                name="apellido"
                value={editingUser.apellido || ''}
                onChange={(e) => setEditingUser({ ...editingUser, apellido: e.target.value })}
                required
              />

              <label>DNI:</label>
              <input
                type="text"
                name="dni"
                value={editingUser.dni || ''}
                onChange={(e) => setEditingUser({ ...editingUser, dni: e.target.value })}
                required
              />              <label>Especialidades:</label>
              <div className="especialidades-checkbox-group">
                {especialidadesDisponibles.map(esp => (
                  <label key={esp.id} className="especialidad-checkbox">
                    <input
                      type="checkbox"
                      value={esp.id}
                      checked={editingUser.especialidadesSeleccionadas?.includes(esp.id)}
                      onChange={(e) => handleEspecialidadChange(esp.id, e.target.checked)}
                    />
                    {esp.especialidad}
                  </label>
                ))}
              </div>
              
              <label>Horarios:</label>
              <div className="horarios-container">
                {editingUser.horarios?.map(horario => (
                  <div key={horario.id_horario} className="horario-item">
                    <select
                      value={horario.dia_semana}
                      onChange={(e) => handleHorarioChange(horario.id_horario, 'dia_semana', e.target.value)}
                    >
                      {diasSemana.map(dia => (
                        <option key={dia.id} value={dia.id}>
                          {dia.dia}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={horario.hora_inicio}
                      onChange={(e) => handleHorarioChange(horario.id_horario, 'hora_inicio', e.target.value)}
                    />
                    <input
                      type="time"
                      value={horario.hora_fin}
                      onChange={(e) => handleHorarioChange(horario.id_horario, 'hora_fin', e.target.value)}
                    />
                    <input
                      type="number"
                      min="1"
                      value={horario.cupos || ''}
                      placeholder="Cupos"
                      onChange={(e) => handleHorarioChange(horario.id_horario, 'cupos', e.target.value)}
                    />
                    <button type="button" onClick={() => handleDeleteHorario(horario.id_horario)}>
                      Eliminar
                    </button>
                  </div>
                ))}
                <button type="button" onClick={handleAddHorario}>
                  Agregar Horario
                </button>
              </div>

              <button type="submit">Guardar Cambios</button>
            </form>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEspecialistas;
