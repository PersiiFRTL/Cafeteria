export type RolEmpleado =
    | "ADMINISTRADOR"
    | "EMPLEADO"
    | "COCINA";


export type Modulo =
    | "dashboard"
    | "mesas"
    | "comandas"
    | "nueva-comanda"
    | "preparacion"
    | "productos"
    | "stock"
    | "recetas"
    | "produccion"
    | "empleados"
    |"mapa"
    |"informes";


export const permisosPorRol: Record<
    RolEmpleado,
    Modulo[]
> = {

    ADMINISTRADOR: [
        "dashboard",
        "mesas",
        "comandas",
        "nueva-comanda",
        "preparacion",
        "productos",
        "stock",
        "recetas",
        "produccion",
        "empleados",
        "mapa",
        "informes"
    ],

    EMPLEADO: [
        "dashboard",
        "mesas",
        "comandas",
        "nueva-comanda"
    ],

    COCINA: [
        "dashboard",
        "preparacion"
    ]

};


export const tienePermiso = (
    rol: RolEmpleado,
    modulo: Modulo
): boolean => {

    return permisosPorRol[rol].includes(
        modulo
    );

};
