import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase/client';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

// Componentes
import Header from './components/Header';

// Páginas
import Inicio from './paginas/Inicio';
import Login from './paginas/Login';
import Perfil from './paginas/Perfil';
import GestionUsuarios from "./paginas/GestionUsuarios";
import GestionEspecialistas from "./paginas/GestionEspecialistas";
import GestionTurnos from "./paginas/GestionTurnos";
import RegistrarUsuarios from './paginas/RegistrarUsuarios';
import Datos from './paginas/Datos';

// Redirección para GitHub Pages SPA
if (window.location.search.startsWith('?redirect=')) {
  const redirectTo = decodeURIComponent(window.location.search.replace('?redirect=', ''));
  window.history.replaceState(null, '', redirectTo);
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar el estado de autenticación inicial
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsLoggedIn(!!user);
        if (user) {
          setUserName(user.email);
          sessionStorage.setItem('usuario', user.email);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Suscribirse a cambios en el estado de autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session?.user) {
        setUserName(session.user.email);
        sessionStorage.setItem('usuario', session.user.email);
      } else {
        setUserName('');
        sessionStorage.removeItem('usuario');
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      sessionStorage.removeItem('usuario');
      setIsLoggedIn(false);
      setUserName('');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Componente para rutas protegidas
  const PrivateRoute = ({ children }) => {
    if (loading) {
      return <div>Cargando...</div>;
    }
    return isLoggedIn ? children : <Navigate to="/login" />;
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="App">
      <Header isLoggedIn={isLoggedIn} userName={userName} handleLogout={handleLogout} />

      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <Perfil />
            </PrivateRoute>
          }
        />
        <Route
          path="/gestion-usuarios"
          element={
            <PrivateRoute>
              <GestionUsuarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/registrar-usuarios"
          element={
            <PrivateRoute>
              <RegistrarUsuarios />
            </PrivateRoute>
          }
        />
        <Route
          path="/gestion-turnos"
          element={
            <PrivateRoute>
              <GestionTurnos />
            </PrivateRoute>
          }
        />
        <Route
          path="/gestion-especialistas"
          element={
            <PrivateRoute>
              <GestionEspecialistas />
            </PrivateRoute>
          }
        />
        <Route
          path="/datos-estudio"
          element={
            <PrivateRoute>
              <Datos />
            </PrivateRoute>
          }
        />
        {/* Ruta para páginas no encontradas */}
        <Route path="*" element={<div>Página no encontrada</div>} />
      </Routes>

    </div>
  );
}

export default App;
