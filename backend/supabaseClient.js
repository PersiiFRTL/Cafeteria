const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env") });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = supabaseUrl && publishableKey
    ? createClient(supabaseUrl, publishableKey, {
        auth: {
            autoRefreshToken: false,
            detectSessionInUrl: false,
            persistSession: false
        }
    })
    : null;

async function verificarConexionSupabase() {
    if (!supabase || !supabaseUrl || !publishableKey) {
        return { configurado: false, conectado: false };
    }

    try {
        const respuesta = await fetch(`${supabaseUrl}/auth/v1/health`, {
            headers: { apikey: publishableKey },
            signal: AbortSignal.timeout(5000)
        });

        if (!respuesta.ok) {
            return {
                configurado: true,
                conectado: false,
                causa: "respuesta_http",
                codigoHttp: respuesta.status
            };
        }

        return { configurado: true, conectado: true };
    } catch (error) {
        const codigo = error?.cause?.code;
        const codigosRedConocidos = new Set([
            "ENOTFOUND",
            "ECONNREFUSED",
            "ETIMEDOUT",
            "ECONNRESET",
            "EAI_AGAIN"
        ]);

        return {
            configurado: true,
            conectado: false,
            causa: codigosRedConocidos.has(codigo) ? codigo : "error_de_red"
        };
    }
}

module.exports = { supabase, verificarConexionSupabase };
