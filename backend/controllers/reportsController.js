const { enviarDatos, enviarError, mapearErrorSupabase } = require("../middlewares/responses");
const { fechaValida, paginacion, rangoFechas } = require("../validators/common");
const { obtenerVentas } = require("../services/reportsService");

exports.ventas = async (req, res) => {
    const { desde, hasta } = req.query;
    if (!fechaValida(desde) || !fechaValida(hasta) || desde > hasta) return enviarError(res, 400, "INVALID_DATE_RANGE", "Se requieren fechas válidas desde y hasta (YYYY-MM-DD), y desde no puede ser posterior a hasta.");
    try {
        const hastaExclusiva = new Date(Date.parse(`${hasta}T00:00:00.000Z`) + 86400000).toISOString();
        return enviarDatos(res, await obtenerVentas(req.supabaseUsuario, new Date(`${desde}T00:00:00.000Z`).toISOString(), hastaExclusiva));
    } catch (error) {
        const mapped = mapearErrorSupabase(error, "No se pudo calcular el informe de ventas.");
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
};

exports.auditoria = async (req, res) => {
    const page = paginacion(req.query);
    const rango = rangoFechas(req.query);
    if (!page || !rango) return enviarError(res, 400, "INVALID_QUERY", "La paginación o el rango de fechas no son válidos.");
    const usuarioId = req.query.usuarioId;
    const accion = req.query.accion;
    if (usuarioId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(usuarioId)) return enviarError(res, 400, "INVALID_USER_ID", "El usuarioId debe ser un UUID válido.");
    if (accion !== undefined && (typeof accion !== "string" || accion.length < 1 || accion.length > 80)) return enviarError(res, 400, "INVALID_ACTION", "El filtro de acción debe tener entre 1 y 80 caracteres.");
    let query = req.supabaseUsuario.from("auditoria_eventos")
        .select("id,usuario_id,usuario_nombre,entidad,entidad_id,accion,detalle,fecha", { count: "exact" })
        .order("fecha", { ascending: false }).range(page.from, page.to);
    if (usuarioId) query = query.eq("usuario_id", usuarioId);
    if (accion) query = query.ilike("accion", `%${accion}%`);
    if (rango.desde) query = query.gte("fecha", rango.desde);
    if (rango.hastaExclusiva) query = query.lt("fecha", rango.hastaExclusiva);
    const { data, error, count } = await query;
    if (error) {
        const mapped = mapearErrorSupabase(error, "No se pudo cargar la auditoría.");
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
    const total = count ?? 0;
    return enviarDatos(res, data ?? [], 200, { page: page.page, limit: page.limit, total, totalPages: Math.ceil(total / page.limit) });
};
