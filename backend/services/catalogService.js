const { ejecutarConsulta } = require("./supabaseService");

async function ejecutarUnico(query, fallback) {
    const { data, error } = await query;
    if (error) throw Object.assign(new Error(error.message || fallback), error);
    return data;
}

const porId = (db, tabla, id, campos = "*") => ejecutarUnico(db.from(tabla).select(campos).eq("id", id).maybeSingle(), `No se encontró el recurso en ${tabla}.`);
const actualizar = (db, tabla, id, valores, campos = "*") => ejecutarUnico(db.from(tabla).update(valores).eq("id", id).select(campos).maybeSingle(), `No se pudo actualizar ${tabla}.`);

async function crearProducto(db, valores) { return ejecutarUnico(db.from("productos").insert(valores).select("*").single(), "No se pudo crear el producto."); }
async function eliminarProducto(db, id) { return ejecutarUnico(db.from("productos").delete().eq("id", id).select("id").maybeSingle(), "No se pudo eliminar el producto."); }
async function crearMateriaPrima(db, valores) {
    const { data: id, error } = await db.rpc("crear_materia_prima", valores);
    if (error) throw Object.assign(new Error(error.message), error);
    return porId(db, "materias_primas", Number(id));
}
async function guardarReceta(db, productoId, ingredientes) {
    const { data, error } = await db.rpc("guardar_receta", { p_producto_id: productoId, p_ingredientes: ingredientes });
    if (error) throw Object.assign(new Error(error.message), error);
    return { id: Number(data), productoId, ingredientes, reemplazoCompleto: true };
}
async function cambiarEstadoReceta(db, productoId, activo) {
    return ejecutarUnico(db.from("recetas").update({ activo }).eq("producto_id", productoId)
        .select("id,producto_id,activo").maybeSingle(), "No se pudo actualizar el estado de la receta.");
}
async function listarNombresPerfiles(db) {
    const { data, error } = await db.from("perfiles").select("id,nombre").eq("activo", true).order("nombre");
    if (error) throw Object.assign(new Error(error.message), error);
    return data ?? [];
}

async function listarProductos(db, filters, page) {
    let query = db.from("productos").select("id,nombre,precio,categoria,sector,tipo_elaboracion,unidad_venta,stock_actual,stock_minimo,activo,disponible", { count: "exact" }).order("nombre").range(page.from, page.to);
    if (filters.activo !== undefined) query = query.eq("activo", filters.activo);
    if (filters.disponible !== undefined) query = query.eq("disponible", filters.disponible);
    if (filters.sector) query = query.eq("sector", filters.sector);
    if (filters.tipoElaboracion) query = query.eq("tipo_elaboracion", filters.tipoElaboracion);
    return ejecutarConsulta(query, "No se pudieron cargar los productos.");
}

async function obtenerPorId(db, tabla, id, campos = "*") {
    const { data, error } = await db.from(tabla).select(campos).eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
}

async function listarMateriasPrimas(db, activo, page) {
    let query = db.from("materias_primas").select("id,nombre,categoria,unidad,stock_actual,stock_minimo,activo", { count: "exact" }).order("nombre").range(page.from, page.to);
    if (activo !== undefined) query = query.eq("activo", activo);
    return ejecutarConsulta(query, "No se pudieron cargar las materias primas.");
}

async function listarMesas(db, page) {
    const query = db.from("mesas").select("id,numero,capacidad,estado", { count: "exact" }).order("numero").range(page.from, page.to);
    return ejecutarConsulta(query, "No se pudieron cargar las mesas.");
}

async function listarComandas(db, filters, page) {
    let query = db.from("comandas").select("id,tipo_atencion,mesa_id,cliente_nombre,cliente_telefono,hora_retiro,creada_por,estado,fecha_creacion,productos:comanda_items(producto_id,nombre_producto,precio_unitario,cantidad,estado,cantidad_stock_procesada)", { count: "exact" })
        .order("fecha_creacion", { ascending: false }).range(page.from, page.to);
    if (filters.estado) query = query.eq("estado", filters.estado);
    if (filters.mesaId) query = query.eq("mesa_id", filters.mesaId);
    if (filters.desde) query = query.gte("fecha_creacion", filters.desde);
    if (filters.hastaExclusiva) query = query.lt("fecha_creacion", filters.hastaExclusiva);
    return ejecutarConsulta(query, "No se pudieron cargar las comandas.");
}

async function obtenerComanda(db, id) {
    const { data, error } = await db.from("comandas").select("id,tipo_atencion,mesa_id,cliente_nombre,cliente_telefono,hora_retiro,creada_por,estado,fecha_creacion,productos:comanda_items(producto_id,nombre_producto,precio_unitario,cantidad,estado,cantidad_stock_procesada)").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
}

async function listarRecetas(db, page) {
    const query = db.from("recetas").select("id, producto_id, activo, ingredientes:receta_ingredientes(materia_prima_id,cantidad)", { count: "exact" })
        .order("id").range(page.from, page.to);
    return ejecutarConsulta(query, "No se pudieron cargar las recetas.");
}

async function obtenerReceta(db, productoId) {
    const { data, error } = await db.from("recetas").select("id,producto_id,activo,ingredientes:receta_ingredientes(materia_prima_id,cantidad)")
        .eq("producto_id", productoId).maybeSingle();
    if (error) throw error;
    return data;
}

module.exports = { listarProductos, obtenerPorId, listarMateriasPrimas, listarMesas, listarComandas, obtenerComanda, listarRecetas, obtenerReceta,
    porId, actualizar, crearProducto, eliminarProducto, crearMateriaPrima, guardarReceta, cambiarEstadoReceta, listarNombresPerfiles };
