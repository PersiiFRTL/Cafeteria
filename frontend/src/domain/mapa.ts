import type { ElementoMapa } from "../types/mapa";

export const MAPA_TAMANO_CUADRICULA = 40;
export const MAPA_DIMENSION_MESA = { ancho: 2, alto: 2 };

export const obtenerDimensionesElementoMapa = (elemento: ElementoMapa) => {
    if (elemento.tipo === "linea") {
        return elemento.rotacion === 90
            ? {
                ancho: elemento.grosor ?? 4,
                alto: elemento.ancho * MAPA_TAMANO_CUADRICULA
            }
            : {
                ancho: elemento.ancho * MAPA_TAMANO_CUADRICULA,
                alto: elemento.grosor ?? 4
            };
    }

    return {
        ancho: MAPA_DIMENSION_MESA.ancho * MAPA_TAMANO_CUADRICULA,
        alto: MAPA_DIMENSION_MESA.alto * MAPA_TAMANO_CUADRICULA
    };
};
