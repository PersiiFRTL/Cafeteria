import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";

import mesasData from "../data/mesas.json";

interface Mesa {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

interface ProductoComanda {
    productoId: number;
    cantidad: number;
    estado: "pendiente" | "preparando" | "listo";
}

interface Comanda {
    id: number;
    mesaId: number;
    productos: ProductoComanda[];
    estado: "pendiente" | "preparando" | "lista" | "finalizada";
}

interface CafeteriaContextType {
    mesas: Mesa[];
    comandas: Comanda[];

    crearComanda: (
        mesaId: number,
        productos: ProductoComanda[]
    ) => void;

    obtenerComandaDeMesa: (
        mesaId: number
    ) => Comanda | undefined;

    cambiarEstadoProducto: (
    comandaId: number,
    productoId: number,
    estado: "pendiente" | "preparando" | "listo"
) => void;

}

const CafeteriaContext =
    createContext<CafeteriaContextType | undefined>(undefined);

export function CafeteriaProvider({
    children
}: {
    children: ReactNode;
}) {

    const [mesas, setMesas] =
        useState<Mesa[]>(mesasData);

    const [comandas, setComandas] =
        useState<Comanda[]>([]);

    const crearComanda = (
        mesaId: number,
        productos: ProductoComanda[]
    ) => {

        const nuevaComanda: Comanda = {
            id: comandas.length + 1,
            mesaId: mesaId,
            productos: productos,
            estado: "pendiente"
        };

        setComandas((comandasActuales) => [
            ...comandasActuales,
            nuevaComanda
        ]);

        setMesas((mesasActuales) =>
            mesasActuales.map((mesa) =>
                mesa.id === mesaId
                    ? {
                        ...mesa,
                        estado: "ocupada"
                    }
                    : mesa
            )
        );
    };

    const obtenerComandaDeMesa = (mesaId: number) => {

        return comandas.find(
            (comanda) =>
                comanda.mesaId === mesaId &&
                comanda.estado !== "finalizada"
        );

    };

    const cambiarEstadoProducto = (
        comandaId: number,
        productoId: number,
        estado: "pendiente" | "preparando" | "listo"
    ) => {

        setComandas((comandasActuales) =>
            comandasActuales.map((comanda) => {

                if (comanda.id !== comandaId) {
                    return comanda;
                }

                return {
                    ...comanda,
                    productos: comanda.productos.map((producto) =>
                        producto.productoId === productoId
                            ? {
                                ...producto,
                                estado: estado
                            }
                            : producto
                    )
                };

            })
        );
    };

    return (
        <CafeteriaContext.Provider
            value={{
                mesas,
                comandas,
                crearComanda,
                obtenerComandaDeMesa,
                cambiarEstadoProducto
            }}
        >
            {children}
        </CafeteriaContext.Provider>
    );
}

export function useCafeteria() {

    const context = useContext(CafeteriaContext);

    if (!context) {
        throw new Error(
            "useCafeteria debe utilizarse dentro de CafeteriaProvider"
        );
    }

    return context;
}