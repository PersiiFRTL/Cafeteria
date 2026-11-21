export type RolEmpleado = string;


export type Modulo =
    | "dashboard"
    | "mesas"
    | "comandas"
    | "nueva-comanda"
    | "preparacion"
    | "productos"
    | "materias-primas"
    | "stock"
    | "recetas"
    | "produccion"
    | "empleados"
    |"mapa"
    |"informes";


export type PermisoModulo = { ver: boolean; interactuar: boolean };
export type PermisosRol = Partial<Record<Modulo, PermisoModulo>>;

export const tienePermiso = (permisos: PermisosRol | undefined, modulo: Modulo, accion: keyof PermisoModulo = "ver"): boolean =>
    permisos?.[modulo]?.[accion] === true;
