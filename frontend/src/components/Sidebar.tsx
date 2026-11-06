import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
    Armchair,
    BookOpen,
    ChartNoAxesColumnIncreasing,
    ClipboardList,
    Clock3,
    Coffee,
    Factory,
    Home,
    Menu,
    Package,
    ShoppingBag,
    UsersRound,
    X,
} from "lucide-react";
import { tienePermiso } from "../config/permisos";
import type { RolEmpleado } from "../config/permisos";
import { useAuth } from "../context/AuthContext";

function Sidebar() {
    const { usuario } = useAuth();
    const [menuAbierto, setMenuAbierto] = useState(false);

    if (!usuario) {
        return null;
    }

    const rolActual: RolEmpleado = usuario.rol;

    return (
        <aside className={`sidebar ${menuAbierto ? "mobile-open" : ""}`}>
            <h2><Coffee className="sidebar-brand-icon" aria-hidden="true" /> CAFETERÍA</h2>

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
                                <Home className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                    )}


                    {tienePermiso(rolActual, "mesas") && (
                        <li>
                            <NavLink to="/mesas">
                                <Armchair className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Mesas</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "comandas") && (
                        <li>
                            <NavLink to="/comandas">
                                <ClipboardList className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Comandas</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "preparacion") && (
                        <li>
                            <NavLink to="/preparacion">
                                <Clock3 className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Preparación</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "productos") && (
                        <li>
                            <NavLink to="/productos">
                                <ShoppingBag className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Productos</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "recetas") && (
                        <li>
                            <NavLink to="/recetas">
                                <BookOpen className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Recetas</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "stock") && (
                        <li>
                            <NavLink to="/stock">
                                <Package className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Stock</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "produccion") && (
                        <li>
                            <NavLink to="/produccion">
                                <Factory className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Producción</span>
                            </NavLink>
                        </li>
                    )}

                    {tienePermiso(rolActual, "empleados") && (
                        <li>
                            <NavLink to="/empleados">
                                <UsersRound className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Empleados</span>
                            </NavLink>
                        </li>
                    )}
                    {tienePermiso(rolActual, "informes") && (
                        <li>
                            <NavLink to="/informes">
                                <ChartNoAxesColumnIncreasing className="sidebar-nav-icon" aria-hidden="true" />
                                <span>Informes</span>
                            </NavLink>
                        </li>
                    )}

                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;
