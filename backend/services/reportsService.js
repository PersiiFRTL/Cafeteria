async function obtenerVentas(db, desde, hastaExclusiva) {
    let query = db.from("comandas")
        .select("id,estado,fecha_creacion,fecha_finalizacion,productos:comanda_items(producto_id,nombre_producto,precio_unitario,cantidad)")
        .gte("fecha_creacion", desde).lt("fecha_creacion", hastaExclusiva)
        .order("fecha_creacion", { ascending: true });
    const { data, error } = await query;
    if (error) throw error;

    const comandas = data ?? [];
    const finalizadas = comandas.filter((comanda) => comanda.estado === "finalizada");
    const ranking = new Map();
    const dias = new Map();
    let productosVendidos = 0;
    let ventasEstimadas = 0;

    for (const comanda of finalizadas) {
        const dia = String(comanda.fecha_creacion).slice(0, 10);
        const acumulado = dias.get(dia) || { fecha: dia, comandas: 0, ventas: 0 };
        acumulado.comandas += 1;
        for (const item of comanda.productos ?? []) {
            const cantidad = Number(item.cantidad);
            const venta = cantidad * Number(item.precio_unitario);
            productosVendidos += cantidad;
            ventasEstimadas += venta;
            acumulado.ventas += venta;
            const productId = Number(item.producto_id);
            const producto = ranking.get(productId) || {
                productoId: productId,
                nombre: item.nombre_producto,
                cantidad: 0,
                ventas: 0
            };
            producto.cantidad += cantidad;
            producto.ventas += venta;
            ranking.set(productId, producto);
        }
        dias.set(dia, acumulado);
    }

    return {
        totalComandas: comandas.length,
        comandasFinalizadas: finalizadas.length,
        productosVendidos,
        ventasEstimadas: Number(ventasEstimadas.toFixed(2)),
        productosMasVendidos: [...ranking.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 10),
        ventasPorDia: [...dias.values()].sort((a, b) => a.fecha.localeCompare(b.fecha))
    };
}

module.exports = { obtenerVentas };
