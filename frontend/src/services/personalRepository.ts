import { solicitarApiAutenticada } from "./apiAutenticada";

export type RolPersonal = string;

export interface RolPersistido {
    nombre: string;
    descripcion: string;
    permisos: Record<string, { ver: boolean; interactuar: boolean }>;
    sistema: boolean;
}

export interface EmpleadoPersistido {
    id: string;
    nombre: string;
    email: string;
    rol: RolPersonal;
    activo: boolean;
}

export const repositorioPersonal = {
    async listarRoles(): Promise<RolPersistido[]> {
        const respuesta = await solicitarApiAutenticada<{ data: RolPersistido[] }>("/api/roles");
        return respuesta.data;
    },

    async crearRol(rol: Pick<RolPersistido, "nombre" | "descripcion" | "permisos">): Promise<RolPersistido> {
        const respuesta = await solicitarApiAutenticada<{ data: RolPersistido }>("/api/roles", {
            method: "POST", body: JSON.stringify(rol)
        });
        return respuesta.data;
    },

    async listar(): Promise<EmpleadoPersistido[]> {
        const respuesta = await solicitarApiAutenticada<{ data: EmpleadoPersistido[] }>("/api/empleados");
        return respuesta.data;
    },

    async crear(empleado: {
        nombre: string;
        email: string;
        password: string;
        rol: RolPersonal;
    }): Promise<EmpleadoPersistido> {
        const respuesta = await solicitarApiAutenticada<{ data: EmpleadoPersistido }>("/api/empleados", {
            method: "POST",
            body: JSON.stringify(empleado)
        });
        return respuesta.data;
    },

    async editar(id: string, empleado: {
        nombre: string;
        email: string;
        password?: string;
        rol: RolPersonal;
    }): Promise<EmpleadoPersistido> {
        const respuesta = await solicitarApiAutenticada<{ data: EmpleadoPersistido }>(`/api/empleados/${id}`, {
            method: "PATCH",
            body: JSON.stringify(empleado)
        });
        return respuesta.data;
    },

    async cambiarEstado(id: string, activo: boolean): Promise<EmpleadoPersistido> {
        const respuesta = await solicitarApiAutenticada<{ data: EmpleadoPersistido }>(`/api/empleados/${id}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ activo })
        });
        return respuesta.data;
    }
};
