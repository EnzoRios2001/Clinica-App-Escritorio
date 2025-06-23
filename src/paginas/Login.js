import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registerMode, setRegisterMode] = useState(false);
  const navigate = useNavigate();

  // Iniciar sesión
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        sessionStorage.setItem('usuario', data.user.email);
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Registro de usuario y luego en persona
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !nombre || !apellido) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      // 1. Crear usuario en Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Usa el ID del usuario recién creado
      const userId = data?.user?.id;
      if (!userId) {
        setError('No se pudo obtener el ID del usuario.');
        return;
      }

      // 2. Insertar en persona
      const { error: personaError } = await supabase
        .from('persona')
        .insert([{
          id: userId,
          nombre,
          apellido,
        }]);
      if (personaError) throw personaError;

      setError('Registro exitoso. Revisa tu correo para confirmar la cuenta.');
      setRegisterMode(false);
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>{registerMode ? 'Registrarse' : 'Iniciar Sesión'}</h2>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      {!registerMode ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRegisterMode(true);
              setError(null);
            }}
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Registrarse
          </button>
          {/* Recuperar contraseña */}
          <button
            type="button"
            onClick={async () => {
              if (!email) {
                setError('Por favor, ingresa tu email para recuperar la contraseña.');
                return;
              }
              setLoading(true);
              setError(null);
              const { error } = await supabase.auth.resetPasswordForEmail(email);
              if (error) {
                setError(error.message);
              } else {
                setError('Se ha enviado un correo para restablecer la contraseña.');
              }
              setLoading(false);
            }}
            disabled={loading}
            style={{ marginTop: '10px', display: 'block', width: '100%', background: 'transparent', color: '#4f8cff', border: 'none', textDecoration: 'underline', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ¿Desea recuperar su <span style={{ color: '#4f8cff' }}>contraseña</span>?
          </button>
        </form>
      ) : (
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="nombre">Nombre:</label>
            <input
              type="text"
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="apellido">Apellido:</label>
            <input
              type="text"
              id="apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
          <button
            type="button"
            onClick={() => {
              setRegisterMode(false);
              setError(null);
            }}
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Volver a iniciar sesión
          </button>
        </form>
      )}
    </div>
  );
}

export default Login;
