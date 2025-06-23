import React from 'react';
import { Link } from 'react-router-dom';
import '../estilo.css';
import { supabase } from "../supabase/client";


function Inicio() {
  return (
    <>
      <div className="hero-shortcuts">
        <Link to="/perfil" className="shortcut-button">
          <span className="icon-placeholder"></span>
          <span>Mi Perfil</span>
        </Link>
        <Link to="/gestion-especialistas" className="shortcut-button">
          <span className="icon-placeholder"></span>
          <span>Gestion Especialistas</span>
        </Link>
        <Link to="/registrar-usuarios" className="shortcut-button">
          <span className="icon-placeholder"></span>
          <span>Registrar Usuarios</span>
        </Link>
        <Link to="/gestion-usuarios" className="shortcut-button">
          <span className="icon-placeholder"></span>
          <span>Gestion de Usuarios</span>
        </Link>
      </div>

      <div className="categories">
        <div className="categories-grid">
          <Link to="/gestion-turnos" style={{ textDecoration: 'none' }}>
            <button><span>Gestion de Turnos</span></button>
          </Link>
          <Link to="/recuperar-password" style={{ textDecoration: 'none' }}>
            <button><span>Cambiar Contraseña</span></button>
          </Link>
          <Link to="/emergencias" style={{ textDecoration: 'none' }}>
            <button><span>Emergencias</span></button>
          </Link>
          <Link to="/datos-estudio" style={{ textDecoration: 'none' }}>
            <button><span>Datos de Estudio</span></button>
          </Link>
        </div>
      </div>
    </>
  );
}

export default Inicio;

