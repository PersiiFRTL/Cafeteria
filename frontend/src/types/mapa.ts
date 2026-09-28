export type TipoElementoMapa =
    | "mesa"
    | "linea";

export interface ElementoMapa {
    id: string;
    tipo: TipoElementoMapa;

    x: number;
    y: number;

    ancho: number;
    alto: number;

    rotacion: number;

    mesaId?: number;
    grosor?: number;
}