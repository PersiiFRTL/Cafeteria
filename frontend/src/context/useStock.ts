import { useCafeteria } from "./CafeteriaContext";

/** Acceso a inventario, movimientos y producción. */
export function useStock() {
    const cafeteria = useCafeteria();
    return {
        productos: cafeteria.productos,
        materiasPrimas: cafeteria.materiasPrimas,
        recetas: cafeteria.recetas,
        producciones: cafeteria.producciones,
        movimientosStock: cafeteria.movimientosStock,
        operacionesStock: cafeteria.operacionesStock,
        registrarProduccion: cafeteria.registrarProduccion,
        registrarEntradaMateriaPrima: cafeteria.registrarEntradaMateriaPrima,
        registrarSalidaMateriaPrima: cafeteria.registrarSalidaMateriaPrima,
        editarMateriaPrima: cafeteria.editarMateriaPrima,
        cambiarEstadoMateriaPrima: cafeteria.cambiarEstadoMateriaPrima,
        agregarMateriaPrima: cafeteria.agregarMateriaPrima
    };
}
