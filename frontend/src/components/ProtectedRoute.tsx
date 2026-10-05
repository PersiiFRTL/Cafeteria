import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
    const { estaAutenticado, estadoSesion } = useAuth();

    if (estadoSesion === "cargando") {
        return <main className="estado-carga" role="status" aria-live="polite">Verificando sesión…</main>;
    }

    if (!estaAutenticado) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;
