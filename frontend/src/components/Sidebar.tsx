import { Link } from "react-router-dom";
import { tienePermiso } from "../config/permisos";
import type { RolEmpleado } from "../config/permisos";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const { usuario, cerrarSesion} = useAuth();

    if (!usuario) {
        return null;
    }

    const rolActual: RolEmpleado = usuario.rol;

    return (
        <aside className="sidebar">
            <h2>☕ CAFETERÍA</h2>

            <nav>
                <ul>

                    {tienePermiso(rolActual, "dashboard") && (
                        <li>
                            <Link to="/">
                                🏠 Dashboard
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "mesas") && (
                        <li>
                            <Link to="/mesas">
                                🪑 Mesas
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "comandas") && (
                        <li>
                            <Link to="/comandas">
                                📋 Comandas
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "preparacion") && (
                        <li>
                            <Link to="/preparacion">
                                🕒 Preparación
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "productos") && (
                        <li>
                            <Link to="/productos">
                                🛍 Productos
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "recetas") && (
                        <li>
                            <Link to="/recetas">
                                📋 Recetas
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "stock") && (
                        <li>
                            <Link to="/stock">
                                📦 Stock
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "produccion") && (
                        <li>
                            <Link to="/produccion">
                                🏭 Producción
                            </Link>
                        </li>
                    )}

                    {tienePermiso(rolActual, "empleados") && (
                        <li>
                            <Link to="/empleados">
                                👥 Empleados
                            </Link>
                        </li>
                    )}

                </ul>
            </nav>

            <div className="sidebar-bottom">
                <p>👤 {usuario.nombre}</p>

                <p>{usuario.rol}</p>

                <button
                    className="logout-button"
                    onClick={cerrarSesion}
                >
                    🚪 Cerrar sesión
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;