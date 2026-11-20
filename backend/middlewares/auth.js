const { crearClientePublico } = require("../config/supabase");
const { enviarError } = require("./responses");
const { createHash } = require("node:crypto");

const ROLES_VALIDOS = new Set(["ADMINISTRADOR", "EMPLEADO", "COCINA"]);
// Coalesce only simultaneous requests with the same bearer token. No identity or
// role result is retained after the requests finish, so revocation stays immediate.
const verificacionesEnCurso = new Map();

function tokenDeAutorizacion(req) {
    return req.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
}

// The decoded sub is only a lookup key. The following PostgREST request uses
// this bearer token; Supabase verifies its signature/expiry and RLS applies
// auth.uid() before returning a profile row.
function idUsuarioDelToken(token) {
    try {
        const partes = token.split(".");
        if (partes.length !== 3) return null;
        const sub = JSON.parse(Buffer.from(partes[1], "base64url").toString("utf8")).sub;
        return typeof sub === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(sub)
            ? sub
            : null;
    } catch {
        return null;
    }
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
    const started = process.hrtime.bigint();
    const token = tokenDeAutorizacion(req);
    if (!token) return enviarError(res, 401, "AUTH_REQUIRED", "Falta la sesión de usuario.");
    try {
        const userId = idUsuarioDelToken(token);
        if (!userId) return enviarError(res, 401, "INVALID_SESSION", "La sesión no es válida.");
        const key = createHash("sha256").update(token).digest("hex");
        let verification = verificacionesEnCurso.get(key);
        if (!verification) {
            verification = (async () => {
                const client = crearClientePublico(token);
                const perfil = await cargarPerfilActivo(client, userId);
                return { status: 200, client, perfil, userId };
            })();
            verificacionesEnCurso.set(key, verification);
        }
        let resultado;
        try {
            resultado = await verification;
        } finally {
            if (verificacionesEnCurso.get(key) === verification) verificacionesEnCurso.delete(key);
        }
        const { client, perfil } = resultado;
        if (!perfil) return enviarError(res, 403, "PROFILE_INACTIVE", "La cuenta está desactivada o no tiene un perfil válido.");
        req.supabaseUsuario = client;
        req.usuarioId = resultado.userId;
        req.usuarioPerfil = perfil;
        req.authDurationMs = Number(process.hrtime.bigint() - started) / 1e6;
        return next();
    } catch (error) {
        if (error?.status === 401 || error?.code === "PGRST301") {
            return enviarError(res, 401, "INVALID_SESSION", "La sesión no es válida.");
        }
        return enviarError(res, 503, "AUTH_TEMPORARILY_UNAVAILABLE", "No se pudo verificar la sesión temporalmente.");
    }
}

function requiereRol(...roles) {
    return (req, res, next) => roles.includes(req.usuarioPerfil?.rol)
        ? next()
        : enviarError(res, 403, "FORBIDDEN", "No tenés permisos para realizar esta operación.");
}

module.exports = { ROLES_VALIDOS, tokenDeAutorizacion, idUsuarioDelToken, cargarPerfilActivo, autenticar, requiereRol };
