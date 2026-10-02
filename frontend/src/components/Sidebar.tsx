import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { tienePermiso } from "../config/permisos";
import type { RolEmpleado } from "../config/permisos";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const { usuario, cerrarSesion } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    if (!usuario) {
        return null;
    }

    const rolActual: RolEmpleado = usuario.rol;

    return (
        <aside className={`sidebar ${menuAbierto ? "mobile-open" : ""}`}>
            <h2>☕ CAFETERÍA</h2>

            <button
                type="button"
                className="sidebar-menu-toggle"
                aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
                aria-controls="sidebar-navigation"
                aria-expanded={menuAbierto}
                onClick={() => setMenuAbierto(!menuAbierto)}
            >
                {menuAbierto ? <X size={20} /> : <Menu size={20} />}
                <span>Menú</span>
            </button>

            <nav id="sidebar-navigation" onClick={() => setMenuAbierto(false)}>
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
                    {tienePermiso(rolActual, "informes") && (
                        <li>
                            <Link to="/informes">📊 Informes</Link>
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