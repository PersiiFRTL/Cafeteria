const { mapearErrorSupabase } = require("../middlewares/responses");

async function ejecutarRpc(cliente, nombre, parametros, fallback) {
    const { data, error } = await cliente.rpc(nombre, parametros);
    if (error) throw Object.assign(new Error(mapearErrorSupabase(error, fallback).message), mapearErrorSupabase(error, fallback));
    return data;
}

async function ejecutarConsulta(query, fallback = "No se pudo consultar la información.") {
    const { data, error, count } = await query;
    if (error) throw Object.assign(new Error(mapearErrorSupabase(error, fallback).message), mapearErrorSupabase(error, fallback));
    return { data: data ?? [], count };
}

module.exports = { ejecutarRpc, ejecutarConsulta };
