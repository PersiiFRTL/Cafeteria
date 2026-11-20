const { crearClientePublico, url, publishableKey } = require("../config/supabase");
const { cargarPerfilActivo, tokenDeAutorizacion, idUsuarioDelToken } = require("../middlewares/auth");
const { enviarDatos, enviarError } = require("../middlewares/responses");

exports.login = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 1024) {
        return enviarError(res, 400, "INVALID_LOGIN", "Ingresá un email y una contraseña válidos.");
    }
    try {
        const authClient = crearClientePublico();
        const { data, error } = await authClient.auth.signInWithPassword({ email, password });
        if (error || !data.session || !data.user) return enviarError(res, 401, "INVALID_CREDENTIALS", "Email o contraseña incorrectos.");
        const profile = await cargarPerfilActivo(crearClientePublico(data.session.access_token), data.user.id);
        if (!profile) {
            await authClient.auth.signOut();
            return enviarError(res, 403, "PROFILE_INACTIVE", "La cuenta está desactivada o no tiene un perfil válido.");
        }
        return enviarDatos(res, {
            usuario: profile,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
                expires_at: data.session.expires_at,
                token_type: data.session.token_type
            }
        });
    } catch {
        return enviarError(res, 503, "AUTH_UNAVAILABLE", "No se pudo completar el inicio de sesión.");
    }
};

exports.session = async (req, res) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return enviarError(res, 401, "AUTH_REQUIRED", "Falta la sesión de usuario.");
    try {
        const userId = idUsuarioDelToken(token);
        if (!userId) return enviarError(res, 401, "INVALID_SESSION", "La sesión no es válida.");
        const client = crearClientePublico(token);
        const profile = await cargarPerfilActivo(client, userId);
        if (!profile) return enviarError(res, 403, "PROFILE_INACTIVE", "La cuenta está desactivada o no tiene un perfil válido.");
        return enviarDatos(res, { usuario: profile });
    } catch (error) {
        if (error?.status === 401 || error?.code === "PGRST301") {
            return enviarError(res, 401, "INVALID_SESSION", "La sesión no es válida.");
        }
        return enviarError(res, 503, "AUTH_TEMPORARILY_UNAVAILABLE", "No se pudo verificar la sesión temporalmente.");
    }
};

exports.logout = async (req, res) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return enviarError(res, 401, "AUTH_REQUIRED", "Falta la sesión de usuario.");
    try {
        const response = await fetch(`${url}/auth/v1/logout`, {
            method: "POST",
            headers: { apikey: publishableKey, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ scope: "local" }), signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) return enviarError(res, response.status, "LOGOUT_FAILED", "No se pudo cerrar la sesión remota.");
        return enviarDatos(res, { mensaje: "Sesión cerrada." });
    } catch {
        return enviarError(res, 503, "AUTH_UNAVAILABLE", "No se pudo conectar para cerrar la sesión.");
    }
};
