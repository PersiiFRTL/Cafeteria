function Topbar() {
    return (
        <header className="topbar">
            <div>
                <h2>Dashboard</h2>
            </div>

            <div className="topbar-user">
                <span>🔔</span>

                <div>
                    <strong>Administrador</strong>
                    <small>Administrador</small>
                </div>

                <span>▼</span>
            </div>
        </header>
    );
}

export default Topbar;