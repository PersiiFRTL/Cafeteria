const { crearClientePublico } = require("../config/supabase");
const { enviarError } = require("./responses");

const ROLES_VALIDOS = new Set(["ADMINISTRADOR", "EMPLEADO", "COCINA"]);

function tokenDeAutorizacion(req) {
    return req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
}

async function cargarPerfilActivo(cliente, userId) {
    const { data, error } = await cliente.from("perfiles")
        .select("id,nombre,email,rol,activo").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data && data.activo && ROLES_VALIDOS.has(data.rol) ? {
        id: data.id, nombre: data.nombre, email: data.email ?? "", rol: data.rol
    } : null;
}

async function autenticar(req, res, next) {
    const token = tokenDeAutorizacion(req);
    if (!token) return enviarError(res, 401, "AUTH_REQUIRED", "Falta la sesión de usuario.");
    try {
        const client = crearClientePublico(token);
        const { data, error } = await client.auth.getUser(token);
        if (error || !data.user) return enviarError(res, 401, "INVALID_SESSION", "La sesión no es válida.");
        const perfil = await cargarPerfilActivo(client, data.user.id);
        if (!perfil) return enviarError(res, 403, "PROFILE_INACTIVE", "La cuenta está desactivada o no tiene un perfil válido.");
        req.supabaseUsuario = client;
        req.usuarioId = data.user.id;
        req.usuarioPerfil = perfil;
        return next();
    } catch {
        return enviarError(res, 503, "AUTH_TEMPORARILY_UNAVAILABLE", "No se pudo verificar la sesión temporalmente.");
    }
}

function requiereRol(...roles) {
    return (req, res, next) => roles.includes(req.usuarioPerfil?.rol)
        ? next()
        : enviarError(res, 403, "FORBIDDEN", "No tenés permisos para realizar esta operación.");
}

module.exports = { ROLES_VALIDOS, tokenDeAutorizacion, cargarPerfilActivo, autenticar, requiereRol };
