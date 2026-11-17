const ID_POSITIVO = /^[1-9]\d*$/;
const ISO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function idPositivo(value) {
    if (!ID_POSITIVO.test(String(value ?? ""))) return null;
    const number = Number(value);
    return Number.isSafeInteger(number) ? number : null;
}

function paginacion(query) {
    if ((query.page !== undefined && !/^\d+$/.test(String(query.page))) || (query.limit !== undefined && !/^\d+$/.test(String(query.limit)))) return null;
    const page = Number.parseInt(query.page ?? "1", 10);
    const limit = Number.parseInt(query.limit ?? "20", 10);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return null;
    return { page, limit, from: (page - 1) * limit, to: page * limit - 1 };
}

function fechaValida(value) {
    if (typeof value !== "string" || !ISO_FECHA.test(value)) return false;
    const fecha = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === value;
}

function rangoFechas(query) {
    if ((query.desde && !fechaValida(query.desde)) || (query.hasta && !fechaValida(query.hasta))) return null;
    if (query.desde && query.hasta && query.desde > query.hasta) return null;
    return {
        desde: query.desde ? new Date(`${query.desde}T00:00:00.000Z`).toISOString() : null,
        hastaExclusiva: query.hasta ? new Date(Date.parse(`${query.hasta}T00:00:00.000Z`) + 86400000).toISOString() : null
    };
}

module.exports = { idPositivo, paginacion, fechaValida, rangoFechas };
