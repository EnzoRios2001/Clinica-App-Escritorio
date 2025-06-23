import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';

function RecuperarPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Confirmar el usuario con el token de la URL
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const token = params.get('token');
    const type = params.get('type');
    if (token && type === 'confirmation') {
      supabase.auth
        .verifyOtp({ type: 'email', token })
        .then(({ data, error }) => {
          if (error) setError('No se pudo confirmar el usuario.');
        });
    }
  }, []);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Por favor, ingresa la nueva contraseña.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Restablecer Contraseña</h2>
      {error && <div className="error-message">{error}</div>}
      {success ? (
        <div className="error-message" style={{ color: 'green' }}>
          Contraseña actualizada correctamente. Redirigiendo...
        </div>
      ) : (
        <form onSubmit={handlePasswordReset}>
          <div className="form-group">
            <label htmlFor="newPassword">Nueva Contraseña:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        </form>
      )}
    </div>
  );
}

export default RecuperarPassword;