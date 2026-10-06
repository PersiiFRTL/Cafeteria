import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode
} from "react";
import type {
    ElementoMapa
} from "../types/mapa";

import { repositorioDemo } from "../services/demoCafeteriaRepository";

// ==========================
// TIPOS
// ==========================

type RolEmpleado = "ADMINISTRADOR" | "EMPLEADO" | "COCINA";

interface Empleado {
    id: number;
    nombre: string;
    email: string;
    password: string;
    rol: RolEmpleado;
    activo: boolean;
}

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
        | "preelaborado"
        | "reventa";
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
        | "litro";
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
    ingredientes?: IngredienteReceta[];
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
    tipoAtencion: "mesa" | "take-away";
    mesaId?: number;
    clienteTakeAway?: {
        nombre: string;
        telefono: string;
    };
    horaRetiro?: string;
    productos: ProductoComanda[];
    estado:
        | "pendiente"
        | "preparando"
        | "lista"
        | "finalizada"
        | "cancelada";
    fechaCreacion: string;
}

const MAPA_STORAGE_KEY = "cafeteria_mapa";

const cargarMapa = (): ElementoMapa[] => {
    try {
        const mapaGuardado =
            localStorage.getItem(
                MAPA_STORAGE_KEY
            );

        if (!mapaGuardado) {
            return [];
        }

        return JSON.parse(
            mapaGuardado
        ) as ElementoMapa[];

    } catch {
        return [];
    }
};

const renumerarMesasSegunMapa = (
    mesas: Mesa[],
    elementos: ElementoMapa[]
): Mesa[] => {
    const idsEnMapa = new Set<number>();
    const mesasEnMapa: Mesa[] = [];

    elementos.forEach((elemento) => {
        if (elemento.tipo !== "mesa" || elemento.mesaId === undefined || idsEnMapa.has(elemento.mesaId)) {
            return;
        }

        const mesa = mesas.find((mesaActual) => mesaActual.id === elemento.mesaId);
        if (mesa) {
            mesasEnMapa.push(mesa);
            idsEnMapa.add(mesa.id);
        }
    });

    const mesasSinUbicar = mesas
        .filter((mesa) => !idsEnMapa.has(mesa.id))
        .sort((mesaA, mesaB) => mesaA.numero - mesaB.numero);

    return [...mesasEnMapa, ...mesasSinUbicar].map((mesa, indice) => ({
        ...mesa,
        numero: indice + 1
    }));
};

const sincronizarMesasConMapa = (
    mesasIniciales: Mesa[],
    elementosIniciales: ElementoMapa[]
): { mesas: Mesa[]; elementos: ElementoMapa[] } => {
    const mesas = [...mesasIniciales];
    const idsMesasAsignadas = new Set<number>();
    const idsElementos = new Set<string>();
    let siguienteIdMesa = Math.max(0, ...mesas.map((mesa) => mesa.id)) + 1;

    const elementos = elementosIniciales.map((elemento, indice) => {
        let idElemento = elemento.id || `mapa-${indice + 1}`;
        let sufijo = 1;
        while (idsElementos.has(idElemento)) {
            idElemento = `${elemento.id || `mapa-${indice + 1}`}-${sufijo++}`;
        }
        idsElementos.add(idElemento);

        const elementoActualizado: ElementoMapa = {
            ...elemento,
            id: idElemento
        };

        if (elemento.tipo !== "mesa") {
            return elementoActualizado;
        }

        const mesaReferenciada = mesas.find((mesa) => mesa.id === elemento.mesaId);
        let mesaAsignada = mesaReferenciada && !idsMesasAsignadas.has(mesaReferenciada.id)
            ? mesaReferenciada
            : undefined;

        if (!mesaAsignada) {
            // Los mapas guardados antes de incluir capacidad no permiten recuperar
            // el aforo exacto: se conserva la forma y se elige un aforo compatible.
            const capacidad = elemento.capacidad ?? mesaReferenciada?.capacidad ??
                (elemento.ancho >= 3 ? 8 : 4);
            mesaAsignada = mesas.find((mesa) =>
                mesa.capacidad === capacidad && !idsMesasAsignadas.has(mesa.id)
            );

            if (!mesaAsignada) {
                mesaAsignada = {
                    id: siguienteIdMesa++,
                    numero: Math.max(0, ...mesas.map((mesa) => mesa.numero)) + 1,
                    capacidad,
                    estado: "libre"
                };
                mesas.push(mesaAsignada);
            }

            elementoActualizado.mesaId = mesaAsignada.id;
        }

        elementoActualizado.capacidad = mesaAsignada.capacidad;
        idsMesasAsignadas.add(mesaAsignada.id);
        return elementoActualizado;
    });

    const mesasEnMapa = elementos
        .filter((elemento) => elemento.tipo === "mesa" && elemento.mesaId !== undefined)
        .map((elemento) => mesas.find((mesa) => mesa.id === elemento.mesaId))
        .filter((mesa): mesa is Mesa => mesa !== undefined);
    const idsEnMapa = new Set(mesasEnMapa.map((mesa) => mesa.id));
    const mesasSinUbicar = mesas
        .filter((mesa) => !idsEnMapa.has(mesa.id))
        .sort((mesaA, mesaB) => mesaA.numero - mesaB.numero);

    return {
        elementos,
        mesas: [...mesasEnMapa, ...mesasSinUbicar].map((mesa, indice) => ({
            ...mesa,
            numero: indice + 1
        }))
    };
};

interface CafeteriaContextType {

    estadoDatos: "cargando" | "listo" | "error";
    errorDatos: string | null;
    recargarDatos: () => Promise<void>;

    mesas: Mesa[];

    crearMesaMapa: (capacidad: number) => Mesa;

    comandas: Comanda[];

    crearComanda: (
        mesaId: number | undefined,
        productos: ProductoComanda[],
        datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
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

    editarComanda: (
    comandaId: number,
    productos: ProductoComanda[]
    ) => boolean;

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
            | "reventa"
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
            | "reventa"
    ) => void;

    eliminarProductoCatalogo: (id: number) => boolean;

    cambiarEstadoProductoCatalogo: (
        id: number,
        activo: boolean
    ) => void;

    materiasPrimas: MateriaPrima[];

    agregarMateriaPrima: (
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number,
        stockInicial: number
    ) => boolean;

    editarMateriaPrima: (
        id: number,
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number
    ) => void;

    cambiarEstadoMateriaPrima: (
        id: number,
        activo: boolean
    ) => void;

    registrarEntradaMateriaPrima: (
        materiaPrimaId: number,
        cantidad: number
    ) => void;

    registrarEntradaProducto: (
        productoId: number,
        cantidad: number
    ) => boolean;

    registrarSalidaMateriaPrima: (
        materiaPrimaId: number,
        cantidad: number
    ) => boolean;

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

    elementosMapa: ElementoMapa[];

    agregarElementoMapa: (
        elemento: ElementoMapa
    ) => void;

    editarElementoMapa: (
        elemento: ElementoMapa
    ) => void;

    eliminarElementoMapa: (
        id: string
    ) => void;

    empleados: Empleado[];

agregarEmpleado: (
    nombre: string,
    email: string,
    password: string,
    rol: RolEmpleado
) => void;

editarEmpleado: (
    id: number,
    nombre: string,
    email: string,
    password: string,
    rol: RolEmpleado
) => void;

cambiarEstadoEmpleado: (
    id: number,
    activo: boolean
) => void;
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
    const [estadoDatos, setEstadoDatos] = useState<"cargando" | "listo" | "error">("cargando");
    const [errorDatos, setErrorDatos] = useState<string | null>(null);

    const [elementosMapa, setElementosMapa] =
        useState<ElementoMapa[]>(() => cargarMapa());

    const [mesas, setMesas] = useState<Mesa[]>([]);

    const [comandas, setComandas] =
        useState<Comanda[]>([]);

    const [productos, setProductos] = useState<Producto[]>([]);

    const [materiasPrimas, setMateriasPrimas] =
        useState<MateriaPrima[]>(
            []
        );

    const [recetas, setRecetas] =
        useState<Receta[]>(
            []
        );

        const [empleados, setEmpleados] = useState<Empleado[]>([]);

    const [producciones, setProducciones] =
        useState<Produccion[]>(
            []
        );

    const [movimientosStock, setMovimientosStock] =
        useState<MovimientoStock[]>([]);

    const [operacionesStock, setOperacionesStock] =
        useState<OperacionStock[]>([]);

    const recargarDatos = useCallback(async () => {
        setEstadoDatos("cargando");
        setErrorDatos(null);
        try {
            const datos = await repositorioDemo.cargarDatosIniciales();
            const mapaGuardado = cargarMapa();
            const mapaSincronizado = sincronizarMesasConMapa(
                datos.mesas as Mesa[],
                mapaGuardado
            );
            setMesas(mapaSincronizado.mesas);
            setElementosMapa(mapaSincronizado.elementos);
            if (JSON.stringify(mapaSincronizado.elementos) !== JSON.stringify(mapaGuardado)) {
                localStorage.setItem(MAPA_STORAGE_KEY, JSON.stringify(mapaSincronizado.elementos));
            }
            setProductos(datos.productos as Producto[]);
            setMateriasPrimas(datos.materiasPrimas as MateriaPrima[]);
            setRecetas(datos.recetas);
            setEmpleados(datos.empleados as Empleado[]);
            setProducciones(datos.producciones);
            setEstadoDatos("listo");
        } catch {
            setErrorDatos("No se pudieron cargar los datos. Revisá la conexión e intentá nuevamente.");
            setEstadoDatos("error");
        }
    }, []);

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            void recargarDatos();
        }, 0);

        return () => window.clearTimeout(temporizador);
    }, [recargarDatos]);

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
        mesaId: number | undefined,
        productosNuevos: ProductoComanda[],
        datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
    ) => {

        const productosPreparados =
            productosNuevos.map((producto) => ({
                ...producto,
                cantidadStockProcesada:
                    producto.cantidadStockProcesada ?? 0
            }));

        const nuevaComanda: Comanda = {
            id: comandas.length + 1,
            tipoAtencion: datosTakeAway ? "take-away" : "mesa",
            ...(mesaId !== undefined ? { mesaId } : {}),
            ...(datosTakeAway ? {
                clienteTakeAway: {
                    nombre: datosTakeAway.nombre.trim(),
                    telefono: datosTakeAway.telefono.trim()
                },
                horaRetiro: datosTakeAway.horaRetiro
            } : {}),
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

        if (mesaId !== undefined) setMesas(
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

            if (producto.tipoElaboracion !== "bajo_pedido") {
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
    const editarComanda = (
    comandaId: number,
    productosNuevos: ProductoComanda[]
): boolean => {

    const comanda = comandas.find(
        (comanda) => comanda.id === comandaId
    );

    if (!comanda) {
        return false;
    }

    // Solo se pueden editar comandas pendientes
    if (comanda.estado !== "pendiente") {
        return false;
    }

    // No permitimos guardar una comanda sin productos
    if (productosNuevos.length === 0) {
        return false;
    }

    const productosActualizados =
        productosNuevos.map((producto) => ({
            ...producto,
            estado: "pendiente" as const
        }));

    setComandas((comandasActuales) =>
        comandasActuales.map((comandaActual) =>
            comandaActual.id === comandaId
                ? {
                    ...comandaActual,
                    productos: productosActualizados,
                    estado: "pendiente"
                }
                : comandaActual
        )
    );

    return true;
    };

    const obtenerComandaDeMesa = (
        mesaId: number
    ) => {

        return comandas.find(
            (comanda) =>
                comanda.mesaId === mesaId &&
                comanda.estado !== "finalizada" &&
                comanda.estado !== "cancelada"
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

    const crearMesaMapa = (capacidad: number): Mesa => {
        const nuevaMesa: Mesa = {
            id: Math.max(0, ...mesas.map((mesa) => mesa.id)) + 1,
            numero: Math.max(0, ...mesas.map((mesa) => mesa.numero)) + 1,
            capacidad,
            estado: "libre"
        };

        setMesas((mesasActuales) => [...mesasActuales, nuevaMesa]);
        return nuevaMesa;
    };

    // Mapa de mesas
    const guardarElementosMapa = (elementos: ElementoMapa[]) => {
        setElementosMapa(elementos);
        localStorage.setItem(MAPA_STORAGE_KEY, JSON.stringify(elementos));
    };

    const agregarElementoMapa = (elemento: ElementoMapa) => {
        const nuevos = [...elementosMapa, elemento];
        guardarElementosMapa(nuevos);
        if (elemento.tipo === "mesa") {
            setMesas((mesasActuales) => renumerarMesasSegunMapa(mesasActuales, nuevos));
        }
    };

    const eliminarElementoMapa = (id: string) => {
        const elementoEliminado = elementosMapa.find((elemento) => elemento.id === id);
        const nuevos = elementosMapa.filter((elemento) => elemento.id !== id);
        guardarElementosMapa(nuevos);
        if (elementoEliminado?.tipo === "mesa") {
            setMesas((mesasActuales) => renumerarMesasSegunMapa(mesasActuales, nuevos));
        }
    };

    const editarElementoMapa = (elementoActualizado: ElementoMapa) => {
        const nuevos = elementosMapa.map((elemento) =>
            elemento.id === elementoActualizado.id ? elementoActualizado : elemento
        );
        guardarElementosMapa(nuevos);
        if (elementoActualizado.tipo === "mesa") {
            setMesas((mesasActuales) => renumerarMesasSegunMapa(mesasActuales, nuevos));
        }
    };

    // Empleados 

    const agregarEmpleado = (
    nombre: string,
    email: string,
    password: string,
    rol: RolEmpleado
) => {
    const emailNormalizado = email.trim().toLowerCase();

    if (
        nombre.trim() === "" ||
        emailNormalizado === "" ||
        password.trim() === ""
    ) {
        return;
    }

    const emailDuplicado = empleados.some(
        (empleado) =>
            empleado.email.trim().toLowerCase() === emailNormalizado
    );

    if (emailDuplicado) {
        return;
    }

    const nuevoId =
        empleados.length > 0
            ? Math.max(...empleados.map((empleado) => empleado.id)) + 1
            : 1;

    const nuevoEmpleado: Empleado = {
        id: nuevoId,
        nombre: nombre.trim(),
        email: emailNormalizado,
        password,
        rol,
        activo: true
    };

    setEmpleados((empleadosActuales) => [
        ...empleadosActuales,
        nuevoEmpleado
    ]);
};
    const editarEmpleado = (
    id: number,
    nombre: string,
    email: string,
    password: string,
    rol: RolEmpleado
) => {
    const emailNormalizado = email.trim().toLowerCase();

    if (
        nombre.trim() === "" ||
        emailNormalizado === ""
    ) {
        return;
    }

    const emailDuplicado = empleados.some(
        (empleado) =>
            empleado.id !== id &&
            empleado.email.trim().toLowerCase() === emailNormalizado
    );

    if (emailDuplicado) {
        return;
    }

    setEmpleados((empleadosActuales) =>
        empleadosActuales.map((empleado) =>
            empleado.id === id
                ? {
                      ...empleado,
                      nombre: nombre.trim(),
                      email: emailNormalizado,
                      password,
                      rol
                  }
                : empleado
        )
    );
};
    const cambiarEstadoEmpleado = (
    id: number,
    activo: boolean
) => {
    setEmpleados((empleadosActuales) =>
        empleadosActuales.map((empleado) =>
            empleado.id === id
                ? {
                      ...empleado,
                      activo
                  }
                : empleado
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
            new Date().toISOString(),
        ingredientes: receta.ingredientes.map((ingrediente) => ({
            materiaPrimaId: ingrediente.materiaPrimaId,
            cantidad: ingrediente.cantidad * cantidad
        }))
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

        if (producto.tipoElaboracion !== "bajo_pedido") {

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
            | "reventa"
    ) => {

        const nuevoProducto: Producto = {

            id: productos.length > 0
                ? Math.max(...productos.map((producto) => producto.id)) + 1
                : 1,

            nombre: nombre.trim(),

            precio,

            categoria: categoria.trim(),

            sector: sector.trim(),

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
            | "reventa"
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

    const eliminarProductoCatalogo = (id: number): boolean => {
        const tieneProducciones = producciones.some(
            (produccion) => produccion.productoId === id
        );
        const tieneOperaciones = operacionesStock.some(
            (operacion) => operacion.referenciaId === id
        );
        const tieneComandas = comandas.some((comanda) =>
            comanda.productos.some((producto) => producto.productoId === id)
        );

        if (tieneProducciones || tieneOperaciones || tieneComandas) {
            return false;
        }

        setProductos((productosActuales) =>
            productosActuales.filter((producto) => producto.id !== id)
        );
        setRecetas((recetasActuales) =>
            recetasActuales.filter((receta) => receta.productoId !== id)
        );

        return true;
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

    const editarMateriaPrima = (
        id: number,
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number
    ) => {
        setMateriasPrimas((materiasActuales) =>
            materiasActuales.map((materia) =>
                materia.id === id
                    ? {
                          ...materia,
                          nombre: nombre.trim(),
                          categoria: categoria.trim(),
                          unidad,
                          stockMinimo
                      }
                    : materia
            )
        );
    };

    const registrarEntradaProducto = (
        productoId: number,
        cantidad: number
    ): boolean => {
        if (!Number.isInteger(cantidad) || cantidad <= 0) {
            return false;
        }

        const producto = productos.find((item) => item.id === productoId);
        if (!producto || producto.tipoElaboracion !== "reventa") {
            return false;
        }

        const fecha = new Date().toISOString();
        const nuevoMovimiento: MovimientoStock = {
            id: Date.now(),
            tipo: "entrada",
            categoria: "producto",
            referenciaId: productoId,
            cantidad,
            fecha,
            descripcion: `Ingreso de ${cantidad} ${producto.unidadVenta} de ${producto.nombre} para reventa`
        };
        const nuevaOperacion: OperacionStock = {
            id: Date.now() + 1,
            tipo: "entrada",
            referenciaId: productoId,
            fecha,
            descripcion: nuevoMovimiento.descripcion,
            movimientos: [nuevoMovimiento]
        };

        setProductos((actuales) => actuales.map((item) =>
            item.id === productoId
                ? { ...item, stockActual: item.stockActual + cantidad }
                : item
        ));
        setMovimientosStock((actuales) => [...actuales, nuevoMovimiento]);
        setOperacionesStock((actuales) => [...actuales, nuevaOperacion]);

        return true;
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
                item.id === materiaPrimaId
        );

    if (!materia) {
        return;
    }


    // ==========================
    // AUMENTAR STOCK
    // ==========================

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


    // ==========================
    // CREAR MOVIMIENTO
    // ==========================

    const nuevoMovimiento: MovimientoStock = {

        id:
            Date.now(),

        tipo: "entrada",

        categoria:
            "materiaPrima",

        referenciaId:
            materiaPrimaId,

        cantidad:
            cantidad,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Entrada de ${materia.nombre}`
    };


    setMovimientosStock(
        (movimientosActuales) => [
            ...movimientosActuales,
            nuevoMovimiento
        ]
    );


    // ==========================
    // CREAR OPERACIÓN
    // ==========================

    const nuevaOperacion: OperacionStock = {

        id:
            Date.now() + 1,

        tipo: "entrada",

        referenciaId:
            materiaPrimaId,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Entrada de ${cantidad} ${materia.unidad} de ${materia.nombre}`,

        movimientos: [
            nuevoMovimiento
        ]
    };


    setOperacionesStock(
        (operacionesActuales) => [
            ...operacionesActuales,
            nuevaOperacion
        ]
    );
};

    const agregarMateriaPrima = (
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number,
        stockInicial: number
    ): boolean => {
        const nombreNormalizado = nombre.trim().toLowerCase();

        if (
            nombreNormalizado === "" ||
            materiasPrimas.some(
                (materia) =>
                    materia.nombre.trim().toLowerCase() ===
                    nombreNormalizado
            )
        ) {
            return false;
        }

        if (stockMinimo < 0 || stockInicial < 0) {
            return false;
        }

        const nuevoId = materiasPrimas.length > 0
            ? Math.max(
                ...materiasPrimas.map((materia) => materia.id)
            ) + 1
            : 1;

        setMateriasPrimas((materiasActuales) => [
            ...materiasActuales,
            {
                id: nuevoId,
                nombre: nombre.trim(),
                categoria: categoria.trim(),
                unidad,
                stockActual: stockInicial,
                stockMinimo,
                activo: true
            }
        ]);

        return true;
    };

    const registrarSalidaMateriaPrima = (
    materiaPrimaId: number,
    cantidad: number
): boolean => {

    if (cantidad <= 0) {
        return false;
    }

    const materia =
        materiasPrimas.find(
            (item) =>
                item.id === materiaPrimaId
        );

    if (!materia) {
        return false;
    }

    // ==========================
    // VALIDAR STOCK DISPONIBLE
    // ==========================

    if (materia.stockActual < cantidad) {
        return false;
    }


    // ==========================
    // DESCONTAR STOCK
    // ==========================

    setMateriasPrimas(
        (materiasActuales) =>
            materiasActuales.map(
                (materiaActual) =>
                    materiaActual.id ===
                    materiaPrimaId
                        ? {
                            ...materiaActual,
                            stockActual:
                                materiaActual.stockActual -
                                cantidad
                        }
                        : materiaActual
            )
    );


    // ==========================
    // CREAR MOVIMIENTO
    // ==========================

    const nuevoMovimiento: MovimientoStock = {

        id:
            Date.now(),

        tipo: "salida",

        categoria:
            "materiaPrima",

        referenciaId:
            materiaPrimaId,

        cantidad:

            cantidad,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Salida de ${materia.nombre}`
    };


    setMovimientosStock(
        (movimientosActuales) => [
            ...movimientosActuales,
            nuevoMovimiento
        ]
    );


    // ==========================
    // CREAR OPERACIÓN
    // ==========================

    const nuevaOperacion: OperacionStock = {

        id:
            Date.now() + 1,

        tipo: "salida",

        referenciaId:
            materiaPrimaId,

        fecha:
            new Date().toISOString(),

        descripcion:
            `Salida de ${cantidad} ${materia.unidad} de ${materia.nombre}`,

        movimientos: [
            nuevoMovimiento
        ]
    };


    setOperacionesStock(
        (operacionesActuales) => [
            ...operacionesActuales,
            nuevaOperacion
        ]
    );

    return true;
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

                estadoDatos,
                errorDatos,
                recargarDatos,

                mesas,

                comandas,
                crearComanda,
                finalizarComanda,
                cancelarComanda,
                agregarProductosAComanda,
                obtenerComandaDeMesa,
                cambiarEstadoProducto,
                editarComanda,

                productos,
                agregarProducto,
                editarProducto,
                eliminarProductoCatalogo,
                cambiarEstadoProductoCatalogo,

                materiasPrimas,
                agregarMateriaPrima,
                editarMateriaPrima,
                cambiarEstadoMateriaPrima,
                registrarEntradaMateriaPrima,
                registrarEntradaProducto,
                registrarSalidaMateriaPrima,

                recetas,
                agregarReceta,
                editarReceta,

                producciones,
                registrarProduccion,
                procesarStockComanda,

                movimientosStock,
                operacionesStock,

                empleados,
                agregarEmpleado,
                editarEmpleado,
                cambiarEstadoEmpleado,

                elementosMapa,
                crearMesaMapa,
                agregarElementoMapa,
                editarElementoMapa,
                eliminarElementoMapa,
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
