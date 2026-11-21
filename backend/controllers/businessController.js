const { enviarDatos, enviarError, mapearErrorSupabase } = require("../middlewares/responses");
const { idPositivo, paginacion, rangoFechas } = require("../validators/common");
const { ejecutarRpc } = require("../services/supabaseService");
const { listarMovimientos, listarProducciones, listarMovimientosDeProducciones } = require("../services/stockService");
const { validarMapa } = require("../validators/payloads");

async function ejecutar(req, res, rpc, params, message = "Operación completada.", status = 200) {
    try {
        const data = await ejecutarRpc(req.supabaseUsuario, rpc, params, message);
        return enviarDatos(res, data === null ? { mensaje: message } : data, status);
    } catch (error) {
        const mapped = error.status ? error : mapearErrorSupabase(error, message);
        return enviarError(res, mapped.status, mapped.code, mapped.message);
    }
}

function productosValidos(items) {
    return Array.isArray(items) && items.length > 0 && items.every((item) =>
        idPositivo(item?.productoId) && Number.isFinite(Number(item?.cantidad)) && Number(item.cantidad) > 0
    );
}

exports.crearComanda = (req, res) => {
    if (!productosValidos(req.body?.productos)) return enviarError(res, 400, "INVALID_ORDER", "La comanda debe incluir productos con cantidades mayores que cero.");
    if (req.body.mesaId !== null && req.body.mesaId !== undefined && !idPositivo(req.body.mesaId)) return enviarError(res, 400, "INVALID_TABLE_ID", "El ID de mesa no es válido.");
    const takeAway = req.body?.mesaId == null;
    if (takeAway && (!String(req.body?.clienteNombre ?? "").trim() || !req.body?.horaRetiro || Number.isNaN(Date.parse(req.body.horaRetiro)))) {
        return enviarError(res, 400, "INVALID_TAKEAWAY", "El nombre del cliente y el horario de retiro son obligatorios para take away.");
    }
    return ejecutar(req, res, "crear_comanda", {
        p_mesa_id: req.body?.mesaId ?? null,
        p_productos: req.body.productos.map(({ productoId, cantidad }) => ({ productoId: Number(productoId), cantidad: Number(cantidad) })),
        p_cliente_nombre: req.body?.clienteNombre ?? null,
        p_cliente_telefono: req.body?.clienteTelefono ?? null,
        p_hora_retiro: req.body?.horaRetiro ?? null
    }, "Comanda creada.", 201);
};

exports.estadoMesa = (req, res) => {
    const id = idPositivo(req.params.id);
    const estado = req.body?.estado;
    if (!id || !["libre", "ocupada"].includes(estado)) return enviarError(res, 400, "INVALID_TABLE_STATE", "El ID o el estado de la mesa no son válidos.");
    return ejecutar(req, res, "cambiar_estado_mesa_manual", { p_mesa_id: id, p_estado: estado }, "Estado de mesa actualizado.");
};

exports.editarComanda = (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id || !productosValidos(req.body?.productos)) return enviarError(res, 400, "INVALID_ORDER", "El ID o los productos de la comanda no son válidos.");
    return ejecutar(req, res, "editar_comanda", { p_comanda_id: id, p_productos: req.body.productos }, "Comanda actualizada.");
};

exports.agregarProductos = (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id || !productosValidos(req.body?.productos)) return enviarError(res, 400, "INVALID_ORDER_ITEMS", "El ID o los productos agregados no son válidos.");
    return ejecutar(req, res, "agregar_productos_comanda", { p_comanda_id: id, p_productos: req.body.productos }, "Productos agregados a la comanda.");
};

exports.procesarStockComanda = (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID de comanda no es válido.");
    return ejecutar(req, res, "procesar_stock_comanda", { p_comanda_id: id }, "Stock de comanda procesado.");
};

exports.estadoItemComanda = (req, res) => {
    const comandaId = idPositivo(req.params.id);
    const productoId = idPositivo(req.params.productoId);
    const estado = req.body?.estado;
    if (!comandaId || !productoId) return enviarError(res, 400, "INVALID_ID", "Los IDs de comanda y producto deben ser enteros positivos.");
    if (!["preparando", "listo"].includes(estado)) return enviarError(res, 400, "INVALID_ITEM_STATE", "El estado es obligatorio y debe ser 'preparando' o 'listo'.");
    return ejecutar(req, res, "cambiar_estado_item_comanda", {
        p_comanda_id: comandaId, p_producto_id: productoId, p_estado: estado
    }, "Estado del producto actualizado.");
};

exports.finalizarComanda = (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID de comanda no es válido.");
    return ejecutar(req, res, "finalizar_comanda", { p_comanda_id: id }, "Comanda finalizada.");
};

exports.cancelarComanda = (req, res) => {
    const id = idPositivo(req.params.id);
    if (!id) return enviarError(res, 400, "INVALID_ID", "El ID de comanda no es válido.");
    return ejecutar(req, res, "cancelar_comanda", { p_comanda_id: id }, "Comanda cancelada.");
};

exports.movimientosStock = async (req, res) => {
    const page = paginacion({ ...req.query, limit: req.query.limit ?? "10" });
    const rango = rangoFechas(req.query);
    if (!page || !rango) return enviarError(res, 400, "INVALID_QUERY", "La paginación o el rango de fechas no son válidos.");
    if (req.query.tipo && !["produccion", "comanda", "entrada", "salida"].includes(req.query.tipo)) return enviarError(res, 400, "INVALID_TYPE", "El tipo de operación no es válido.");
    if (req.query.orden && !["recientes", "antiguos"].includes(req.query.orden)) return enviarError(res, 400, "INVALID_ORDER", "El orden debe ser 'recientes' o 'antiguos'.");
    const result = await listarMovimientos(req.supabaseUsuario, { ...rango, tipo: req.query.tipo, orden: req.query.orden }, page);
    const total = result.count ?? result.data.length;
    return enviarDatos(res, result.data, 200, { page: page.page, limit: page.limit, total, totalPages: Math.ceil(total / page.limit) });
};

exports.producciones = async (req, res) => {
    const page = paginacion({ ...req.query, limit: req.query.limit ?? "10" });
    const rango = rangoFechas(req.query);
    if (!page || !rango) return enviarError(res, 400, "INVALID_QUERY", "La paginación o el rango de fechas no son válidos.");
    if (req.query.orden && !["recientes", "antiguos"].includes(req.query.orden)) return enviarError(res, 400, "INVALID_ORDER", "El orden debe ser 'recientes' o 'antiguos'.");
    const result = await listarProducciones(req.supabaseUsuario, page, rango, req.query.orden);
    const movimientos = await listarMovimientosDeProducciones(req.supabaseUsuario, result.data.map((produccion) => produccion.id));
    const movimientosPorProduccion = new Map(movimientos.map((operacion) => [
        Number(operacion.produccion_id),
        (operacion.movimientos ?? [])
            .filter((movimiento) => movimiento.materia_prima_id !== null)
            .map((movimiento) => ({ materia_prima_id: movimiento.materia_prima_id, cantidad: movimiento.cantidad }))
    ]));
    const data = result.data.map((produccion) => ({
        ...produccion,
        ingredientes: movimientosPorProduccion.get(Number(produccion.id)) ?? []
    }));
    const total = result.count ?? result.data.length;
    return enviarDatos(res, data, 200, { page: page.page, limit: page.limit, total, totalPages: Math.ceil(total / page.limit) });
};

exports.registrarMovimiento = (req, res) => {
    const { materiaPrimaId, productoId, tipo, cantidad, descripcion } = req.body ?? {};
    const validReference = (materiaPrimaId == null) !== (productoId == null);
    if (!validReference || (materiaPrimaId != null && !idPositivo(materiaPrimaId)) || (productoId != null && !idPositivo(productoId)) ||
        !["entrada", "salida"].includes(tipo) || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0 ||
        (descripcion != null && (typeof descripcion !== "string" || descripcion.length > 240))) {
        return enviarError(res, 400, "INVALID_STOCK_MOVEMENT", "Indicá un solo artículo, un tipo de movimiento válido y una cantidad mayor que cero.");
    }
    return ejecutar(req, res, "registrar_movimiento_stock", {
        p_materia_prima_id: materiaPrimaId ?? null,
        p_producto_id: productoId ?? null,
        p_tipo: tipo,
        p_cantidad: Number(cantidad),
        p_descripcion: descripcion ?? null
    }, "Movimiento de stock registrado.", 201);
};

exports.registrarProduccion = (req, res) => {
    const productoId = idPositivo(req.body?.productoId);
    const cantidad = Number(req.body?.cantidad);
    if (!productoId || !Number.isFinite(cantidad) || cantidad <= 0) return enviarError(res, 400, "INVALID_PRODUCTION", "El producto y una cantidad mayor que cero son obligatorios.");
    return ejecutar(req, res, "registrar_produccion", { p_producto_id: productoId, p_cantidad: cantidad }, "Producción registrada.", 201);
};

exports.obtenerMapa = async (req, res) => {
    const [mesas, elementos] = await Promise.all([
        req.supabaseUsuario.from("mesas").select("*").order("numero"),
        req.supabaseUsuario.from("elementos_mapa").select("id,tipo,x,y,ancho,alto,rotacion,mesa_id,grosor,mesa:mesas(capacidad)").order("id")
    ]);
    if (mesas.error) { const mapped = mapearErrorSupabase(mesas.error, "No se pudieron cargar las mesas."); return enviarError(res, mapped.status, mapped.code, mapped.message); }
    if (elementos.error) { const mapped = mapearErrorSupabase(elementos.error, "No se pudo cargar el mapa."); return enviarError(res, mapped.status, mapped.code, mapped.message); }
    return enviarDatos(res, { mesas: mesas.data ?? [], elementos: elementos.data ?? [] });
};

exports.guardarMapa = (req, res) => {
    const { mesas, elementos, idsEliminar = [] } = req.body ?? {};
    if (!validarMapa(mesas, elementos, idsEliminar)) return enviarError(res, 400, "INVALID_MAP", "El mapa contiene mesas, elementos o IDs eliminados inválidos.");
    return ejecutar(req, res, "guardar_mapa", { p_mesas: mesas, p_elementos: elementos, p_ids_eliminar: idsEliminar }, "Mapa guardado.");
};

