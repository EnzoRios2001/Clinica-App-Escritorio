import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        console.error(error);
        alert("Error al enviar el correo de recuperación");
      } else {
        alert("Se ha enviado un correo para recuperar tu contraseña");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
      }
    });
  }, [navigate]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
        <button type="button" onClick={handleResetPassword}>Recuperar Contraseña</button>
      </form>
    </div>
  );
}

export default Login;
