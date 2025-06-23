import React, { useEffect, useState } from 'react';
import { supabase } from "../supabase/client";
import './dato.css';

function Datos() {
  const [stats, setStats] = useState({
    confirmados: 0,
    cancelados: 0,
    pendientes: 0,
    reprogramados: 0,
    rechazados: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topEspecialistas, setTopEspecialistas] = useState([]);
  const [topEspecialidades, setTopEspecialidades] = useState([]);
  const [especialistasNombres, setEspecialistasNombres] = useState({});
  const [especialidadesNombres, setEspecialidadesNombres] = useState({});
  const [pacientesNombres, setPacientesNombres] = useState({});
  const [topPacientes, setTopPacientes] = useState([]);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      // Traer todos los datos necesarios de una sola vez
      const { data, error } = await supabase
        .from('solicitudes_turno')
        .select('estado, id_especialista, id_especialidad, id_paciente');
      if (error) {
        setError('Error al obtener los datos');
        setLoading(false);
        return;
      }
      // Estadísticas de estados
      const counts = {
        confirmados: 0,
        cancelados: 0,
        pendientes: 0,
        reprogramados: 0,
        rechazados: 0,
        total: data.length
      };
      // Contadores para especialistas, especialidades y pacientes
      const especialistasCount = {};
      const especialidadesCount = {};
      const pacientesCount = {};
      data.forEach(turno => {
        // Estado
        switch (turno.estado) {
          case 'confirmado':
            counts.confirmados++;
            break;
          case 'cancelado':
            counts.cancelados++;
            break;
          case 'pendiente':
            counts.pendientes++;
            break;
          case 'reprogramado':
            counts.reprogramados++;
            break;
          case 'rechazado':
            counts.rechazados++;
            break;
          default:
            break;
        }
        // Especialista
        if (turno.id_especialista) {
          especialistasCount[turno.id_especialista] = (especialistasCount[turno.id_especialista] || 0) + 1;
        }
        // Especialidad
        if (turno.id_especialidad) {
          especialidadesCount[turno.id_especialidad] = (especialidadesCount[turno.id_especialidad] || 0) + 1;
        }
        // Paciente
        if (turno.id_paciente) {
          pacientesCount[turno.id_paciente] = (pacientesCount[turno.id_paciente] || 0) + 1;
        }
      });
      // Top 5 especialistas
      const topEsp = Object.entries(especialistasCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));
      // Top 5 especialidades
      const topEsps = Object.entries(especialidadesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([nombre, count]) => ({ nombre, count }));
      // Top 5 pacientes
      const topPacs = Object.entries(pacientesCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ id, count }));
      setStats(counts);
      setTopEspecialistas(topEsp);
      setTopEspecialidades(topEsps);
      setTopPacientes(topPacs);
      // Obtener nombres de especialistas
      if (topEsp.length > 0) {
        const ids = topEsp.map(e => e.id);
        const { data: personas, error: errorPersonas } = await supabase
          .from('persona')
          .select('id, nombre, apellido')
          .in('id', ids);
        if (!errorPersonas && personas) {
          const nombres = {};
          personas.forEach(p => {
            nombres[p.id] = `${p.nombre} ${p.apellido}`;
          });
          setEspecialistasNombres(nombres);
        }
      }
      // Obtener nombres de especialidades
      if (topEsps.length > 0) {
        const ids = topEsps.map(e => e.nombre);
        const { data: especialidades, error: errorEspecialidades } = await supabase
          .from('especialidades')
          .select('id, especialidad')
          .in('id', ids);
        if (!errorEspecialidades && especialidades) {
          const nombres = {};
          especialidades.forEach(e => {
            nombres[e.id] = e.especialidad;
          });
          setEspecialidadesNombres(nombres);
        }
      }
      // Obtener nombres de pacientes
      if (topPacs.length > 0) {
        const ids = topPacs.map(e => e.id);
        const { data: personas, error: errorPacientes } = await supabase
          .from('persona')
          .select('id, nombre, apellido')
          .in('id', ids);
        if (!errorPacientes && personas) {
          const nombres = {};
          personas.forEach(p => {
            nombres[p.id] = `${p.nombre} ${p.apellido}`;
          });
          setPacientesNombres(nombres);
        }
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return <div>Cargando datos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="datos-estudio">
      <h2>Datos de Turnos</h2>
      <ul>
        <li>Total: {stats.total}</li>
        <li>Confirmados: {stats.confirmados}</li>
        <li>Cancelados: {stats.cancelados}</li>
        <li>Pendientes: {stats.pendientes}</li>
        <li>Reprogramados: {stats.reprogramados}</li>
        <li>Rechazados: {stats.rechazados}</li>
      </ul>
      <div className="datos-cards">
        <div className="card">
          <h3>Especialistas más elegidos</h3>
          <ol>
            {topEspecialistas.length === 0 && <li>No hay datos</li>}
            {topEspecialistas.map(e => (
              <li key={e.id}>{especialistasNombres[e.id] ? especialistasNombres[e.id] : `ID: ${e.id}`} ({e.count} turnos)</li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h3>Especialidades más elegidas</h3>
          <ol>
            {topEspecialidades.length === 0 && <li>No hay datos</li>}
            {topEspecialidades.map(e => (
              <li key={e.nombre}>{especialidadesNombres[e.nombre] ? especialidadesNombres[e.nombre] : `ID: ${e.nombre}`} ({e.count} turnos)</li>
            ))}
          </ol>
        </div>
        <div className="card">
          <h3>Pacientes más concurrentes</h3>
          <ol>
            {topPacientes.length === 0 && <li>No hay datos</li>}
            {topPacientes.map(e => (
              <li key={e.id}>{pacientesNombres[e.id] ? pacientesNombres[e.id] : `ID: ${e.id}`} ({e.count} turnos)</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default Datos;
