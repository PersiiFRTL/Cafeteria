import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Topbar() {
    const { usuario, cerrarSesion } = useAuth();
    const navigate = useNavigate();

    const manejarCierreSesion = () => {
        cerrarSesion();
        navigate("/login", { replace: true });
    };

    return (
        <header className="topbar">
            <div>
                <h2>Dashboard</h2>
            </div>

            <div className="topbar-user">
                <span className="topbar-notification" aria-hidden="true">🔔</span>

                <button
                    type="button"
                    className="topbar-user-button"
                    onClick={manejarCierreSesion}
                    aria-label={`Cerrar sesión de ${usuario?.nombre ?? "Usuario"}`}
                    title="Cerrar sesión"
                >
                    <strong>{usuario?.nombre ?? "Usuario"}</strong>
                    <small>Cerrar sesión</small>
                </button>
            </div>
        </header>
    );
}

export default Topbar;