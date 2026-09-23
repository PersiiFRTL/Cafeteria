import {
    createContext,
    useContext,
    useState,
    type ReactNode
} from "react";

import mesasIniciales from "../data/mesas.json";
import productosIniciales from "../data/productos.json";
import materiasPrimasIniciales from "../data/materiasPrimas.json";
import recetasIniciales from "../data/recetas.json";
import produccionesIniciales from "../data/producciones.json";

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
    categoria: string;
    sector: string;
    tipoElaboracion:
        | "bajo_pedido"
        | "preelaborado";
    unidadVenta:
        | "unidad"
        | "porcion"
        | "litro"
        | "kg";
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
    disponible: boolean;
}

interface MateriaPrima {
    id: number;
    nombre: string;
    categoria: string;
    unidad:
        | "unidad"
        | "kg"
        | "g"
        | "litro"
        | "ml";
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
}

interface IngredienteReceta {
    materiaPrimaId: number;
    cantidad: number;
}

interface Receta {
    id: number;
    productoId: number;
    ingredientes: IngredienteReceta[];
}

interface Produccion {
    id: number;
    productoId: number;
    cantidad: number;
    fecha: string;
}

type TipoMovimiento =
    | "entrada"
    | "salida"
    | "consumo"
    | "produccion"
    | "venta"
    | "merma"
    | "ajuste";

interface MovimientoStock {
    id: number;
    tipo: TipoMovimiento;
    categoria:
        | "materiaPrima"
        | "producto";
    referenciaId: number;
    cantidad: number;
    fecha: string;
    descripcion: string;
}

interface OperacionStock {
    id: number;
    tipo: "produccion" | "comanda" | "entrada" | "salida";
    referenciaId: number;
    fecha: string;
    descripcion: string;
    movimientos: MovimientoStock[];
}

interface ProductoComanda {
    productoId: number;
    cantidad: number;
    estado:
        | "pendiente"
        | "preparando"
        | "listo";
    cantidadStockProcesada: number;
}

interface Comanda {
    id: number;
    mesaId: number;
    productos: ProductoComanda[];
    estado:
        | "pendiente"
        | "preparando"
        | "lista"
        | "finalizada"
        | "cancelada";
    fechaCreacion: string;
}

interface CafeteriaContextType {

    mesas: Mesa[];

    comandas: Comanda[];

    crearComanda: (
        mesaId: number,
        productos: ProductoComanda[]
    ) => void;

    finalizarComanda: (
        comandaId: number
    ) => void;

    cancelarComanda: (
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
        estado:
            | "pendiente"
            | "preparando"
            | "listo"
    ) => void;

    productos: Producto[];

    agregarProducto: (
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
    ) => void;

    editarProducto: (
        id: number,
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
    ) => void;

    cambiarEstadoProductoCatalogo: (
        id: number,
        activo: boolean
    ) => void;

    materiasPrimas: MateriaPrima[];

    cambiarEstadoMateriaPrima: (
        id: number,
        activo: boolean
    ) => void;

    registrarEntradaMateriaPrima: (
        materiaPrimaId: number,
        cantidad: number
    ) => void;

    registrarSalidaMateriaPrima: (
        materiaPrimaId: number,
        cantidad: number
    ) => void;

    recetas: Receta[];

    agregarReceta: (
        productoId: number,
        ingredientes: IngredienteReceta[]
    ) => void;

    editarReceta: (
        recetaId: number,
        ingredientes: IngredienteReceta[]
    ) => void;

    producciones: Produccion[];

    registrarProduccion: (
        productoId: number,
        cantidad: number
    ) => boolean;

    procesarStockComanda: (
    comandaId: number
    ) => boolean;

    movimientosStock: MovimientoStock[];

    operacionesStock: OperacionStock[];
}

const CafeteriaContext =
    createContext<CafeteriaContextType | undefined>(
        undefined
    );

export function CafeteriaProvider({
    children
}: {
    children: ReactNode;
}) {

    const [mesas, setMesas] =
        useState<Mesa[]>(mesasIniciales);

    const [comandas, setComandas] =
        useState<Comanda[]>([]);

    const [productos, setProductos] =
        useState<Producto[]>(productosIniciales);

    const [materiasPrimas, setMateriasPrimas] =
        useState<MateriaPrima[]>(
            materiasPrimasIniciales
        );

    const [recetas, setRecetas] =
        useState<Receta[]>(
            recetasIniciales
        );

    const [producciones, setProducciones] =
        useState<Produccion[]>(
            produccionesIniciales
        );

    const [movimientosStock, setMovimientosStock] =
        useState<MovimientoStock[]>([]);

    const [operacionesStock, setOperacionesStock] =
        useState<OperacionStock[]>([]);

    // ==========================
    // COMANDAS
    // ==========================

    const calcularEstadoComanda = (
        productosComanda: ProductoComanda[]
    ): Comanda["estado"] => {

        if (productosComanda.length === 0) {
            return "pendiente";
        }

        if (
            productosComanda.every(
                (producto) =>
                    producto.estado === "listo"
            )
        ) {
            return "lista";
        }

        if (
            productosComanda.some(
                (producto) =>
                    producto.estado === "preparando"
            )
        ) {
            return "preparando";
        }

        return "pendiente";
    };

    const crearComanda = (
        mesaId: number,
        productosNuevos: ProductoComanda[]
    ) => {

        const productosPreparados =
            productosNuevos.map((producto) => ({
                ...producto,
                cantidadStockProcesada:
                    producto.cantidadStockProcesada ?? 0
            }));

        const nuevaComanda: Comanda = {
            id: comandas.length + 1,
            mesaId: mesaId,
            productos: productosPreparados,
            estado: "pendiente",
            fechaCreacion:
                new Date().toISOString()
        };

        setComandas(
            (comandasActuales) => [
                ...comandasActuales,
                nuevaComanda
            ]
        );

        setMesas(
            (mesasActuales) =>
                mesasActuales.map(
                    (mesa) =>
                        mesa.id === mesaId
                            ? {
                                ...mesa,
                                estado: "ocupada"
                            }
                            : mesa
                )
        );
    };

    const finalizarComanda = (
        comandaId: number
    ) => {

        const comanda =
            comandas.find(
                (item) =>
                    item.id === comandaId
            );

        if (!comanda) {
            return;
        }

        setComandas(
            (comandasActuales) =>
                comandasActuales.map(
                    (comandaActual) =>
                        comandaActual.id ===
                        comandaId
                            ? {
                                ...comandaActual,
                                estado:
                                    "finalizada"
                            }
                            : comandaActual
                )
        );

        setMesas(
            (mesasActuales) =>
                mesasActuales.map(
                    (mesa) =>
                        mesa.id ===
                        comanda.mesaId
                            ? {
                                ...mesa,
                                estado: "libre"
                            }
                            : mesa
                )
        );
    };

    const cancelarComanda = (
        comandaId: number
    ) => {
        const comanda = comandas.find(
            (item) => item.id === comandaId
        );

        if (!comanda || comanda.estado === "finalizada") {
            return;
        }

        const devolucionesProductos = new Map<number, number>();
        const devolucionesMateriasPrimas = new Map<number, number>();

        comanda.productos.forEach((item) => {
            const cantidadProcesada =
                item.cantidadStockProcesada ?? 0;

            if (cantidadProcesada <= 0) {
                return;
            }

            const producto = productos.find(
                (itemProducto) =>
                    itemProducto.id === item.productoId
            );

            if (!producto) {
                return;
            }

            if (producto.tipoElaboracion === "preelaborado") {
                devolucionesProductos.set(
                    producto.id,
                    (devolucionesProductos.get(producto.id) ?? 0) +
                        cantidadProcesada
                );
                return;
            }

            const receta = recetas.find(
                (itemReceta) =>
                    itemReceta.productoId === producto.id
            );

            receta?.ingredientes.forEach((ingrediente) => {
                const cantidadDevuelta =
                    ingrediente.cantidad * cantidadProcesada;

                devolucionesMateriasPrimas.set(
                    ingrediente.materiaPrimaId,
                    (devolucionesMateriasPrimas.get(
                        ingrediente.materiaPrimaId
                    ) ?? 0) + cantidadDevuelta
                );
            });
        });

        setProductos((productosActuales) =>
            productosActuales.map((producto) => {
                const cantidadDevuelta =
                    devolucionesProductos.get(producto.id);

                return cantidadDevuelta === undefined
                    ? producto
                    : {
                        ...producto,
                        stockActual:
                            producto.stockActual + cantidadDevuelta
                    };
            })
        );

        setMateriasPrimas((materiasActuales) =>
            materiasActuales.map((materia) => {
                const cantidadDevuelta =
                    devolucionesMateriasPrimas.get(materia.id);

                return cantidadDevuelta === undefined
                    ? materia
                    : {
                        ...materia,
                        stockActual:
                            materia.stockActual + cantidadDevuelta
                    };
            })
        );

        const movimientosDevolucion: MovimientoStock[] = [];

        devolucionesProductos.forEach((cantidad, productoId) => {
            movimientosDevolucion.push({
                id: Date.now() + movimientosDevolucion.length,
                tipo: "ajuste",
                categoria: "producto",
                referenciaId: productoId,
                cantidad,
                fecha: new Date().toISOString(),
                descripcion: `Devolución por cancelación de comanda #${comandaId}`
            });
        });

        devolucionesMateriasPrimas.forEach((cantidad, materiaPrimaId) => {
            movimientosDevolucion.push({
                id: Date.now() + movimientosDevolucion.length,
                tipo: "ajuste",
                categoria: "materiaPrima",
                referenciaId: materiaPrimaId,
                cantidad,
                fecha: new Date().toISOString(),
                descripcion: `Devolución por cancelación de comanda #${comandaId}`
            });
        });

        if (movimientosDevolucion.length > 0) {
            setMovimientosStock((movimientosActuales) => [
                ...movimientosActuales,
                ...movimientosDevolucion
            ]);
        }

        setComandas((comandasActuales) =>
            comandasActuales.map((comandaActual) =>
                comandaActual.id === comandaId
                    ? {
                        ...comandaActual,
                        estado: "cancelada"
                    }
                    : comandaActual
            )
        );

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

    const agregarProductosAComanda = (
        comandaId: number,
        productosNuevos: ProductoComanda[]
    ) => {

        setComandas(
            (comandasActuales) =>
                comandasActuales.map(
                    (comanda) => {

                        if (
                            comanda.id !==
                            comandaId
                        ) {
                            return comanda;
                        }

                        const productosActualizados =
                            [
                                ...comanda.productos
                            ];

                        productosNuevos.forEach(
                            (productoNuevo) => {

                                const productoExistente =
                                    productosActualizados.find(
                                        (producto) =>
                                            producto.productoId ===
                                            productoNuevo.productoId
                                    );

                                if (
                                    productoExistente
                                ) {

                                    productoExistente.cantidad +=
                                        productoNuevo.cantidad;

                                    productoExistente.estado =
                                        "pendiente";

                                    return;
                                }

                                productosActualizados.push(
                                    {
                                        ...productoNuevo,
                                        cantidadStockProcesada:
                                            productoNuevo
                                                .cantidadStockProcesada ??
                                            0
                                    }
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
                    }
                )
        );
    };

    const obtenerComandaDeMesa = (
        mesaId: number
    ) => {

        return comandas.find(
            (comanda) =>
                comanda.mesaId === mesaId &&
                comanda.estado !==
                    "finalizada"
        );
    };

    const cambiarEstadoProducto = (
        comandaId: number,
        productoId: number,
        estado:
            | "pendiente"
            | "preparando"
            | "listo"
    ) => {

        setComandas(
            (comandasActuales) =>
                comandasActuales.map(
                    (comanda) => {

                        if (
                            comanda.id !==
                            comandaId
                        ) {
                            return comanda;
                        }

                        const productosActualizados =
                            comanda.productos.map(
                                (producto) =>
                                    producto.productoId ===
                                    productoId
                                        ? {
                                            ...producto,
                                            estado:
                                                estado
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
                    }
                )
        );
    };

    // ==========================
    // REGISTRAR PRODUCCIÓN
    // ==========================

    function registrarProduccion(
    productoId: number,
    cantidad: number
): boolean {

    if (cantidad <= 0) {
        return false;
    }

    const producto = productos.find(
        (p) => p.id === productoId
    );

    if (!producto) {
        return false;
    }

    if (producto.tipoElaboracion !== "preelaborado") {
        return false;
    }

    const receta = recetas.find(
        (r) => r.productoId === productoId
    );

    if (!receta) {
        return false;
    }

    // ==========================
    // CALCULAR CONSUMO
    // ==========================

    for (const ingrediente of receta.ingredientes) {

        const materiaPrima =
            materiasPrimas.find(
                (mp) =>
                    mp.id ===
                    ingrediente.materiaPrimaId
            );

        if (!materiaPrima) {
            return false;
        }

        const cantidadNecesaria =
            ingrediente.cantidad * cantidad;

        if (
            materiaPrima.stockActual <
            cantidadNecesaria
        ) {
            return false;
        }
    }

    // ==========================
    // DESCONTAR MATERIAS PRIMAS
    // ==========================

    setMateriasPrimas((actuales) =>
        actuales.map((materiaPrima) => {

            const ingrediente =
                receta.ingredientes.find(
                    (i) =>
                        i.materiaPrimaId ===
                        materiaPrima.id
                );

            if (!ingrediente) {
                return materiaPrima;
            }

            const cantidadConsumida =
                ingrediente.cantidad * cantidad;

            return {
                ...materiaPrima,
                stockActual:
                    materiaPrima.stockActual -
                    cantidadConsumida
            };
        })
    );

    // ==========================
    // AUMENTAR PRODUCTO TERMINADO
    // ==========================

    setProductos((actuales) =>
        actuales.map((p) => {

            if (p.id !== productoId) {
                return p;
            }

            return {
                ...p,
                stockActual:
                    p.stockActual + cantidad
            };
        })
    );

    // ==========================
    // REGISTRAR PRODUCCIÓN
    // ==========================

    const nuevaProduccion: Produccion = {
        id:
            producciones.length > 0
                ? Math.max(
                      ...producciones.map(
                          (p) => p.id
                      )
                  ) + 1
                : 1,

        productoId,
        cantidad,
        fecha:
            new Date().toISOString()
    };

    setProducciones((actuales) => [
        ...actuales,
        nuevaProduccion
    ]);

    // ==========================
    // REGISTRAR MOVIMIENTOS
    // ==========================

    const nuevosMovimientos: MovimientoStock[] =
        receta.ingredientes.map(
            (ingrediente) => {

                const cantidadConsumida =
                    ingrediente.cantidad *
                    cantidad;

                return {
                    id: Date.now() + ingrediente.materiaPrimaId,

                    tipo: "consumo",

                    categoria: "materiaPrima",

                    referenciaId:
                        ingrediente.materiaPrimaId,

                    cantidad:
                        cantidadConsumida,

                    fecha:
                        new Date().toISOString(),

                    descripcion:
                        `Consumo por producción de ${cantidad} ${producto.nombre}`
                };
            }
        );

    nuevosMovimientos.push({
        id: Date.now() + 1000,

        tipo: "produccion",

        categoria: "producto",

        referenciaId: productoId,

        cantidad,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Producción de ${cantidad} ${producto.nombre}`
    });

        setMovimientosStock((actuales) => [
            ...actuales,
            ...nuevosMovimientos
        ]);

        const nuevaOperacion: OperacionStock = {
        id: Date.now(),

        tipo: "produccion",

        referenciaId: productoId,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Producción de ${cantidad} ${producto.nombre}`,

        movimientos:
            nuevosMovimientos
    };

    setOperacionesStock((actuales) => [
        ...actuales,
        nuevaOperacion
]);

    return true;
}

// ==========================
// PROCESAR STOCK COMANDA
// ==========================

function procesarStockComanda(
    comandaId: number
): boolean {

    // ==========================
    // BUSCAR COMANDA
    // ==========================

    const comanda = comandas.find(
        (c) => c.id === comandaId
    );

    if (!comanda) {
        return false;
    }


    // ==========================
    // CALCULAR DIFERENCIAS
    // ==========================

    const consumosProducto: {
        productoId: number;
        cantidad: number;
    }[] = [];

    const consumosMateriaPrima: {
        materiaPrimaId: number;
        cantidad: number;
    }[] = [];


    for (const item of comanda.productos) {

        // --------------------------------
        // CANTIDAD TODAVÍA NO PROCESADA
        // --------------------------------

        const cantidadPendiente =
            item.cantidad -
            item.cantidadStockProcesada;


        if (cantidadPendiente <= 0) {
            continue;
        }


        // --------------------------------
        // BUSCAR PRODUCTO
        // --------------------------------

        const producto = productos.find(
            (p) => p.id === item.productoId
        );


        if (!producto) {
            return false;
        }


        // ==================================
        // PRODUCTO PREELABORADO
        // ==================================

        if (
            producto.tipoElaboracion ===
            "preelaborado"
        ) {

            if (
                producto.stockActual <
                cantidadPendiente
            ) {
                return false;
            }


            consumosProducto.push({
                productoId: producto.id,
                cantidad: cantidadPendiente
            });

        }


        // ==================================
        // PRODUCTO BAJO PEDIDO
        // ==================================

        else {

            const receta = recetas.find(
                (r) =>
                    r.productoId ===
                    producto.id
            );


            if (!receta) {
                return false;
            }


            for (
                const ingrediente
                of receta.ingredientes
            ) {

                const cantidadNecesaria =
                    ingrediente.cantidad *
                    cantidadPendiente;


                consumosMateriaPrima.push({
                    materiaPrimaId:
                        ingrediente.materiaPrimaId,

                    cantidad:
                        cantidadNecesaria
                });
            }
        }
    }


    // ==========================
    // AGRUPAR MATERIAS PRIMAS
    // ==========================

    const consumosAgrupados =
        new Map<number, number>();


    for (
        const consumo
        of consumosMateriaPrima
    ) {

        const cantidadActual =
            consumosAgrupados.get(
                consumo.materiaPrimaId
            ) ?? 0;

        consumosAgrupados.set(
            consumo.materiaPrimaId,
            cantidadActual +
                consumo.cantidad
        );
    }


    // ==========================
    // VALIDAR MATERIAS PRIMAS
    // ==========================

    for (
        const [
            materiaPrimaId,
            cantidadNecesaria
        ]
        of consumosAgrupados
    ) {

        const materiaPrima =
            materiasPrimas.find(
                (mp) =>
                    mp.id === materiaPrimaId
            );


        if (!materiaPrima) {
            return false;
        }


        if (
            materiaPrima.stockActual <
            cantidadNecesaria
        ) {
            return false;
        }
    }


    // ==========================
    // A PARTIR DE ACÁ
    // TODO ESTÁ VALIDADO
    // ==========================


    // ==========================
    // DESCONTAR PRODUCTOS
    // ==========================

    setProductos((actuales) =>
        actuales.map((producto) => {

            const consumo =
                consumosProducto.find(
                    (c) =>
                        c.productoId ===
                        producto.id
                );


            if (!consumo) {
                return producto;
            }


            return {
                ...producto,

                stockActual:
                    producto.stockActual -
                    consumo.cantidad
            };
        })
    );


    // ==========================
    // DESCONTAR MATERIAS PRIMAS
    // ==========================

    setMateriasPrimas((actuales) =>
        actuales.map((materiaPrima) => {

            const cantidadConsumida =
                consumosAgrupados.get(
                    materiaPrima.id
                );


            if (
                cantidadConsumida ===
                undefined
            ) {
                return materiaPrima;
            }


            return {
                ...materiaPrima,

                stockActual:
                    materiaPrima.stockActual -
                    cantidadConsumida
            };
        })
    );


    // ==========================
    // ACTUALIZAR CANTIDAD PROCESADA
    // ==========================

    setComandas((actuales) =>
        actuales.map((comandaActual) => {

            if (
                comandaActual.id !==
                comandaId
            ) {
                return comandaActual;
            }


            return {
                ...comandaActual,

                    estado:
                        comandaActual.estado === "pendiente" ? "preparando" : comandaActual.estado,

                productos:
                    comandaActual.productos.map(
                        (item) => {

                            return {
                                ...item,

                                cantidadStockProcesada:
                                    item.cantidad
                            };
                        }
                    )
            };
        })
    );


    // ==========================
    // MOVIMIENTOS DE STOCK
    // ==========================

    const nuevosMovimientos:
        MovimientoStock[] = [];


    // --------------------------------
    // MOVIMIENTOS DE PRODUCTOS
    // --------------------------------

    for (
        const consumo
        of consumosProducto
    ) {

        const producto =
            productos.find(
                (p) =>
                    p.id ===
                    consumo.productoId
            );


        if (!producto) {
            continue;
        }


        nuevosMovimientos.push({
            id:
                Date.now() +
                nuevosMovimientos.length,

            tipo: "venta",

            categoria: "producto",

            referenciaId:
                producto.id,

            cantidad:
                consumo.cantidad,

            fecha:
                new Date().toISOString(),

            descripcion:
                `Consumo por comanda #${comandaId}`
        });
    }


    // --------------------------------
    // MOVIMIENTOS DE MATERIAS PRIMAS
    // --------------------------------

    for (
        const [
            materiaPrimaId,
            cantidad
        ]
        of consumosAgrupados
    ) {

        nuevosMovimientos.push({
            id:
                Date.now() +
                nuevosMovimientos.length,

            tipo: "consumo",

            categoria: "materiaPrima",

            referenciaId:
                materiaPrimaId,

            cantidad,

            fecha:
                new Date().toISOString(),

            descripcion:
                `Consumo por comanda #${comandaId}`
        });
    }


    // --------------------------------
    // GUARDAR MOVIMIENTOS
    // --------------------------------

    if (
        nuevosMovimientos.length > 0
    ) {

        setMovimientosStock(
            (actuales) => [
                ...actuales,
                ...nuevosMovimientos
            ]
        );
    }

    if (nuevosMovimientos.length > 0) {

    const nuevaOperacion: OperacionStock = {

        id: Date.now(),

        tipo: "comanda",

        referenciaId: comandaId,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Consumo por comanda #${comandaId}`,

        movimientos:
            nuevosMovimientos
    };

    setOperacionesStock(
        (actuales) => [
            ...actuales,
            nuevaOperacion
        ]
    );
}

    return true;
}



    // ==========================
    // PRODUCTOS
    // ==========================

    const agregarProducto = (
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
    ) => {

        const nuevoProducto: Producto = {

            id: productos.length + 1,

            nombre: nombre,

            precio: precio,

            categoria: categoria,

            sector: sector,

            tipoElaboracion:
                tipoElaboracion,

            unidadVenta: "unidad",

            stockActual: 0,

            stockMinimo: 0,

            activo: true,

            disponible: true
        };

        setProductos(
            (productosActuales) => [
                ...productosActuales,
                nuevoProducto
            ]
        );
    };

    const editarProducto = (
        id: number,
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
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
                                categoria:
                                    categoria,
                                sector: sector,
                                tipoElaboracion:
                                    tipoElaboracion
                            }
                            : producto
                )
        );
    };

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
    // MATERIAS PRIMAS
    // ==========================

    const cambiarEstadoMateriaPrima = (
        id: number,
        activo: boolean
    ) => {

        setMateriasPrimas(
            (materiasActuales) =>
                materiasActuales.map(
                    (materia) =>
                        materia.id === id
                            ? {
                                ...materia,
                                activo: activo
                            }
                            : materia
                )
        );
    };

    const registrarEntradaMateriaPrima = (
        materiaPrimaId: number,
        cantidad: number
    ) => {

        if (cantidad <= 0) {
            return;
        }

        const materia =
            materiasPrimas.find(
                (item) =>
                    item.id ===
                    materiaPrimaId
            );

        if (!materia) {
            return;
        }

        setMateriasPrimas(
            (materiasActuales) =>
                materiasActuales.map(
                    (materiaActual) =>
                        materiaActual.id ===
                        materiaPrimaId
                            ? {
                                ...materiaActual,
                                stockActual:
                                    materiaActual.stockActual +
                                    cantidad
                            }
                            : materiaActual
                )
        );

        setMovimientosStock(
            (movimientosActuales) => [
                ...movimientosActuales,
                {
                    id:
                        movimientosActuales.length +
                        1,

                    tipo: "entrada",

                    categoria:
                        "materiaPrima",

                    referenciaId:
                        materiaPrimaId,

                    cantidad: cantidad,

                    fecha:
                        new Date().toISOString(),

                    descripcion:
                        `Entrada de ${materia.nombre}`
                }
            ]
        );
    };

    const registrarSalidaMateriaPrima = (
        materiaPrimaId: number,
        cantidad: number
    ) => {

        if (cantidad <= 0) {
            return;
        }

        const materia =
            materiasPrimas.find(
                (item) =>
                    item.id ===
                    materiaPrimaId
            );

        if (!materia) {
            return;
        }

        setMateriasPrimas(
            (materiasActuales) =>
                materiasActuales.map(
                    (materiaActual) =>
                        materiaActual.id ===
                        materiaPrimaId
                            ? {
                                ...materiaActual,
                                stockActual:
                                    Math.max(
                                        0,
                                        materiaActual.stockActual -
                                        cantidad
                                    )
                            }
                            : materiaActual
                )
        );

        setMovimientosStock(
            (movimientosActuales) => [
                ...movimientosActuales,
                {
                    id:
                        movimientosActuales.length +
                        1,

                    tipo: "salida",

                    categoria:
                        "materiaPrima",

                    referenciaId:
                        materiaPrimaId,

                    cantidad: cantidad,

                    fecha:
                        new Date().toISOString(),

                    descripcion:
                        `Salida de ${materia.nombre}`
                }
            ]
        );
    };

    // ==========================
    // RECETAS
    // ==========================

    const agregarReceta = (
        productoId: number,
        ingredientes: IngredienteReceta[]
    ) => {

        const recetaExistente =
            recetas.find(
                (receta) =>
                    receta.productoId ===
                    productoId
            );

        if (recetaExistente) {
            return;
        }

        const nuevaReceta: Receta = {

            id:
                recetas.length + 1,

            productoId:
                productoId,

            ingredientes:
                ingredientes
        };

        setRecetas(
            (recetasActuales) => [
                ...recetasActuales,
                nuevaReceta
            ]
        );
    };

    const editarReceta = (
        recetaId: number,
        ingredientes: IngredienteReceta[]
    ) => {

        setRecetas(
            (recetasActuales) =>
                recetasActuales.map(
                    (receta) =>
                        receta.id === recetaId
                            ? {
                                ...receta,
                                ingredientes:
                                    ingredientes
                            }
                            : receta
                )
        );
    };

    return (
        <CafeteriaContext.Provider
            value={{

                mesas,

                comandas,
                crearComanda,
                finalizarComanda,
                cancelarComanda,
                agregarProductosAComanda,
                obtenerComandaDeMesa,
                cambiarEstadoProducto,

                productos,
                agregarProducto,
                editarProducto,
                cambiarEstadoProductoCatalogo,

                materiasPrimas,
                cambiarEstadoMateriaPrima,
                registrarEntradaMateriaPrima,
                registrarSalidaMateriaPrima,

                recetas,
                agregarReceta,
                editarReceta,

                producciones,
                registrarProduccion,
                procesarStockComanda,

                movimientosStock,
                operacionesStock

            }}
        >
            {children}
        </CafeteriaContext.Provider>
    );
}

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