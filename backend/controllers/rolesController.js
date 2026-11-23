const { enviarDatos, enviarError, mapearErrorSupabase } = require("../middlewares/responses");
const { validarPermisos } = require("../validators/rolePermissions");
const ROLES_BASE_EDITABLES = new Set(["EMPLEADO", "COCINA"]);

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

exports.editar = async (req, res) => {
    const nombreAnterior = typeof req.params.nombre === "string" ? req.params.nombre.trim() : "";
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const descripcion = typeof req.body?.descripcion === "string" ? req.body.descripcion.trim() : "";
    const permisos = validarPermisos(req.body?.permisos);
    if (!nombreAnterior || nombre.length < 2 || nombre.length > 60 || descripcion.length > 240 || !permisos) {
        return enviarError(res, 400, "INVALID_ROLE", "Ingresá un nombre de 2 a 60 caracteres, una descripción de hasta 240 caracteres y permisos válidos para todos los módulos.");
    }

    const { data: existente, error: errorLectura } = await req.supabaseUsuario.from("roles")
        .select("nombre,sistema").eq("nombre", nombreAnterior).maybeSingle();
    if (errorLectura) {
        const mapped = mapearErrorSupabase(errorLectura, "No se pudo consultar el rol.");
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
    if (!existente) return enviarError(res, 404, "ROLE_NOT_FOUND", "No se encontró el rol que querés editar.");
    if (existente.sistema && !ROLES_BASE_EDITABLES.has(existente.nombre)) {
        return enviarError(res, 403, "SYSTEM_ROLE_IMMUTABLE", "Este rol base no se puede editar.");
    }
    if (existente.sistema && nombre !== nombreAnterior) {
        return enviarError(res, 400, "SYSTEM_ROLE_NAME_IMMUTABLE", "No se puede cambiar el nombre de un rol base.");
    }

    const { data, error } = await req.supabaseUsuario.from("roles")
        .update({ nombre, descripcion, permisos }).eq("nombre", nombreAnterior)
        .select("nombre,descripcion,permisos,sistema,creado_en").single();
    if (error?.code === "23505") return enviarError(res, 409, "ROLE_ALREADY_EXISTS", "Ya existe un rol con ese nombre.");
    if (error) {
        const mapped = mapearErrorSupabase(error, "No se pudo actualizar el rol.");
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
    return enviarDatos(res, data);
};
