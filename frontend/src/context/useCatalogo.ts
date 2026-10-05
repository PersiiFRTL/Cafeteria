import { useCafeteria } from "./CafeteriaContext";

/** Acceso a productos, materias primas y recetas para las vistas de catálogo. */
export function useCatalogo() {
    const cafeteria = useCafeteria();
    return {
        productos: cafeteria.productos,
        materiasPrimas: cafeteria.materiasPrimas,
        recetas: cafeteria.recetas,
        agregarProducto: cafeteria.agregarProducto,
        editarProducto: cafeteria.editarProducto,
        eliminarProductoCatalogo: cafeteria.eliminarProductoCatalogo,
        cambiarEstadoProductoCatalogo: cafeteria.cambiarEstadoProductoCatalogo,
        agregarReceta: cafeteria.agregarReceta,
        editarReceta: cafeteria.editarReceta
    };
}
