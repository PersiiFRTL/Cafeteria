const { crearClienteAdministrador, secretKeyConfigurada } = require("../config/supabase");
const { enviarDatos, enviarError, mapearErrorSupabase } = require("../middlewares/responses");
const { idPositivo, paginacion } = require("../validators/common");

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const claveValida = (password) => /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(password);

exports.listar = async (req, res) => {
    const page = paginacion(req.query);
    if (!page) return enviarError(res, 400, "INVALID_PAGINATION", "Los parámetros page y limit no son válidos.");
    const { data, error, count } = await req.supabaseUsuario.from("perfiles")
        .select("id,nombre,email,rol,activo", { count: "exact" }).order("nombre").range(page.from, page.to);
    if (error) { const mapped = mapearErrorSupabase(error, "No se pudo cargar el personal."); return enviarError(res, mapped.status, mapped.code, mapped.message); }
    return enviarDatos(res, data ?? [], 200, { page: page.page, limit: page.limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / page.limit) });
};

exports.crear = async (req, res) => {
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = req.body?.password;
    const rol = req.body?.rol;
    if (!nombre || nombre.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof rol !== "string" || !rol.trim() || typeof password !== "string" || !claveValida(password)) return enviarError(res, 400, "INVALID_EMPLOYEE", "Nombre, email, rol o contraseña no válidos.");
    if (req.usuarioPerfil.rol !== "ADMINISTRADOR" && rol !== "EMPLEADO") return enviarError(res, 403, "ROLE_ASSIGNMENT_FORBIDDEN", "Solo un administrador puede asignar roles al crear empleados.");
    if (!secretKeyConfigurada) return enviarError(res, 503, "ADMIN_KEY_REQUIRED", "La administración de cuentas no está configurada en el servidor.");
    let created;
    try {
        const admin = crearClienteAdministrador();
        const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { nombre } });
        if (error || !data.user) return enviarError(res, 400, "EMPLOYEE_CREATE_FAILED", error?.message || "No se pudo crear la cuenta.");
        created = data.user;
        const { data: perfil, error: profileError } = await req.supabaseUsuario.rpc("actualizar_perfil_empleado_seguro", {
            p_empleado_id: created.id, p_nombre: nombre, p_email: email, p_rol: rol
        });
        if (profileError) {
            await admin.auth.admin.deleteUser(created.id);
            return enviarError(res, 400, profileError.code || "PROFILE_UPDATE_FAILED", "No se pudo guardar el perfil del empleado.");
        }
        return enviarDatos(res, perfil, 201);
    } catch {
        if (created) await crearClienteAdministrador().auth.admin.deleteUser(created.id).catch(() => undefined);
        return enviarError(res, 503, "EMPLOYEE_SERVICE_UNAVAILABLE", "No se pudo crear el empleado.");
    }
};

exports.editar = async (req, res) => {
    const id = req.params.id;
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const rol = req.body?.rol;
    if (!UUID.test(id) || !nombre || nombre.length > 120 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof rol !== "string" || !rol.trim() || (password && !claveValida(password))) return enviarError(res, 400, "INVALID_EMPLOYEE", "El ID, nombre, email, rol o contraseña no son válidos.");
    const { data: actual, error: readError } = await req.supabaseUsuario.from("perfiles").select("id,nombre,email,rol,activo").eq("id", id).maybeSingle();
    if (readError) { const mapped = mapearErrorSupabase(readError, "No se pudo consultar el empleado."); return enviarError(res, mapped.status, mapped.code, mapped.message); }
    if (!actual) return enviarError(res, 404, "NOT_FOUND", "No se encontró el empleado.");
    const cambiaEmail = email !== (actual.email ?? "").toLowerCase();
    const cambiaRol = rol !== actual.rol;
    const esAdministrador = req.usuarioPerfil.rol === "ADMINISTRADOR";
    if (id === req.usuarioId && cambiaRol) return enviarError(res, 403, "SELF_ROLE_CHANGE_FORBIDDEN", "No podés cambiar tu propio rol.");
    if (cambiaRol && !esAdministrador) return enviarError(res, 403, "ROLE_ASSIGNMENT_FORBIDDEN", "Solo un administrador puede cambiar el rol de un empleado.");
    if ((cambiaEmail || password) && !esAdministrador) return enviarError(res, 403, "CREDENTIAL_CHANGE_FORBIDDEN", "Solo un administrador puede cambiar el email o la contraseña de un empleado.");
    if ((cambiaEmail || password) && !secretKeyConfigurada) return enviarError(res, 503, "ADMIN_KEY_REQUIRED", "La administración de credenciales no está configurada.");
    const { data: actualizado, error } = await req.supabaseUsuario.rpc("actualizar_perfil_empleado_seguro", {
        p_empleado_id: id, p_nombre: nombre, p_email: email, p_rol: rol
    });
    if (error) { const mapped = mapearErrorSupabase(error, "No se pudo actualizar el perfil del empleado."); return enviarError(res, mapped.status, mapped.code, mapped.message); }

    if (cambiaEmail || password) {
        const attributes = {};
        if (cambiaEmail) { attributes.email = email; attributes.email_confirm = true; }
        if (password) attributes.password = password;
        const { error: authError } = await crearClienteAdministrador().auth.admin.updateUserById(id, attributes);
        if (authError) {
            await req.supabaseUsuario.rpc("actualizar_perfil_empleado_seguro", {
                p_empleado_id: id, p_nombre: actual.nombre, p_email: actual.email, p_rol: actual.rol
            });
            return enviarError(res, 400, "AUTH_UPDATE_FAILED", authError.message);
        }
    }
    return enviarDatos(res, actualizado);
};

exports.estado = async (req, res) => {
    const { id } = req.params;
    const activo = req.body?.activo;
    if (!UUID.test(id) || typeof activo !== "boolean") return enviarError(res, 400, "INVALID_EMPLOYEE_STATE", "El ID o el estado del empleado no son válidos.");
    if (id === req.usuarioId && !activo) return enviarError(res, 400, "SELF_DEACTIVATION", "No podés desactivar tu propia cuenta.");
    const { data, error } = await req.supabaseUsuario.rpc("cambiar_estado_empleado_seguro", { p_empleado_id: id, p_activo: activo });
    if (error) { const mapped = mapearErrorSupabase(error, "No se pudo cambiar el estado del empleado."); return enviarError(res, mapped.status, mapped.code, mapped.message); }
    return enviarDatos(res, data);
};
