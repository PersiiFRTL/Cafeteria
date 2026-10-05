import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { tienePermiso } from "../config/permisos";
import type { RolEmpleado } from "../config/permisos";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const { usuario, cerrarSesion } = useAuth();
    const navigate = useNavigate();
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
                            <NavLink to="/">
                                🏠 Dashboard
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "mesas") && (
                        <li>
                            <NavLink to="/mesas">
                                🪑 Mesas
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "comandas") && (
                        <li>
                            <NavLink to="/comandas">
                                📋 Comandas
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "preparacion") && (
                        <li>
                            <NavLink to="/preparacion">
                                🕒 Preparación
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "productos") && (
                        <li>
                            <NavLink to="/productos">
                                🛍 Productos
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "recetas") && (
                        <li>
                            <NavLink to="/recetas">
                                📋 Recetas
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "stock") && (
                        <li>
                            <NavLink to="/stock">
                                📦 Stock
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "produccion") && (
                        <li>
                            <NavLink to="/produccion">
                                🏭 Producción
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "empleados") && (
                        <li>
                            <NavLink to="/empleados">
                                👥 Empleados
                            </NavLink>
                        </li>
                    )}
                    {tienePermiso(rolActual, "informes") && (
                        <li>
                            <NavLink to="/informes">📊 Informes</NavLink>
                        </li>
                    )}

                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;
