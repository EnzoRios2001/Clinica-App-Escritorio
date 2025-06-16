import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import "./Perfil.css";

function Perfil() {
  const navigate = useNavigate();
  const [datosPersona, setDatosPersona] = useState(null);
  const [datosEspecialista, setDatosEspecialista] = useState(null);
  const [datosAdmin, setDatosAdmin] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatosPerfil();
  }, []);

  const cargarDatosPerfil = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Cargar datos básicos de la persona
      const { data: persona, error: personaError } = await supabase
        .from('persona')
        .select('*')
        .eq('id', user.id)
        .single();

      if (personaError) throw personaError;
      setDatosPersona(persona);

      // Cargar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('rol_persona')
        .select('rol')
        .eq('id', user.id);

      if (rolesError) throw rolesError;
      const rolesArray = rolesData.map(r => r.rol);
      setRoles(rolesArray);

      // Si tiene rol de especialista, cargar datos de especialista
      if (rolesArray.includes('especialista')) {
        const { data: especialista, error: espError } = await supabase
          .from('especialistas')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!espError) {
          setDatosEspecialista(especialista);
        }
      }

      // Si tiene rol de administración, cargar datos de administración
      if (rolesArray.includes('administracion')) {
        const { data: admin, error: adminError } = await supabase
          .from('administracion')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!adminError) {
          setDatosAdmin(admin);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="perfil-container">
      <button className="volver-btn" onClick={() => navigate('/')}>
        Volver
      </button>

      <div className="perfil-header">
        <h2>Mi Perfil</h2>
      </div>

      {datosPersona && (
        <div className="perfil-seccion">
          <h3>Información Personal</h3>
          <div className="campo-perfil">
            <label>Nombre</label>
            <span>{datosPersona.nombre}</span>
          </div>
          <div className="campo-perfil">
            <label>Apellido</label>
            <span>{datosPersona.apellido}</span>
          </div>
          <div className="campo-perfil">
            <label>DNI</label>
            <span>{datosPersona.dni}</span>
          </div>
          <div className="campo-perfil">
            <label>Roles</label>
            <span>{roles.join(', ')}</span>
          </div>
        </div>
      )}

      {datosEspecialista && (
        <div className="perfil-seccion">
          <h3>Información del Especialista</h3>
          {/* Ajusta estos campos según tu estructura de datos */}
          <div className="campo-perfil">
            <label>Matrícula</label>
            <span>{datosEspecialista.matricula}</span>
          </div>
          <div className="campo-perfil">
            <label>Universidad</label>
            <span>{datosEspecialista.universidad}</span>
          </div>
          <div className="campo-perfil">
            <label>Titulo</label>
            <span>{datosEspecialista.titulo}</span>
          </div>
          <div className="campo-perfil">
            <label>Activo</label>
            <span className={`estado-badge ${datosEspecialista.activo ? 'TRUE' : 'FALSE'}`}>
              {datosEspecialista.activo ? 'Habilitado' : 'Inactivo'}
            </span>
          </div>
        </div>
      )}

      {datosAdmin && (
        <div className="perfil-seccion">
          <h3>Información Administrativa</h3>
          {/* Ajusta estos campos según tu estructura de datos */}
          <div className="campo-perfil">
            <label>Activo</label>
            <span className={`estado-badge ${datosAdmin.activo ? 'TRUE' : 'FALSE'}`}>
              {datosAdmin.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="campo-perfil">
            <label>Horario de Trabajo</label>
            <span>
              {datosAdmin.inicio_turno} - {datosAdmin.fin_turno}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Perfil;