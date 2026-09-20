import { Link } from "react-router-dom";

function Sidebar() {
    return (
        <aside className="sidebar">
            <h2>☕ CAFETERÍA</h2>

            <nav>
                <ul>

                    <li>
                        <Link to="/">
                            🏠 Dashboard
                        </Link>
                    </li>

                    <li>
                        <Link to="/mesas">
                            🪑 Mesas
                        </Link>
                    </li>

                    <li>
                        <Link to="/comandas">
                            📋 Comandas
                        </Link>
                    </li>
                    <li>
                        <Link to="/preparacion">
                            🕒 Preparación
                        </Link>
                    </li>
                    <li>🛍 Productos</li>
                    <li>📦 Stock</li>
                    <li>📊 Informes</li>

                </ul>
            </nav>

            <div className="sidebar-bottom">
                <p>⚙ Configuración</p>
                <p>👤 Usuario</p>
            </div>
        </aside>
    );
}

export default Sidebar;