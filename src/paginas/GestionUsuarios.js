import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import "./GestionUsuarios.css";

function GestionUsuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [filtroActual, setFiltroActual] = useState('todos');
  const [errorMessage, setErrorMessage] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Estado para la búsqueda

  useEffect(() => {
    cargarUsuarios();
    cargarRolesDisponibles();
  }, []);

  const cargarUsuarios = async () => {
    try {
      // Obtener usuarios
      const { data: personas, error: personasError } = await supabase
        .from('persona')
        .select('*');

      if (personasError) throw personasError;

      // Obtener roles
      const { data: roles_persona, error: rolesError } = await supabase
        .from('rol_persona')
        .select('*');

      if (rolesError) throw rolesError;

      // Combinar usuarios con sus roles
      const usuariosConRoles = personas.map(persona => ({
        ...persona,
        rol_persona: roles_persona.filter(rol => rol.id === persona.id)
      }));

      setUsuarios(usuariosConRoles);
    } catch (error) {
      setErrorMessage("Error al cargar usuarios: " + error.message);
    }
  };

  const cargarRolesDisponibles = async () => {
    try {
      // Estos roles se obtendrían idealmente de la base de datos de forma dinámica,
      // pero por simplicidad se hardcodean basados en el tipo rol_enum conocido.
      const rolesFijos = ['paciente', 'especialista', 'administracion'];
      setAvailableRoles(rolesFijos);
    } catch (error) {
      console.error("Error al cargar roles disponibles:", error.message);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({
      ...user,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      dni: user.dni || '',
      roles: user.rol_persona ? user.rol_persona.map(r => r.rol) : []
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

      // Obtener roles actuales del usuario
      const rolesActuales = editingUser.rol_persona.map(r => r.rol);
      const rolesNuevos = editingUser.roles;

      // Determinar roles a agregar y eliminar
      const rolesParaAgregar = rolesNuevos.filter(rol => !rolesActuales.includes(rol));
      const rolesParaEliminar = rolesActuales.filter(rol => !rolesNuevos.includes(rol));

      // Eliminar solo los roles que ya no se necesitan
      if (rolesParaEliminar.length > 0) {
        const { error: deleteRolesError } = await supabase
          .from('rol_persona')
          .delete()
          .eq('id', editingUser.id)
          .in('rol', rolesParaEliminar);

        if (deleteRolesError) throw deleteRolesError;
      }

      // Agregar solo los roles nuevos
      if (rolesParaAgregar.length > 0) {
        const rolesToInsert = rolesParaAgregar.map(rol => ({
          id: editingUser.id,
          rol: rol
        }));

        const { error: insertRolesError } = await supabase
          .from('rol_persona')
          .insert(rolesToInsert);

        if (insertRolesError) throw insertRolesError;
      }

      await cargarUsuarios(); // Recargar usuarios para ver los cambios
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

  const filtrarUsuarios = (filtro) => {
    setFiltroActual(filtro);
  };

  const editarUsuario = async (id) => {
    // Implementar lógica de edición
    console.log('Editar usuario:', id);
  };

  const eliminarUsuario = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        // Primero eliminar los roles del usuario
        const { error: rolError } = await supabase
          .from('rol_persona')
          .delete()
          .eq('id', id);

        if (rolError) throw rolError;

        // Luego eliminar el usuario
        const { error: userError } = await supabase
          .from('persona')
          .delete()
          .eq('id', id);

        if (userError) throw userError;

        await cargarUsuarios();
      } catch (error) {
        setErrorMessage("Error al eliminar usuario: " + error.message);
      }
    }
  };

  // Filtrado por rol y búsqueda
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (filtroActual !== 'todos' && !usuario.rol_persona?.some(rol => rol.rol === filtroActual)) {
      return false;
    }
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (usuario.nombre && usuario.nombre.toLowerCase().includes(term)) ||
      (usuario.apellido && usuario.apellido.toLowerCase().includes(term)) ||
      (usuario.dni && usuario.dni.toString().includes(term))
    );
  });

  return (
    <div className="gestion-usuarios-container">
      <header>
        <div className="header-container">
          <h1>Gestión de Usuarios</h1>
          <button className="volver-btn" onClick={() => navigate('/')}>
            Volver
          </button>
        </div>
      </header>

      <div className="filtros-busqueda-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="filtros-container" style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`filtro-btn btn-todos ${filtroActual === 'todos' ? 'active' : ''}`}
            onClick={() => filtrarUsuarios('todos')}
          >
            Todos
          </button>
          <button
            className={`filtro-btn btn-especialistas ${filtroActual === 'especialista' ? 'active' : ''}`}
            onClick={() => filtrarUsuarios('especialista')}
          >
            Especialistas
          </button>
          <button
            className={`filtro-btn btn-administracion ${filtroActual === 'administracion' ? 'active' : ''}`}
            onClick={() => filtrarUsuarios('administracion')}
          >
            Administración
          </button>
          <button
            className={`filtro-btn btn-pacientes ${filtroActual === 'paciente' ? 'active' : ''}`}
            onClick={() => filtrarUsuarios('paciente')}
          >
            Pacientes
          </button>
        </div>
        <div className="busqueda-usuarios-container" style={{ display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="busqueda-usuarios-input"
            placeholder="Buscar por nombre, apellido o DNI"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="error-message">{errorMessage}</div>
      )}

      <div className="tabla-usuarios">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map(usuario => (
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
              />

              <label>Roles:</label>
              <div className="roles-checkbox-group">
                {availableRoles.map(rol => (
                  <label key={rol}>
                    <input
                      type="checkbox"
                      value={rol}
                      checked={editingUser.roles.includes(rol)}
                      onChange={(e) => handleRoleChange(rol, e.target.checked)}
                    />
                    {rol}
                  </label>
                ))}
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

export default GestionUsuarios;