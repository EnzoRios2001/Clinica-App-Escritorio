import { useEffect, useState } from "react";
import { supabase } from "../supabase/client";
import { useNavigate } from "react-router-dom";
import '../estilo.css';

function RegistrarUsuarios() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [showRoleSelection, setShowRoleSelection] = useState(false);
    const [newUserId, setNewUserId] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');
        const nombre = formData.get('nombre');
        const apellido = formData.get('apellido');
        const dni = formData.get('dni');

        try {
            // Obtener el usuario actual que está realizando el registro
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            if (!currentUser) throw new Error('No hay usuario autenticado');

            // Guardar las credenciales del usuario administrador actual
            const adminSession = await supabase.auth.getSession();

            // Registrar usuario en auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                    data: {
                        role: 'user'
                    }
                }
            });

            if (error) throw error;

            // Esperar 2 segundos antes de insertar en la tabla persona
            await new Promise(resolve => setTimeout(resolve, 300));

            // Crear registro en la tabla persona
            const { error: personaError } = await supabase
                .from('persona')
                .insert([{
                    id: data.user.id,
                    nombre: nombre,
                    apellido: apellido,
                    dni: dni,
                    creado_por: currentUser.id
                }]);

            if (personaError) throw personaError;

            // Confirmar email usando la función de la base de datos
            const { error: confirmError } = await supabase
                .rpc('confirm_user', { user_id: data.user.id });

            if (confirmError) throw confirmError;

            // Restaurar la sesión del administrador
            await supabase.auth.setSession({
                access_token: adminSession.data.session.access_token,
                refresh_token: adminSession.data.session.refresh_token
            });

            // Guardar el ID del nuevo usuario y mostrar el modal de selección de rol
            setNewUserId(data.user.id);
            setShowRoleSelection(true);
            setErrorMessage("");
            e.target.reset();
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    const handleRoleAssignment = async (rol) => {
        try {
            const { error } = await supabase
                .from('rol_persona')
                .insert([{
                    id: newUserId,
                    rol: rol
                }]);

            if (error) throw error;

            setShowRoleSelection(false);
            setNewUserId(null);
            alert('Usuario registrado y rol asignado exitosamente.');
        } catch (error) {
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="registro-usuarios-centrado">
            <div className="registro-usuarios-box">
                <h2>Registrar Nuevo Usuario</h2>
                <form id="form-registro" onSubmit={handleRegister}>
                    <table className="tabla-registro">
                        <tbody>
                            <tr>
                                <td>Nombre</td>
                                <td>
                                    <input type="text" name="nombre" placeholder="Nombre" required />
                                </td>
                            </tr>
                            <tr>
                                <td>Apellido</td>
                                <td>
                                    <input type="text" name="apellido" placeholder="Apellido" required />
                                </td>
                            </tr>
                            <tr>
                                <td>DNI</td>
                                <td>
                                    <input type="text" name="dni" placeholder="DNI" required />
                                </td>
                            </tr>
                            <tr>
                                <td>Correo electrónico</td>
                                <td>
                                    <input type="email" name="email" placeholder="Correo electrónico" required />
                                </td>
                            </tr>
                            <tr>
                                <td>Contraseña</td>
                                <td>
                                    <input type="password" name="password" placeholder="Contraseña" required />
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={2} style={{ textAlign: 'center' }}>
                                    <button type="submit">Registrar Usuario</button>
                                </td>
                            </tr>
                            {errorMessage && (
                                <tr>
                                    <td colSpan={2} className="error-message">{errorMessage}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </form>

                {showRoleSelection && (
                    <div className="tabla-rol-container" style={{marginTop: 32}}>
                        <h2>Asignar Rol al Usuario</h2>
                        <table className="tabla-rol">
                            <tbody>
                                <tr>
                                    <td colSpan={3} style={{ textAlign: 'center' }}>Seleccione el rol para el nuevo usuario:</td>
                                </tr>
                                <tr>
                                    <td><button onClick={() => handleRoleAssignment('administracion')}>Administración</button></td>
                                    <td><button onClick={() => handleRoleAssignment('especialista')}>Especialista</button></td>
                                </tr>
                                {errorMessage && (
                                    <tr>
                                        <td colSpan={3} className="error-message">{errorMessage}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
export default RegistrarUsuarios;