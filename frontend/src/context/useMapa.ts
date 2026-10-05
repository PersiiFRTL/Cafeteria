import { useCafeteria } from "./CafeteriaContext";

/** Estado y acciones del editor del plano del local. */
export function useMapa() {
    const cafeteria = useCafeteria();
    return {
        mesas: cafeteria.mesas,
        elementosMapa: cafeteria.elementosMapa,
        agregarElementoMapa: cafeteria.agregarElementoMapa,
        editarElementoMapa: cafeteria.editarElementoMapa,
        eliminarElementoMapa: cafeteria.eliminarElementoMapa
    };
}
