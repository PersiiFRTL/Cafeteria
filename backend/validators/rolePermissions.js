const MODULOS = [
    "dashboard", "mesas", "comandas", "nueva-comanda", "preparacion", "productos",
    "materias-primas", "stock", "produccion", "recetas", "mapa", "informes", "empleados"
];

function validarPermisos(permisos) {
    if (!permisos || typeof permisos !== "object" || Array.isArray(permisos)) return null;
    if (Object.keys(permisos).length !== MODULOS.length || MODULOS.some((modulo) => !(modulo in permisos))) return null;
    const normalizados = {};
    for (const modulo of MODULOS) {
        const permiso = permisos[modulo];
        if (!permiso || typeof permiso !== "object" || Array.isArray(permiso)
            || Object.keys(permiso).length !== 2
            || typeof permiso.ver !== "boolean" || typeof permiso.interactuar !== "boolean") return null;
        normalizados[modulo] = { ver: permiso.ver || permiso.interactuar, interactuar: permiso.interactuar };
    }
    return normalizados;
}

module.exports = { MODULOS, validarPermisos };
