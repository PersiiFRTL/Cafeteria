const { enviarDatos, enviarError, mapearErrorSupabase } = require("../middlewares/responses");
const { paginacion, idPositivo, rangoFechas } = require("../validators/common");
const { validarProducto, validarMateriaPrima, validarReceta } = require("../validators/payloads");
const service = require("../services/catalogService");
const { crearClienteAdministrador, secretKeyConfigurada } = require("../config/supabase");

function parseBoolean(value) {
    if (value === undefined) return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
}

function responderPagina(res, result, page) {
    const total = result.count ?? result.data.length;
    return enviarDatos(res, result.data, 200, { page: page.page, limit: page.limit, total, totalPages: Math.ceil(total / page.limit) });
}

function errorSupabase(res, error, fallback) {
    const mapped = mapearErrorSupabase(error, fallback);
    return enviarError(res, mapped.status, mapped.code, mapped.message);
}

exports.listarProductos = async (req, res) => {
    const page = paginacion(req.query);
    const activo = parseBoolean(req.query.activo);
    const disponible = parseBoolean(req.query.disponible);
    if (!page || activo === null || disponible === null) return enviarError(res, 400, "INVALID_QUERY", "La paginación o los filtros del producto no son válidos.");
    if (req.query.sector && !["Cocina", "Cafetería", "Pastelería"].includes(req.query.sector)) return enviarError(res, 400, "INVALID_SECTOR", "El sector debe ser Cocina, Cafetería o Pastelería.");
    if (req.query.tipoElaboracion && !["bajo_pedido", "preelaborado", "reventa"].includes(req.query.tipoElaboracion)) return enviarError(res, 400, "INVALID_TYPE", "El tipo de elaboración no es válido.");
    const result = await service.listarProductos(req.supabaseUsuario, { activo, disponible, sector: req.query.sector, tipoElaboracion: req.query.tipoElaboracion }, page);
    return responderPagina(res, result, page);
};

exports.obtenerProducto = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID del producto no es válido.");
    const data = await service.porId(req.supabaseUsuario, "productos", id);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró el producto.");
    return enviarDatos(res, data);
};

exports.crearProducto = async (req, res) => {
    if (!validarProducto(req.body)) return enviarError(res, 400, "INVALID_PRODUCT", "Los datos del producto no son válidos.");
    const data = await service.crearProducto(req.supabaseUsuario, {
        nombre: req.body.nombre.trim(), precio: Number(req.body.precio), categoria: req.body.categoria.trim(),
        sector: req.body.sector, tipo_elaboracion: req.body.tipoElaboracion, unidad_venta: "unidad"
    });
    return enviarDatos(res, data, 201);
};

exports.editarProducto = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id || !validarProducto(req.body)) return enviarError(res, 400, "INVALID_PRODUCT", "El ID o los datos del producto no son válidos.");
    const data = await service.actualizar(req.supabaseUsuario, "productos", id, {
        nombre: req.body.nombre.trim(), precio: Number(req.body.precio), categoria: req.body.categoria.trim(),
        sector: req.body.sector, tipo_elaboracion: req.body.tipoElaboracion
    });
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró el producto.");
    return enviarDatos(res, data);
};

exports.editarMinimoProducto = async (req, res) => {
    const id = idPositivo(req.params.id);
    const stockMinimo = Number(req.body?.stockMinimo);
    if (!id || !Number.isFinite(stockMinimo) || stockMinimo < 0) return enviarError(res, 400, "INVALID_MINIMUM", "El ID o el mínimo de stock no son válidos.");
    const data = await service.actualizar(req.supabaseUsuario, "productos", id, { stock_minimo: stockMinimo }, "id,stock_minimo");
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró el producto.");
    return enviarDatos(res, data);
};

exports.estadoProducto = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id || typeof req.body?.activo !== "boolean") return enviarError(res, 400, "INVALID_ACTIVE_STATE", "El ID o el estado del producto no son válidos.");
    const data = await service.actualizar(req.supabaseUsuario, "productos", id, { activo: req.body.activo }, "id,activo");
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró el producto.");
    return enviarDatos(res, data);
};

exports.eliminarProducto = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID del producto no es válido.");
    const data = await service.eliminarProducto(req.supabaseUsuario, id);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró el producto.");
    return enviarDatos(res, { id: data.id, mensaje: "Producto eliminado." });
};

exports.listarMateriasPrimas = async (req, res) => {
    const page = paginacion(req.query);
    const activo = parseBoolean(req.query.activo);
    if (!page || activo === null) return enviarError(res, 400, "INVALID_QUERY", "La paginación o el filtro activo no son válidos.");
    const result = await service.listarMateriasPrimas(req.supabaseUsuario, activo, page);
    return responderPagina(res, result, page);
};

exports.obtenerMateriaPrima = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID de la materia prima no es válido.");
    const data = await service.porId(req.supabaseUsuario, "materias_primas", id);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró la materia prima.");
    return enviarDatos(res, data);
};

exports.crearMateriaPrima = async (req, res) => {
    const stockInicial = Number(req.body?.stockInicial);
    if (!validarMateriaPrima(req.body) || !Number.isFinite(stockInicial) || stockInicial < 0) return enviarError(res, 400, "INVALID_MATERIAL", "Los datos de la materia prima no son válidos.");
    const data = await service.crearMateriaPrima(req.supabaseUsuario, {
        p_nombre: req.body.nombre.trim(), p_categoria: req.body.categoria.trim(), p_unidad: req.body.unidad,
        p_stock_minimo: Number(req.body.stockMinimo), p_stock_inicial: stockInicial
    });
    return enviarDatos(res, data, 201);
};

exports.editarMateriaPrima = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id || !validarMateriaPrima(req.body)) return enviarError(res, 400, "INVALID_MATERIAL", "El ID o los datos de la materia prima no son válidos.");
    const data = await service.actualizar(req.supabaseUsuario, "materias_primas", id, {
        nombre: req.body.nombre.trim(), categoria: req.body.categoria.trim(), unidad: req.body.unidad,
        stock_minimo: Number(req.body.stockMinimo)
    });
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró la materia prima.");
    return enviarDatos(res, data);
};

exports.estadoMateriaPrima = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id || typeof req.body?.activo !== "boolean") return enviarError(res, 400, "INVALID_ACTIVE_STATE", "El ID o el estado de la materia prima no son válidos.");
    const data = await service.actualizar(req.supabaseUsuario, "materias_primas", id, { activo: req.body.activo }, "id,activo");
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró la materia prima.");
    return enviarDatos(res, data);
};

exports.listarMesas = async (req, res) => {
    const page = paginacion(req.query);
    if (!page) return enviarError(res, 400, "INVALID_PAGINATION", "Los parámetros page y limit no son válidos.");
    const result = await service.listarMesas(req.supabaseUsuario, page);
    return responderPagina(res, result, page);
};

exports.obtenerMesa = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID de la mesa no es válido.");
    const data = await service.porId(req.supabaseUsuario, "mesas", id);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró la mesa.");
    return enviarDatos(res, data);
};

exports.listarComandas = async (req, res) => {
    const page = paginacion(req.query);
    const rango = rangoFechas(req.query);
    if (!page || !rango) return enviarError(res, 400, "INVALID_QUERY", "La paginación o el rango de fechas no son válidos.");
    if (req.query.estado && !["pendiente", "preparando", "lista", "finalizada", "cancelada"].includes(req.query.estado)) return enviarError(res, 400, "INVALID_STATE", "El estado de la comanda no es válido.");
    const mesaId = req.query.mesaId ? idPositivo(req.query.mesaId) : undefined;
    if (req.query.mesaId && !mesaId) return enviarError(res, 400, "INVALID_TABLE_ID", "El ID de mesa no es válido.");
    const result = await service.listarComandas(req.supabaseUsuario, { estado: req.query.estado, mesaId, ...rango }, page);
    return responderPagina(res, result, page);
};

exports.obtenerComanda = async (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID de la comanda no es válido.");
    const data = await service.obtenerComanda(req.supabaseUsuario, id);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró la comanda.");
    return enviarDatos(res, data);
};

exports.listarRecetas = async (req, res) => {
    const page = paginacion(req.query);
    if (!page) return enviarError(res, 400, "INVALID_PAGINATION", "Los parámetros page y limit no son válidos.");
    const result = await service.listarRecetas(req.supabaseUsuario, page);
    return responderPagina(res, result, page);
};

exports.obtenerReceta = async (req, res) => {
    const productoId = idPositivo(req.params.productoId);
    if (!productoId) return enviarError(res, 400, "INVALID_ID", "El ID del producto no es válido.");
    const data = await service.obtenerReceta(req.supabaseUsuario, productoId);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "El producto no tiene una receta registrada.");
    return enviarDatos(res, data);
};

exports.guardarReceta = async (req, res) => {
    const productoId = idPositivo(req.params.productoId);
    const ingredientes = req.body?.ingredientes;
    if (!productoId || !validarReceta(ingredientes)) return enviarError(res, 400, "INVALID_RECIPE", "La receta debe contener ingredientes válidos con cantidades mayores que cero.");
    const data = await service.guardarReceta(req.supabaseUsuario, productoId,
        ingredientes.map((item) => ({ materiaPrimaId: Number(item.materiaPrimaId), cantidad: Number(item.cantidad) })));
    return enviarDatos(res, data);
};

exports.estadoReceta = async (req, res) => {
    const productoId = idPositivo(req.params.productoId);
    if (!productoId || typeof req.body?.activo !== "boolean") {
        return enviarError(res, 400, "INVALID_RECIPE_STATE", "El ID del producto y el estado activo (true o false) son obligatorios.");
    }
    const data = await service.cambiarEstadoReceta(req.supabaseUsuario, productoId, req.body.activo);
    if (!data) return enviarError(res, 404, "NOT_FOUND", "No se encontró la receta del producto.");
    return enviarDatos(res, data);
};

exports.nombresPerfiles = async (_req, res) => {
    if (!secretKeyConfigurada) return enviarError(res, 503, "ADMIN_KEY_REQUIRED", "La consulta de responsables no está configurada en el servidor.");
    const data = await service.listarNombresPerfiles(crearClienteAdministrador());
    return enviarDatos(res, data);
};

