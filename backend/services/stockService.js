const { ejecutarConsulta } = require("./supabaseService");

async function listarMovimientos(db, filters, page) {
    let query = db.from("operaciones_stock").select("*, movimientos:movimientos_stock(*)", { count: "exact" })
        .order("fecha", { ascending: false }).range(page.from, page.to);
    if (filters.desde) query = query.gte("fecha", filters.desde);
    if (filters.hastaExclusiva) query = query.lt("fecha", filters.hastaExclusiva);
    if (filters.tipo) query = query.eq("tipo", filters.tipo);
    return ejecutarConsulta(query, "No se pudieron cargar los movimientos de stock.");
}

async function listarProducciones(db, page, rango) {
    let query = db.from("producciones").select("*", { count: "exact" }).order("fecha", { ascending: false }).range(page.from, page.to);
    if (rango.desde) query = query.gte("fecha", rango.desde);
    if (rango.hastaExclusiva) query = query.lt("fecha", rango.hastaExclusiva);
    return ejecutarConsulta(query, "No se pudieron cargar las producciones.");
}

module.exports = { listarMovimientos, listarProducciones };
