import { useCafeteria } from "./CafeteriaContext";

/** Acceso al estado y acciones que usa el área de comandas. */
export function useComandas() {
    const cafeteria = useCafeteria();
    return {
        mesas: cafeteria.mesas,
        elementosMapa: cafeteria.elementosMapa,
        comandas: cafeteria.comandas,
        productos: cafeteria.productos,
        crearComanda: cafeteria.crearComanda,
        finalizarComanda: cafeteria.finalizarComanda,
        cancelarComanda: cafeteria.cancelarComanda,
        agregarProductosAComanda: cafeteria.agregarProductosAComanda,
        obtenerComandaDeMesa: cafeteria.obtenerComandaDeMesa,
        cambiarEstadoProducto: cafeteria.cambiarEstadoProducto,
        editarComanda: cafeteria.editarComanda,
        procesarStockComanda: cafeteria.procesarStockComanda
    };
}
