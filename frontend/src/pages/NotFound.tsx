import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="not-found-page">
            <div className="not-found-card">
                <p className="not-found-code">404</p>
                <h1>Página no encontrada</h1>
                <p>
                    La ruta que estás buscando no existe o ya no está disponible.
                </p>
                <Link to="/" className="primary-button not-found-link">
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}

export default NotFound;
