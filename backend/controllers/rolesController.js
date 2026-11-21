const { enviarDatos, enviarError, mapearErrorSupabase } = require("../middlewares/responses");
const { validarPermisos } = require("../validators/rolePermissions");

exports.listar = async (req, res) => {
    const { data, error } = await req.supabaseUsuario.from("roles")
        .select("nombre,descripcion,permisos,sistema,creado_en").order("sistema", { ascending: false }).order("nombre");
    if (error) {
        const mapped = mapearErrorSupabase(error, "No se pudieron cargar los roles.");
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
    return enviarDatos(res, data ?? []);
};

exports.crear = async (req, res) => {
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const descripcion = typeof req.body?.descripcion === "string" ? req.body.descripcion.trim() : "";
    const permisos = validarPermisos(req.body?.permisos);
    if (nombre.length < 2 || nombre.length > 60 || descripcion.length > 240 || !permisos) {
        return enviarError(res, 400, "INVALID_ROLE", "Ingresá un nombre de 2 a 60 caracteres, una descripción de hasta 240 caracteres y permisos válidos para todos los módulos.");
    }
    const { data, error } = await req.supabaseUsuario.from("roles")
        .insert({ nombre, descripcion, permisos, sistema: false })
        .select("nombre,descripcion,permisos,sistema,creado_en").single();
    if (error?.code === "23505") return enviarError(res, 409, "ROLE_ALREADY_EXISTS", "Ya existe un rol con ese nombre.");
    if (error) {
        const mapped = mapearErrorSupabase(error, "No se pudo crear el rol.");
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
    return enviarDatos(res, data, 201);
};
