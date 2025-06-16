import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";

import Login from "./paginas/Login";
import Inicio from "./paginas/Inicio";
import NotFound from "./paginas/NotFound";
import ResetPassword from "./paginas/ResetPassword";
import GestionUsuarios from "./paginas/GestionUsuarios";
import Perfil from "./paginas/Perfil";
import GestionEspecialistas from "./paginas/GestionEspecialistas";

import { supabase } from "./supabase/client";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsResettingPassword(true);
        navigate('/reset-password');
      } else if (!session && !isResettingPassword) {
        navigate('/login');
      } else if (session && !isResettingPassword && location.pathname === '/login') {
        navigate('/');
      }
    });
  }, [navigate, isResettingPassword, location]);

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword setIsResettingPassword={setIsResettingPassword} />} />
        <Route path="/gestion-usuarios" element={<GestionUsuarios />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/gestion-especialistas" element={<GestionEspecialistas />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
