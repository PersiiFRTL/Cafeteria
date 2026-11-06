const express = require("express");
const {
    crearClientePublico,
    crearClienteAdministrador,
    verificarConexionSupabase,
    supabaseUrl,
    publishableKey,
    secretKeyConfigurada
} = require("./supabaseClient");

const app = express();
const PORT = Number(process.env.PORT || process.env.port || 3000);
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
const allowedFrontendOrigins = new Set((process.env.FRONTEND_ORIGINS || [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
].join(",")).split(",").map((origin) => origin.trim()).filter(Boolean));

app.use(express.json({ limit: "16kb" }));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedFrontendOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend de Cafetería funcionando"
    });
});

app.get("/api/health/supabase", async (req, res) => {
    const estado = await verificarConexionSupabase();
    const status = estado.conectado ? 200 : estado.configurado ? 502 : 503;

    return res.status(status).json({
        servicio: "supabase",
        ...estado
    });
});

const rolesValidos = new Set(["ADMINISTRADOR", "EMPLEADO", "COCINA"]);
const intentosLoginPorClave = new Map();
const ventanaIntentosLoginMs = 15 * 60 * 1000;
const maxIntentosLoginPorVentana = 10;

function ipCliente(req) {
    return req.ip || req.socket.remoteAddress || "desconocida";
}

function claveIntentosLogin(req) {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "sin-email";
    return `${ipCliente(req)}\u0000${email}`;
}

function limitarIntentosLogin(req, res, next) {
    const ahora = Date.now();
    const clave = claveIntentosLogin(req);
    let registro = intentosLoginPorClave.get(clave);
    if (!registro || ahora - registro.inicio >= ventanaIntentosLoginMs) {
        registro = { inicio: ahora, cantidad: 0 };
    }
    if (registro.cantidad >= maxIntentosLoginPorVentana) {
        const segundosRestantes = Math.max(1, Math.ceil((registro.inicio + ventanaIntentosLoginMs - ahora) / 1000));
        res.setHeader("Retry-After", String(segundosRestantes));
        return res.status(429).json({ mensaje: "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá nuevamente." });
    }
    registro.cantidad += 1;
    intentosLoginPorClave.set(clave, registro);

    if (intentosLoginPorClave.size > 10000) {
        for (const [claveGuardada, intento] of intentosLoginPorClave) {
            if (ahora - intento.inicio >= ventanaIntentosLoginMs) intentosLoginPorClave.delete(claveGuardada);
        }
    }
    return next();
}

app.use("/api/auth", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
    next();
});

function tokenDeAutorizacion(req) {
    const encabezado = req.get("authorization") ?? "";
    const coincidencia = encabezado.match(/^Bearer\s+(.+)$/i);
    return coincidencia?.[1]?.trim() || null;
}

async function cargarPerfilActivo(cliente, userId) {
    const { data: perfil, error } = await cliente
        .from("perfiles")
        .select("id, nombre, email, rol, activo")
        .eq("id", userId)
        .maybeSingle();

    if (error || !perfil || !perfil.activo || !rolesValidos.has(perfil.rol)) return null;
    return {
        id: perfil.id,
        nombre: perfil.nombre,
        email: perfil.email ?? "",
        rol: perfil.rol
    };
}

app.post("/api/auth/login", limitarIntentosLogin, async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length > 1024) {
        return res.status(400).json({ mensaje: "Ingresá un email y una contraseña válidos." });
    }

    try {
        const clienteAuth = crearClientePublico();
        const { data, error } = await clienteAuth.auth.signInWithPassword({ email, password });
        if (error || !data.session || !data.user) {
            return res.status(401).json({ mensaje: "Email o contraseña incorrectos." });
        }

        const clienteUsuario = crearClientePublico(data.session.access_token);
        const usuario = await cargarPerfilActivo(clienteUsuario, data.user.id);
        if (!usuario) {
            await clienteAuth.auth.signOut();
            return res.status(403).json({ mensaje: "La cuenta está desactivada o no tiene un perfil válido." });
        }

        intentosLoginPorClave.delete(claveIntentosLogin(req));
        return res.status(200).json({
            usuario,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in,
                expires_at: data.session.expires_at,
                token_type: data.session.token_type
            }
        });
    } catch {
        return res.status(502).json({ mensaje: "No se pudo completar el inicio de sesión." });
    }
});

app.get("/api/auth/session", async (req, res) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return res.status(401).json({ mensaje: "Falta la sesión de usuario." });

    try {
        const cliente = crearClientePublico(token);
        const { data, error } = await cliente.auth.getUser(token);
        if (error || !data.user) return res.status(401).json({ mensaje: "La sesión no es válida." });

        const usuario = await cargarPerfilActivo(cliente, data.user.id);
        if (!usuario) return res.status(403).json({ mensaje: "La cuenta está desactivada o no tiene un perfil válido." });
        return res.json({ usuario });
    } catch {
        return res.status(502).json({ mensaje: "No se pudo validar la sesión." });
    }
});

app.post("/api/auth/logout", async (req, res) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return res.status(401).json({ mensaje: "Falta la sesión de usuario." });

    try {
        const respuesta = await fetch(`${supabaseUrl}/auth/v1/logout`, {
            method: "POST",
            headers: {
                apikey: publishableKey,
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ scope: "local" }),
            signal: AbortSignal.timeout(5000)
        });
        if (!respuesta.ok) return res.status(respuesta.status).json({ mensaje: "No se pudo cerrar la sesión remota." });
        return res.sendStatus(204);
    } catch {
        return res.status(502).json({ mensaje: "No se pudo conectar para cerrar la sesión." });
    }
});

const empleadosApi = express.Router();
const rolesDeEmpleado = new Set(["ADMINISTRADOR", "EMPLEADO", "COCINA"]);
const formatoUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

empleadosApi.use(async (req, res, next) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return res.status(401).json({ mensaje: "Falta la sesión de usuario." });

    try {
        const cliente = crearClientePublico(token);
        const { data, error } = await cliente.auth.getUser(token);
        if (error || !data.user) return res.status(401).json({ mensaje: "La sesión no es válida." });

        const perfil = await cargarPerfilActivo(cliente, data.user.id);
        if (!perfil || perfil.rol !== "ADMINISTRADOR") {
            return res.status(403).json({ mensaje: "Solo un administrador activo puede gestionar empleados." });
        }
        req.supabaseUsuario = cliente;
        req.usuarioId = data.user.id;
        return next();
    } catch {
        return res.status(502).json({ mensaje: "No se pudo validar la sesión." });
    }
});

function validarEmailYRol(email, rol) {
    return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && rolesDeEmpleado.has(rol);
}

empleadosApi.get("/", async (req, res) => {
    const { data, error } = await req.supabaseUsuario
        .from("perfiles")
        .select("id, nombre, email, rol, activo")
        .order("nombre");
    if (error) return res.status(502).json({ mensaje: "No se pudo cargar el personal." });
    return res.json({ empleados: data });
});

empleadosApi.post("/", async (req, res) => {
    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const rol = req.body?.rol;
    if (!nombre || nombre.length > 120 || !validarEmailYRol(email, rol)) {
        return res.status(400).json({ mensaje: "Nombre, email o rol no válidos." });
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(password)) {
        return res.status(400).json({ mensaje: "La contraseña debe tener al menos 8 caracteres, una letra y un número." });
    }
    if (!secretKeyConfigurada) {
        return res.status(503).json({ mensaje: "Configurá SUPABASE_SECRET_KEY en el backend para crear cuentas." });
    }

    let usuarioCreado;
    try {
        const admin = crearClienteAdministrador();
        const { data, error } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { nombre }
        });
        if (error || !data.user) {
            return res.status(400).json({ mensaje: error?.message || "No se pudo crear la cuenta." });
        }
        usuarioCreado = data.user;

        const { data: perfil, error: errorPerfil } = await req.supabaseUsuario.rpc("actualizar_perfil_empleado_seguro", {
            p_empleado_id: usuarioCreado.id,
            p_nombre: nombre,
            p_email: email,
            p_rol: rol
        });
        if (errorPerfil) {
            await admin.auth.admin.deleteUser(usuarioCreado.id);
            return res.status(400).json({ mensaje: "Se creó la cuenta, pero no se pudo guardar el perfil." });
        }
        return res.status(201).json({ empleado: perfil });
    } catch {
        if (usuarioCreado && secretKeyConfigurada) {
            try {
                await crearClienteAdministrador().auth.admin.deleteUser(usuarioCreado.id);
            } catch {
                // El error de limpieza no debe revelar credenciales ni ocultar el error principal.
            }
        }
        return res.status(502).json({ mensaje: "No se pudo crear el empleado." });
    }
});

empleadosApi.patch("/:id", async (req, res) => {
    const id = req.params.id;
    if (!formatoUuid.test(id)) return res.status(400).json({ mensaje: "El ID de empleado no es válido." });

    const nombre = typeof req.body?.nombre === "string" ? req.body.nombre.trim() : "";
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const rol = req.body?.rol;
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!nombre || nombre.length > 120 || !validarEmailYRol(email, rol)) {
        return res.status(400).json({ mensaje: "Nombre, email o rol no válidos." });
    }
    if (password && !/^(?=.*[A-Za-z])(?=.*\d).{8,128}$/.test(password)) {
        return res.status(400).json({ mensaje: "La contraseña debe tener al menos 8 caracteres, una letra y un número." });
    }

    try {
        const { data: actual, error: errorActual } = await req.supabaseUsuario
            .from("perfiles")
            .select("id, nombre, email, rol, activo")
            .eq("id", id)
            .maybeSingle();
        if (errorActual) return res.status(502).json({ mensaje: "No se pudo consultar el empleado." });
        if (!actual) return res.status(404).json({ mensaje: "No se encontró el empleado." });
        if (id === req.usuarioId && rol !== "ADMINISTRADOR") {
            return res.status(400).json({ mensaje: "No podés quitarte el rol de administrador desde tu propia cuenta." });
        }
        const cambiaEmail = email !== (actual.email ?? "").toLowerCase();
        if ((cambiaEmail || password) && !secretKeyConfigurada) {
            return res.status(503).json({ mensaje: "Configurá SUPABASE_SECRET_KEY en el backend para cambiar credenciales." });
        }

        const parametrosPerfil = {
            p_empleado_id: id,
            p_nombre: nombre,
            p_email: email,
            p_rol: rol
        };
        const { data: actualizado, error: errorPerfil } = await req.supabaseUsuario.rpc(
            "actualizar_perfil_empleado_seguro",
            parametrosPerfil
        );
        if (errorPerfil) {
            const estado = errorPerfil.code === "42501" ? 403 : 400;
            return res.status(estado).json({ mensaje: errorPerfil.message });
        }

        if (cambiaEmail || password) {
            const atributos = {};
            if (cambiaEmail) {
                atributos.email = email;
                atributos.email_confirm = true;
            }
            if (password) atributos.password = password;

            const { error: errorAuth } = await crearClienteAdministrador().auth.admin.updateUserById(id, atributos);
            if (errorAuth) {
                const { error: errorRestauracion } = await req.supabaseUsuario.rpc(
                    "actualizar_perfil_empleado_seguro",
                    {
                        p_empleado_id: id,
                        p_nombre: actual.nombre,
                        p_email: actual.email,
                        p_rol: actual.rol
                    }
                );
                if (errorRestauracion) {
                    return res.status(502).json({ mensaje: "No se pudieron sincronizar los cambios del empleado. Revisá su perfil y credenciales." });
                }
                return res.status(400).json({ mensaje: errorAuth.message });
            }
        }

        return res.json({ empleado: actualizado });
    } catch {
        return res.status(502).json({ mensaje: "No se pudo actualizar el empleado." });
    }
});

empleadosApi.patch("/:id/estado", async (req, res) => {
    const id = req.params.id;
    const activo = req.body?.activo;
    if (!formatoUuid.test(id) || typeof activo !== "boolean") {
        return res.status(400).json({ mensaje: "El ID o el estado del empleado no son válidos." });
    }
    if (id === req.usuarioId && !activo) {
        return res.status(400).json({ mensaje: "No podés desactivar tu propia cuenta." });
    }

    try {
        const { data: actual, error: errorActual } = await req.supabaseUsuario
            .from("perfiles")
            .select("id, rol, activo")
            .eq("id", id)
            .maybeSingle();
        if (errorActual) return res.status(502).json({ mensaje: "No se pudo consultar el empleado." });
        if (!actual) return res.status(404).json({ mensaje: "No se encontró el empleado." });
        const { data, error } = await req.supabaseUsuario.rpc("cambiar_estado_empleado_seguro", {
            p_empleado_id: id,
            p_activo: activo
        });
        if (error) {
            const estado = error.code === "42501" ? 403 : 400;
            return res.status(estado).json({ mensaje: error.message });
        }
        return res.json({ empleado: data });
    } catch {
        return res.status(502).json({ mensaje: "No se pudo cambiar el estado del empleado." });
    }
});

app.use("/api/empleados", empleadosApi);

// Devuelve únicamente nombres e IDs para atribuir registros a su responsable.
app.get("/api/perfiles/nombres", async (req, res) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return res.status(401).json({ mensaje: "Falta la sesión de usuario." });

    try {
        const clienteUsuario = crearClientePublico(token);
        const { data: sesion, error: errorSesion } = await clienteUsuario.auth.getUser(token);
        if (errorSesion || !sesion.user) return res.status(401).json({ mensaje: "La sesión no es válida." });
        if (!await cargarPerfilActivo(clienteUsuario, sesion.user.id)) {
            return res.status(403).json({ mensaje: "La cuenta está desactivada o no tiene un perfil válido." });
        }
        if (!secretKeyConfigurada) {
            return res.status(503).json({ mensaje: "Configurá SUPABASE_SECRET_KEY en el backend para consultar responsables." });
        }

        const { data, error } = await crearClienteAdministrador()
            .from("perfiles")
            .select("id, nombre")
            .order("nombre");
        if (error) return res.status(502).json({ mensaje: "No se pudieron cargar los nombres de responsables." });
        return res.json({ perfiles: data });
    } catch {
        return res.status(502).json({ mensaje: "No se pudieron cargar los nombres de responsables." });
    }
});

const operaciones = express.Router();

operaciones.use(async (req, res, next) => {
    const token = tokenDeAutorizacion(req);
    if (!token) return res.status(401).json({ mensaje: "Falta la sesión de usuario." });

    try {
        const cliente = crearClientePublico(token);
        const { data, error } = await cliente.auth.getUser(token);
        if (error || !data.user) return res.status(401).json({ mensaje: "La sesión no es válida." });
        req.supabaseUsuario = cliente;
        return next();
    } catch {
        return res.status(502).json({ mensaje: "No se pudo validar la sesión." });
    }
});

async function ejecutarOperacion(req, res, nombre, parametros) {
    try {
        const { data, error } = await req.supabaseUsuario.rpc(nombre, parametros);
        if (error) {
            const estado = error.code === "42501" ? 403
                : ["22023", "23505", "23514", "P0001"].includes(error.code) ? 400
                    : 502;
            return res.status(estado).json({
                mensaje: estado === 502 ? "No se pudo completar la operación." : error.message,
                codigo: error.code
            });
        }
        if (data === null) return res.sendStatus(204);
        return res.json({ data });
    } catch {
        return res.status(502).json({ mensaje: "No se pudo conectar con Supabase." });
    }
}

function idPositivo(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

operaciones.post("/comandas", (req, res) => ejecutarOperacion(req, res, "crear_comanda", {
    p_mesa_id: req.body?.mesaId ?? null,
    p_productos: req.body?.productos,
    p_cliente_nombre: req.body?.clienteNombre ?? null,
    p_cliente_telefono: req.body?.clienteTelefono ?? null,
    p_hora_retiro: req.body?.horaRetiro ?? null
}));

operaciones.patch("/comandas/:id", (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "El ID de comanda no es válido." });
    return ejecutarOperacion(req, res, "editar_comanda", {
        p_comanda_id: id,
        p_productos: req.body?.productos
    });
});

operaciones.post("/comandas/:id/productos", (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "El ID de comanda no es válido." });
    return ejecutarOperacion(req, res, "agregar_productos_comanda", {
        p_comanda_id: id,
        p_productos: req.body?.productos
    });
});

operaciones.post("/comandas/:id/procesar-stock", (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "El ID de comanda no es válido." });
    return ejecutarOperacion(req, res, "procesar_stock_comanda", { p_comanda_id: id });
});

operaciones.patch("/comandas/:id/items/:productoId/estado", (req, res) => {
    const comandaId = idPositivo(req.params.id);
    const productoId = idPositivo(req.params.productoId);
    if (!comandaId || !productoId) return res.status(400).json({ mensaje: "Los IDs enviados no son válidos." });
    return ejecutarOperacion(req, res, "cambiar_estado_item_comanda", {
        p_comanda_id: comandaId,
        p_producto_id: productoId,
        p_estado: req.body?.estado
    });
});

operaciones.post("/comandas/:id/finalizar", (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "El ID de comanda no es válido." });
    return ejecutarOperacion(req, res, "finalizar_comanda", { p_comanda_id: id });
});

operaciones.post("/comandas/:id/cancelar", (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return res.status(400).json({ mensaje: "El ID de comanda no es válido." });
    return ejecutarOperacion(req, res, "cancelar_comanda", { p_comanda_id: id });
});

operaciones.post("/stock/movimientos", (req, res) => ejecutarOperacion(req, res, "registrar_movimiento_stock", {
    p_materia_prima_id: req.body?.materiaPrimaId ?? null,
    p_producto_id: req.body?.productoId ?? null,
    p_tipo: req.body?.tipo,
    p_cantidad: req.body?.cantidad,
    p_descripcion: req.body?.descripcion ?? null
}));

operaciones.post("/producciones", (req, res) => ejecutarOperacion(req, res, "registrar_produccion", {
    p_producto_id: req.body?.productoId,
    p_cantidad: req.body?.cantidad
}));

operaciones.put("/mapa", (req, res) => ejecutarOperacion(req, res, "guardar_mapa", {
    p_mesas: req.body?.mesas,
    p_elementos: req.body?.elementos,
    p_ids_eliminar: req.body?.idsEliminar ?? []
}));

app.use("/api", operaciones);

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`Supabase: ${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? "configurado" : "sin configurar"}`);
    });
}

module.exports = app;
