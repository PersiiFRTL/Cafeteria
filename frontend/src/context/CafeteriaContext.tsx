import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";

import mesasData from "../data/mesas.json";
import productosData from "../data/productos.json";
import stockData from "../data/stock.json";


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

interface Insumo {
    id: number;
    nombre: string;
    unidad: string;
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
}

interface MovimientoStock {
    id: number;
    insumoId: number;
    tipo: "entrada" | "salida";
    cantidad: number;
    fecha: string;
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

    // ==========================
    // MESAS
    // ==========================

    mesas: Mesa[];

    // ==========================
    // COMANDAS
    // ==========================

    comandas: Comanda[];

    crearComanda: (
        mesaId: number,
        productos: ProductoComanda[]
    ) => void;

    finalizarComanda: (
        comandaId: number
    ) => void;

    agregarProductosAComanda: (
        comandaId: number,
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

    // ==========================
    // PRODUCTOS
    // ==========================

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

    // ==========================
    // STOCK
    // ==========================

    insumos: Insumo[];

    cambiarEstadoInsumo: (
        id: number,
        activo: boolean
    ) => void;

    registrarEntradaStock: (
        insumoId: number,
        cantidad: number
    ) => void;

    registrarSalidaStock: (
        insumoId: number,
        cantidad: number
    ) => void;



    movimientosStock: MovimientoStock[];

    registrarMovimientoStock: (
        insumoId: number,
        tipo: "entrada" | "salida",
        cantidad: number
    ) => void;
}


// ==========================
// CREAR CONTEXT
// ==========================

const CafeteriaContext =
    createContext<CafeteriaContextType | undefined>(
        undefined
    );


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


    // ==========================
    // STOCK
    // ==========================

    const [insumos, setInsumos] =
        useState<Insumo[]>(stockData);


    // ==========================
    // MOVIMIENTOS DE STOCK
    // ==========================

    const [movimientosStock, setMovimientosStock] =
        useState<MovimientoStock[]>([]);


    // ==========================
    // CREAR COMANDA
    // ==========================

    const crearComanda = (
        mesaId: number,
        productos: ProductoComanda[]
    ) => {

        const nuevaComanda: Comanda = {

            id: comandas.length + 1,

            mesaId: mesaId,

            productos: productos,

            estado: "pendiente",

            fechaCreacion:
                new Date().toISOString()
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


    // ==========================
    // FINALIZAR COMANDA
    // ==========================

    const finalizarComanda = (
        comandaId: number
    ) => {

        const comanda = comandas.find(
            (comanda) =>
                comanda.id === comandaId
        );


        if (!comanda) {
            return;
        }


        // Marcar comanda como finalizada

        setComandas((comandasActuales) =>
            comandasActuales.map(
                (comandaActual) =>
                    comandaActual.id === comandaId
                        ? {
                            ...comandaActual,
                            estado: "finalizada"
                        }
                        : comandaActual
            )
        );


        // Liberar mesa

        setMesas((mesasActuales) =>
            mesasActuales.map((mesa) =>
                mesa.id === comanda.mesaId
                    ? {
                        ...mesa,
                        estado: "libre"
                    }
                    : mesa
            )
        );
    };


    // ==========================
    // AGREGAR PRODUCTOS
    // A UNA COMANDA
    // ==========================

    const agregarProductosAComanda = (
        comandaId: number,
        productosNuevos: ProductoComanda[]
    ) => {

        setComandas((comandasActuales) =>
            comandasActuales.map((comanda) => {

                if (comanda.id !== comandaId) {
                    return comanda;
                }


                const productosActualizados =
                    [...comanda.productos];


                productosNuevos.forEach(
                    (productoNuevo) => {

                        const productoExistente =
                            productosActualizados.find(
                                (producto) =>
                                    producto.productoId ===
                                    productoNuevo.productoId
                            );


                        if (productoExistente) {

                            productoExistente.cantidad +=
                                productoNuevo.cantidad;

                            productoExistente.estado =
                                "pendiente";

                            return;
                        }


                        productosActualizados.push(
                            productoNuevo
                        );
                    }
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
    // OBTENER COMANDA DE MESA
    // ==========================

    const obtenerComandaDeMesa = (
        mesaId: number
    ) => {

        return comandas.find(
            (comanda) =>
                comanda.mesaId === mesaId &&
                comanda.estado !== "finalizada"
        );
    };


    // ==========================
    // CALCULAR ESTADO COMANDA
    // ==========================

    const calcularEstadoComanda = (
        productos: ProductoComanda[]
    ): Comanda["estado"] => {

        if (productos.length === 0) {
            return "pendiente";
        }


        // Todos los productos están listos

        if (
            productos.every(
                (producto) =>
                    producto.estado === "listo"
            )
        ) {
            return "lista";
        }


        // Al menos uno está preparando

        if (
            productos.some(
                (producto) =>
                    producto.estado === "preparando"
            )
        ) {
            return "preparando";
        }


        // Todavía ninguno empezó

        return "pendiente";
    };


    // ==========================
    // CAMBIAR ESTADO PRODUCTO
    // ==========================

    const cambiarEstadoProducto = (
        comandaId: number,
        productoId: number,
        estado:
            | "pendiente"
            | "preparando"
            | "listo"
    ) => {

        setComandas((comandasActuales) =>

            comandasActuales.map((comanda) => {

                if (comanda.id !== comandaId) {
                    return comanda;
                }


                const productosActualizados =
                    comanda.productos.map(
                        (producto) =>

                            producto.productoId ===
                            productoId

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

            productosData.map(
                (producto) => ({

                    ...producto,

                    activo: true

                })
            )

        );


    // ==========================
    // AGREGAR PRODUCTO
    // ==========================

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


    // ==========================
    // EDITAR PRODUCTO
    // ==========================

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


    // ==========================
    // ACTIVAR / DESACTIVAR
    // PRODUCTO
    // ==========================

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
    // ACTIVAR / DESACTIVAR
    // INSUMO
    // ==========================

    const cambiarEstadoInsumo = (
        id: number,
        activo: boolean
    ) => {

        setInsumos(
            (insumosActuales) =>

                insumosActuales.map(
                    (insumo) =>

                        insumo.id === id

                            ? {
                                ...insumo,

                                activo: activo
                            }

                            : insumo
                )
        );
    };


    // ==========================
    // ENTRADA DE STOCK
    // ==========================

    const registrarEntradaStock = (
        insumoId: number,
        cantidad: number
    ) => {

        setInsumos(
            (insumosActuales) =>

                insumosActuales.map(
                    (insumo) =>

                        insumo.id === insumoId

                            ? {
                                ...insumo,

                                stockActual:
                                    insumo.stockActual +
                                    cantidad
                            }

                            : insumo
                )
        );
    };


    // ==========================
    // SALIDA DE STOCK
    // ==========================

    const registrarSalidaStock = (
        insumoId: number,
        cantidad: number
    ) => {

        setInsumos(
            (insumosActuales) =>

                insumosActuales.map(
                    (insumo) =>

                        insumo.id === insumoId

                            ? {
                                ...insumo,

                                stockActual:
                                    Math.max(
                                        0,
                                        insumo.stockActual -
                                        cantidad
                                    )
                            }

                            : insumo
                )
        );
    };


    const registrarMovimientoStock = (
        insumoId: number,
        tipo: "entrada" | "salida",
        cantidad: number
    ) => {

        if (cantidad <= 0) {
            return;
        }

        if (tipo === "entrada") {

            registrarEntradaStock(
                insumoId,
                cantidad
            );

        } else {

            registrarSalidaStock(
                insumoId,
                cantidad
            );
        }


        const nuevoMovimiento: MovimientoStock = {

            id: movimientosStock.length + 1,

            insumoId: insumoId,

            tipo: tipo,

            cantidad: cantidad,

            fecha: new Date().toISOString()
        };


        setMovimientosStock(
            (movimientosActuales) => [
                ...movimientosActuales,
                nuevoMovimiento
            ]
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

                finalizarComanda,

                agregarProductosAComanda,

                obtenerComandaDeMesa,

                cambiarEstadoProducto,


                // Productos
                productos,

                agregarProducto,

                editarProducto,

                cambiarEstadoProductoCatalogo,


                // Stock
                insumos,

                cambiarEstadoInsumo,

                registrarEntradaStock,

                registrarSalidaStock,

                movimientosStock,

                registrarMovimientoStock

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