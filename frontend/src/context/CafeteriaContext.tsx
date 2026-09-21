import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";

import mesasData from "../data/mesas.json";
import productosData from "../data/productos.json";


// ==========================
// TIPOS
// ==========================

interface Mesa {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    sector: string;
    activo: boolean;
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
    fechaCreacion: string;
}


// ==========================
// CONTEXT
// ==========================

interface CafeteriaContextType {

    // Mesas
    mesas: Mesa[];

    // Comandas
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


    // Productos
    productos: Producto[];

    agregarProducto: (
        nombre: string,
        precio: number,
        sector: string
    ) => void;

    editarProducto: (
        id: number,
        nombre: string,
        precio: number,
        sector: string
    ) => void;

    cambiarEstadoProductoCatalogo: (
        id: number,
        activo: boolean
    ) => void;
}


// ==========================
// CREAR CONTEXT
// ==========================

const CafeteriaContext =
    createContext<CafeteriaContextType | undefined>(undefined);


// ==========================
// PROVIDER
// ==========================

export function CafeteriaProvider({
    children
}: {
    children: ReactNode;
}) {


    // ==========================
    // MESAS
    // ==========================

    const [mesas, setMesas] =
        useState<Mesa[]>(mesasData);


    // ==========================
    // COMANDAS
    // ==========================

    const [comandas, setComandas] =
        useState<Comanda[]>([]);


    // Crear una nueva comanda

    const crearComanda = (
        mesaId: number,
        productos: ProductoComanda[]
    ) => {

        const nuevaComanda: Comanda = {

            id: comandas.length + 1,

            mesaId: mesaId,

            productos: productos,

            estado: "pendiente",

            fechaCreacion: new Date().toISOString()
        };


        setComandas((comandasActuales) => [
            ...comandasActuales,
            nuevaComanda
        ]);


        // Cambiar mesa a ocupada

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


    // Obtener la comanda activa de una mesa

    const obtenerComandaDeMesa = (
        mesaId: number
    ) => {

        return comandas.find(
            (comanda) =>
                comanda.mesaId === mesaId &&
                comanda.estado !== "finalizada"
        );

    };


    // Calcular estado general de una comanda

    const calcularEstadoComanda = (
        productos: ProductoComanda[]
    ): Comanda["estado"] => {

        if (productos.length === 0) {
            return "pendiente";
        }


        // Si todos están listos

        if (
            productos.every(
                (producto) =>
                    producto.estado === "listo"
            )
        ) {
            return "lista";
        }


        // Si al menos uno está preparando

        if (
            productos.some(
                (producto) =>
                    producto.estado === "preparando"
            )
        ) {
            return "preparando";
        }


        // Si todavía ninguno empezó

        return "pendiente";
    };


    // Cambiar estado de un producto
    // dentro de una comanda

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


                const productosActualizados =
                    comanda.productos.map(
                        (producto) =>

                            producto.productoId === productoId
                                ? {
                                    ...producto,
                                    estado: estado
                                }
                                : producto
                    );


                return {

                    ...comanda,

                    productos:
                        productosActualizados,

                    estado:
                        calcularEstadoComanda(
                            productosActualizados
                        )
                };

            })

        );
    };


    // ==========================
    // PRODUCTOS
    // ==========================

    const [productos, setProductos] =
        useState<Producto[]>(

            productosData.map((producto) => ({

                ...producto,

                activo: true

            }))

        );


    // Agregar producto

    const agregarProducto = (
        nombre: string,
        precio: number,
        sector: string
    ) => {

        const nuevoProducto: Producto = {

            id: productos.length + 1,

            nombre: nombre,

            precio: precio,

            sector: sector,

            activo: true
        };


        setProductos(
            (productosActuales) => [

                ...productosActuales,

                nuevoProducto

            ]
        );
    };


    // Editar producto

    const editarProducto = (
        id: number,
        nombre: string,
        precio: number,
        sector: string
    ) => {

        setProductos(
            (productosActuales) =>

                productosActuales.map(
                    (producto) =>

                        producto.id === id

                            ? {
                                ...producto,

                                nombre: nombre,

                                precio: precio,

                                sector: sector
                            }

                            : producto
                )
        );
    };


    // Activar / desactivar producto

    const cambiarEstadoProductoCatalogo = (
        id: number,
        activo: boolean
    ) => {

        setProductos(
            (productosActuales) =>

                productosActuales.map(
                    (producto) =>

                        producto.id === id

                            ? {
                                ...producto,

                                activo: activo
                            }

                            : producto
                )
        );
    };


    // ==========================
    // PROVIDER
    // ==========================

    return (

        <CafeteriaContext.Provider
            value={{

                // Mesas
                mesas,


                // Comandas
                comandas,

                crearComanda,

                obtenerComandaDeMesa,

                cambiarEstadoProducto,


                // Productos
                productos,

                agregarProducto,

                editarProducto,

                cambiarEstadoProductoCatalogo

            }}
        >

            {children}

        </CafeteriaContext.Provider>

    );
}


// ==========================
// HOOK
// ==========================

export function useCafeteria() {

    const context =
        useContext(CafeteriaContext);


    if (!context) {

        throw new Error(
            "useCafeteria debe utilizarse dentro de CafeteriaProvider"
        );

    }


    return context;
}