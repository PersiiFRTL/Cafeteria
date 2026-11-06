import { Link } from "react-router-dom";
import { Ban } from "lucide-react";

function AccesoDenegado() {
    return (
        <div className="acceso-denegado">
            <div className="acceso-denegado-card">
                <div className="acceso-denegado-icon">
                    <Ban className="ui-icon" aria-hidden="true" />
                </div>

                <h1>Acceso denegado</h1>

                <p>
                    No tenés permisos para acceder a este módulo.
                </p>

                <Link
                    to="/"
                    className="primary-button"
                >
                    Volver al Dashboard
                </Link>
            </div>
        </div>
    );
}

export default AccesoDenegado;