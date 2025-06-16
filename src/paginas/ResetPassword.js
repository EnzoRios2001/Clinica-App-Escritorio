import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

function ResetPassword({ setIsResettingPassword }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsResettingPassword(false);
        navigate("/login");
      }
    };
    checkSession();

    return () => {
      setIsResettingPassword(false);
    };
  }, [navigate, setIsResettingPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) {
        setError("Error al actualizar la contraseña");
        console.error(error);
      } else {
        setIsResettingPassword(false);
        await supabase.auth.signOut();
        alert("¡Contraseña actualizada con éxito!");
        navigate("/login");
      }
    } catch (error) {
      setError("Error al actualizar la contraseña");
      console.error(error);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Recuperar Contraseña</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Actualizar Contraseña</button>
      </form>
    </div>
  );
}

export default ResetPassword; 