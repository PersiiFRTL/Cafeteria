import { useCafeteria } from "./CafeteriaContext";

/** Resumen de lecturas que necesita el panel principal. */
export function useDashboard() {
    const cafeteria = useCafeteria();
    return {
        mesas: cafeteria.mesas,
        comandas: cafeteria.comandas,
        productos: cafeteria.productos,
        materiasPrimas: cafeteria.materiasPrimas
    };
}
