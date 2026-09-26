import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tienePermiso } from "../config/permisos";
import type { Modulo } from "../config/permisos";

interface PermissionRouteProps {
    modulo: Modulo;
}

function PermissionRoute({
    modulo
}: PermissionRouteProps) {

    const { usuario } = useAuth();

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    if (!tienePermiso(usuario.rol, modulo)) {
        return <Navigate to="/acceso-denegado"  replace />;
    }

    return <Outlet />;
}

export default PermissionRoute;