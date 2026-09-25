export type RolEmpleado =
    | "ADMINISTRADOR"
    | "EMPLEADO"
    | "COCINA";


export type Modulo =
    | "dashboard"
    | "mesas"
    | "comandas"
    | "preparacion"
    | "productos"
    | "stock"
    | "recetas"
    | "produccion"
    | "empleados";


export const permisosPorRol: Record<
    RolEmpleado,
    Modulo[]
> = {

    ADMINISTRADOR: [
        "dashboard",
        "mesas",
        "comandas",
        "preparacion",
        "productos",
        "stock",
        "recetas",
        "produccion",
        "empleados"
    ],

    EMPLEADO: [
        "dashboard",
        "mesas",
        "comandas"
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