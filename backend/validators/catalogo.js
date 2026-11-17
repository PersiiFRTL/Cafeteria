const sectores = ["Cocina", "Cafetería", "Pastelería"];
function productoValido(body) {
    return typeof body?.nombre === "string" && body.nombre.trim().length > 0 && body.nombre.trim().length <= 120 &&
        typeof body?.categoria === "string" && body.categoria.trim().length > 0 && body.categoria.trim().length <= 80 &&
        sectores.includes(body?.sector) && ["bajo_pedido", "preelaborado", "reventa"].includes(body?.tipoElaboracion) &&
        Number.isFinite(Number(body?.precio)) && Number(body.precio) >= 0;
}
function materiaPrimaValida(body) {
    return typeof body?.nombre === "string" && body.nombre.trim().length > 0 && body.nombre.trim().length <= 120 &&
        typeof body?.categoria === "string" && body.categoria.trim().length > 0 && body.categoria.trim().length <= 80 &&
        ["unidad", "kg", "litro"].includes(body?.unidad) && Number.isFinite(Number(body?.stockMinimo)) && Number(body.stockMinimo) >= 0;
}
module.exports = { productoValido, materiaPrimaValida, sectores };
