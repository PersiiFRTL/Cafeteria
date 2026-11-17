function validarProducto(body) {
    return typeof body?.nombre === "string" && body.nombre.trim().length > 0 && body.nombre.trim().length <= 120 &&
        typeof body?.categoria === "string" && body.categoria.trim().length > 0 && body.categoria.trim().length <= 80 &&
        ["Cocina", "Cafetería", "Pastelería"].includes(body?.sector) &&
        ["bajo_pedido", "preelaborado", "reventa"].includes(body?.tipoElaboracion) &&
        Number.isFinite(Number(body?.precio)) && Number(body.precio) >= 0;
}

function validarMateriaPrima(body) {
    return typeof body?.nombre === "string" && body.nombre.trim().length > 0 && body.nombre.trim().length <= 120 &&
        typeof body?.categoria === "string" && body.categoria.trim().length > 0 && body.categoria.trim().length <= 80 &&
        ["unidad", "kg", "litro"].includes(body?.unidad) && Number.isFinite(Number(body?.stockMinimo)) && Number(body.stockMinimo) >= 0;
}

function validarReceta(ingredientes) {
    return Array.isArray(ingredientes) && ingredientes.every((item) => Number.isSafeInteger(Number(item?.materiaPrimaId)) &&
        Number(item.materiaPrimaId) > 0 && Number.isFinite(Number(item.cantidad)) && Number(item.cantidad) > 0);
}

module.exports = { validarProducto, validarMateriaPrima, validarReceta };
