import { useCafeteria } from "./CafeteriaContext";

/** Acceso acotado a administración de personal. */
export function usePersonal() {
    const cafeteria = useCafeteria();
    return {
        empleados: cafeteria.empleados,
        agregarEmpleado: cafeteria.agregarEmpleado,
        editarEmpleado: cafeteria.editarEmpleado,
        cambiarEstadoEmpleado: cafeteria.cambiarEstadoEmpleado
    };
}
