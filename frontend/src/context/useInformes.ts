import { useCafeteria } from "./CafeteriaContext";

/** Lecturas agregadas que necesita el área de informes. */
export function useInformes() {
    const cafeteria = useCafeteria();
    return {
        mesas: cafeteria.mesas,
        comandas: cafeteria.comandas,
        productos: cafeteria.productos,
        materiasPrimas: cafeteria.materiasPrimas,
        movimientosStock: cafeteria.movimientosStock
    };
}
