const { ejecutarConsulta } = require("./supabaseService");

async function listarMovimientos(db, filters, page) {
    const ascendente = filters.orden === "antiguos";
    let query = db.from("operaciones_stock").select("id,tipo,comanda_id,produccion_id,fecha,descripcion,creada_por,movimientos:movimientos_stock(id,tipo,materia_prima_id,producto_id,cantidad,fecha,descripcion)", { count: "exact" })
        .order("fecha", { ascending: ascendente }).order("id", { ascending: ascendente }).range(page.from, page.to);
    if (filters.desde) query = query.gte("fecha", filters.desde);
    if (filters.hastaExclusiva) query = query.lt("fecha", filters.hastaExclusiva);
    if (filters.tipo) query = query.eq("tipo", filters.tipo);
    return ejecutarConsulta(query, "No se pudieron cargar los movimientos de stock.");
}

async function listarProducciones(db, page, rango, orden = "recientes") {
    const ascendente = orden === "antiguos";
    let query = db.from("producciones").select("id,producto_id,cantidad,fecha,creada_por", { count: "exact" })
        .order("fecha", { ascending: ascendente }).order("id", { ascending: ascendente }).range(page.from, page.to);
    if (rango.desde) query = query.gte("fecha", rango.desde);
    if (rango.hastaExclusiva) query = query.lt("fecha", rango.hastaExclusiva);
    return ejecutarConsulta(query, "No se pudieron cargar las producciones.");
}

async function listarMovimientosDeProducciones(db, produccionIds) {
    if (produccionIds.length === 0) return [];
    const result = await ejecutarConsulta(
        db.from("operaciones_stock")
            .select("produccion_id,movimientos:movimientos_stock(id,materia_prima_id,cantidad)")
            .in("produccion_id", produccionIds),
        "No se pudo cargar el detalle de consumo de las producciones."
    );
    return result.data;
}

module.exports = { listarMovimientos, listarProducciones, listarMovimientosDeProducciones };
