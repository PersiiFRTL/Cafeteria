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

                    <li>📋 Comandas</li>
                    <li>🛍 Productos</li>
                    <li>📦 Stock</li>
                    <li>💰 Facturación</li>
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