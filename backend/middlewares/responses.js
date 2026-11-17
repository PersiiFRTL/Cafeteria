function enviarDatos(res, data, status = 200, pagination) {
    return res.status(status).json({ data, ...(pagination ? { pagination } : {}) });
}

function enviarError(res, status, code, message, details) {
    return res.status(status).json({ error: { code, message, ...(details ? { details } : {}) } });
}

function mapearErrorSupabase(error, fallback = "No se pudo completar la operación.") {
    const status = error?.code === "42501" ? 403
        : error?.code === "PGRST116" ? 404
            : ["23505", "23514", "22023", "P0001"].includes(error?.code) ? 400
                : 502;
    return { status, code: error?.code || "SUPABASE_ERROR", message: status === 502 ? fallback : error.message };
}

function asyncHandler(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function errorHandler(error, _req, res, _next) {
    if (res.headersSent) return;
    if (error?.type === "entity.too.large") return enviarError(res, 413, "PAYLOAD_TOO_LARGE", "El cuerpo de la solicitud supera el límite permitido.");
    if (error?.status) return enviarError(res, error.status, error.code || "REQUEST_ERROR", error.message);
    if (error?.code) {
        const mapped = mapearErrorSupabase(error);
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
    return enviarError(res, 500, "INTERNAL_ERROR", "Ocurrió un error interno.");
}

module.exports = { enviarDatos, enviarError, mapearErrorSupabase, asyncHandler, errorHandler };
