function Sidebar() {
    return (
        <aside className="sidebar">
            <h2>☕ CAFETERÍA</h2>

            <nav>
                <ul>
                    <li>🏠 Dashboard</li>
                    <li>🪑 Mesas</li>
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