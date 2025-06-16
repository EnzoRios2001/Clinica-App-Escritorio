import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import "./Inicio.css";

function Inicio() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);
  const [newUserId, setNewUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const nombre = formData.get('nombre');
    const apellido = formData.get('apellido');
    const dni = formData.get('dni');
    
    try {
      // Obtener el usuario actual que está realizando el registro
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No hay usuario autenticado');

      // Guardar las credenciales del usuario administrador actual
      const adminSession = await supabase.auth.getSession();
      
      // Registrar usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            role: 'user'
          }
        }
      });

      if (error) throw error;

      // Crear registro en la tabla persona
      const { error: personaError } = await supabase
        .from('persona')
        .insert([{
          id: data.user.id,
          nombre: nombre,
          apellido: apellido,
          dni: dni,
          creado_por: currentUser.id
        }]);

      if (personaError) throw personaError;

      // Confirmar email usando la función de la base de datos
      const { error: confirmError } = await supabase
        .rpc('confirm_user', { user_id: data.user.id });

      if (confirmError) throw confirmError;
      
      // Restaurar la sesión del administrador
      await supabase.auth.setSession({
        access_token: adminSession.data.session.access_token,
        refresh_token: adminSession.data.session.refresh_token
      });
      
      // Guardar el ID del nuevo usuario y mostrar el modal de selección de rol
      setNewUserId(data.user.id);
      setShowRegisterModal(false);
      setShowRoleSelectionModal(true);
      setErrorMessage("");
      e.target.reset();
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleRoleAssignment = async (rol) => {
    try {
      const { error } = await supabase
        .from('rol_persona')
        .insert([{
          id: newUserId,
          rol: rol
        }]);

      if (error) throw error;

      setShowRoleSelectionModal(false);
      setNewUserId(null);
      alert('Usuario registrado y rol asignado exitosamente.');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="inicio-container">
      <header>
        <div className="header-container">
          <h1>Clinica MedioPelo</h1>
          <div className="header-buttons">
            {user && (
              <div className="user-section">
                <button onClick={() => setShowRoleModal(true)} className="nav-btn">
                  Cambiar Vista
                </button>
                <span>{user.email}</span>
                <button onClick={handleLogout}>Cerrar sesión</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="hero-shortcuts">
        <button onClick={() => navigate('/perfil')}>
          <span className="icon-placeholder"></span>
          <span>Mi Perfil</span>
        </button>
        <button onClick={() => navigate('/turnos')}>
          <span className="icon-placeholder"></span>
          <span>Ver Turnos</span>
        </button>
        <button onClick={() => setShowRegisterModal(true)}>
          <span className="icon-placeholder"></span>
          <span>Registrar Usuario</span>
        </button>
        <button onClick={() => navigate('/gestion-usuarios')}>
          <span className="icon-placeholder"></span>
          <span>Gestionar Usuarios</span>
        </button>
      </div>

      <div className="categories">
        <div className="categories-grid">
          <button onClick={() => navigate('/gestion-especialistas')}><span>Gestión de Especialistas</span></button>
          <button><span>Pacientes</span></button>
          <button><span>Horarios</span></button>
          <button><span>Reportes</span></button>
          <button><span>Configuración</span></button>
          <button><span>Notificaciones</span></button>
          <button><span>Mensajes</span></button>
          <button><span>Ayuda</span></button>
        </div>
      </div>

      {/* Modal de selección de rol */}
      {showRoleModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Seleccionar Vista</h2>
            <p>¿Cómo deseas ingresar al sistema?</p>
            <button onClick={() => navigate('/doctor')}>Vista de Doctor</button>
            <button onClick={() => setShowRoleModal(false)}>Vista de Secretaria</button>
            <button onClick={() => navigate('/paciente')}>Vista de Paciente</button>
          </div>
        </div>
      )}

      {/* Modal de Registro */}
      {showRegisterModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setShowRegisterModal(false)}>&times;</span>
            <h2>Registrar Nuevo Usuario</h2>
            <form onSubmit={handleRegister} className="form-registro">
              <input type="text" name="nombre" placeholder="Nombre" required />
              <input type="text" name="apellido" placeholder="Apellido" required />
              <input type="text" name="dni" placeholder="DNI" required />
              <input type="email" name="email" placeholder="Correo electrónico" required />
              <input type="password" name="password" placeholder="Contraseña" required />
              <button type="submit">Registrar Usuario</button>
            </form>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        </div>
      )}

      {/* Modal de Selección de Rol */}
      {showRoleSelectionModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Asignar Rol al Usuario</h2>
            <p>Seleccione el rol para el nuevo usuario:</p>
            <div className="role-buttons">
              <button onClick={() => handleRoleAssignment('administracion')}>Administración</button>
              <button onClick={() => handleRoleAssignment('especialista')}>Especialista</button>
              <button onClick={() => handleRoleAssignment('paciente')}>Paciente</button>
            </div>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default Inicio;