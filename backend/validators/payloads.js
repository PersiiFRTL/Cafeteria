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

function validarMapa(mesas, elementos, idsEliminar) {
    if (!Array.isArray(mesas) || !Array.isArray(elementos) || !Array.isArray(idsEliminar)) return false;
    const mesaIds = new Set();
    const numerosMesa = new Set();
    for (const mesa of mesas) {
        const id = Number(mesa?.id);
        const numero = Number(mesa?.numero);
        const capacidad = Number(mesa?.capacidad);
        if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(numero) || numero <= 0
            || !Number.isSafeInteger(capacidad) || capacidad <= 0 || mesaIds.has(id) || numerosMesa.has(numero)) return false;
        mesaIds.add(id);
        numerosMesa.add(numero);
    }
    const elementoIds = new Set();
    const mesasAsignadas = new Set();
    for (const elemento of elementos) {
        if (!elemento || typeof elemento.id !== "string" || !elemento.id.trim() || elemento.id.length > 120
            || !["mesa", "linea"].includes(elemento.tipo) || elementoIds.has(elemento.id)) return false;
        elementoIds.add(elemento.id);
        const valores = [elemento.x, elemento.y, elemento.ancho, elemento.alto, elemento.rotacion];
        if (valores.some((valor) => typeof valor !== "number" || !Number.isFinite(valor))
            || Math.abs(elemento.x) > 99999999 || Math.abs(elemento.y) > 99999999
            || elemento.ancho <= 0 || elemento.ancho > 99999999 || elemento.alto <= 0 || elemento.alto > 99999999
            || Math.abs(elemento.rotacion) > 99999.99) return false;
        const mesaId = elemento.mesaId == null ? null : Number(elemento.mesaId);
        const grosor = elemento.grosor == null ? null : Number(elemento.grosor);
        if (elemento.tipo === "mesa") {
            if (!Number.isSafeInteger(mesaId) || !mesaIds.has(mesaId) || grosor !== null || mesasAsignadas.has(mesaId)) return false;
            mesasAsignadas.add(mesaId);
        } else if (mesaId !== null || (grosor !== null && (!Number.isFinite(grosor) || grosor <= 0 || grosor > 99999999))) {
            return false;
        }
    }
    return idsEliminar.every((id) => typeof id === "string" && id.trim().length > 0 && id.length <= 120)
        && new Set(idsEliminar).size === idsEliminar.length;
}

module.exports = { validarProducto, validarMateriaPrima, validarReceta, validarMapa };
