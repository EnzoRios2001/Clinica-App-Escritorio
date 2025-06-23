import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import "./GestionEspecialistas.css";

function Emergencias() {
  const [tipoEmergencia, setTipoEmergencia] = useState("");
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [especialistaId, setEspecialistaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [especialistas, setEspecialistas] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const cargarEspecialistas = async () => {
      try {
        // Obtener IDs de especialistas
        const { data: roles_persona, error: rolesError } = await supabase
          .from("rol_persona")
          .select("id")
          .eq("rol", "especialista");
        if (rolesError) throw rolesError;
        const especialistasIds = roles_persona.map((rol) => rol.id);
        if (especialistasIds.length === 0) {
          setEspecialistas([]);
          return;
        }
        // Obtener datos de las personas
        const { data: personas, error: personasError } = await supabase
          .from("persona")
          .select("id, nombre, apellido")
          .in("id", especialistasIds);
        if (personasError) throw personasError;
        setEspecialistas(personas);
      } catch (error) {
        setErrorMessage("Error al cargar especialistas: " + error.message);
      }
    };
    cargarEspecialistas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    if (!tipoEmergencia || !nombrePaciente || !especialistaId || !fecha || !hora) {
      setErrorMessage("Todos los campos son obligatorios.");
      return;
    }
    try {
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Debe iniciar sesión para registrar una emergencia.");
        return;
      }
      const { error } = await supabase.from("emergencias").insert([
        {
          tipo_emergencia: tipoEmergencia,
          nombre_paciente: nombrePaciente,
          id_especialista: especialistaId,
          fecha: fecha,
          hora: hora,
          creado_por: user.id
        },
      ]);
      if (error) throw error;
      setSuccessMessage("Emergencia registrada correctamente.");
      setTipoEmergencia("");
      setNombrePaciente("");
      setEspecialistaId("");
      setFecha("");
      setHora("");
    } catch (error) {
      setErrorMessage("Error al registrar emergencia: " + error.message);
    }
  };

  return (
    <div className="gestion-usuarios-container">
      <header>
        <div className="header-container">
          <h1>Registro de Emergencias</h1>
        </div>
      </header>
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <form className="form-registro" onSubmit={handleSubmit}>
        <label>Tipo de emergencia:</label>
        <input
          type="text"
          value={tipoEmergencia}
          onChange={(e) => setTipoEmergencia(e.target.value)}
          required
        />
        <label>Nombre del paciente:</label>
        <input
          type="text"
          value={nombrePaciente}
          onChange={(e) => setNombrePaciente(e.target.value)}
          required
        />
        <label>Especialista que lo atendió:</label>
        <select
          value={especialistaId}
          onChange={(e) => setEspecialistaId(e.target.value)}
          required
        >
          <option value="">Seleccione un especialista</option>
          {especialistas.map((esp) => (
            <option key={esp.id} value={esp.id}>
              {esp.nombre} {esp.apellido}
            </option>
          ))}
        </select>
        <label>Fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <label>Hora:</label>
        <input
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          required
        />
        <button type="submit">Registrar Emergencia</button>
      </form>
    </div>
  );
}

export default Emergencias;
