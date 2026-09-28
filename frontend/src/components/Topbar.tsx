import { useAuth } from "../context/AuthContext";

function Topbar() {
    const { usuario } = useAuth();

    return (
        <header className="topbar">
            <div>
                <h2>Dashboard</h2>
            </div>

            <div className="topbar-user">
                <span>🔔</span>

                <div>
                    <strong>{usuario?.nombre ?? "Usuario"}</strong>
                </div>
            </div>
        </header>
    );
}

export default Topbar;