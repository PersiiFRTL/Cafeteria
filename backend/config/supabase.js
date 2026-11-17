const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

function crearClientePublico(token) {
    if (!url || !publishableKey) throw new Error("Supabase no está configurado.");
    return createClient(url, publishableKey, {
        auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
        ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {})
    });
}

function crearClienteAdministrador() {
    if (!url || !secretKey) throw new Error("Falta configurar la clave secreta de Supabase en el backend.");
    return createClient(url, secretKey, {
        auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false }
    });
}

async function verificarConexionSupabase() {
    if (!url || !publishableKey) return { configurado: false, conectado: false };
    try {
        const response = await fetch(`${url}/auth/v1/health`, {
            headers: { apikey: publishableKey }, signal: AbortSignal.timeout(5000)
        });
        return response.ok
            ? { configurado: true, conectado: true }
            : { configurado: true, conectado: false, causa: "respuesta_http", codigoHttp: response.status };
    } catch (error) {
        return { configurado: true, conectado: false, causa: error?.cause?.code || "error_de_red" };
    }
}

module.exports = { url, publishableKey, secretKeyConfigurada: Boolean(secretKey), crearClientePublico, crearClienteAdministrador, verificarConexionSupabase };
