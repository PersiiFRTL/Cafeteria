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

import { repositorioSupabaseCatalogo } from "../services/supabaseCatalogoRepository";
import { repositorioPersonal } from "../services/personalRepository";
import { useAuth } from "./AuthContext";
import {
    obtenerComandaActivaDeMesa
} from "../domain/operacionesCafeteria";

// ==========================
// TIPOS
// ==========================

type RolEmpleado = "ADMINISTRADOR" | "EMPLEADO" | "COCINA";

interface Empleado {
    id: string;
    nombre: string;
    email: string;
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
    responsableNombre?: string;
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
    responsableNombre?: string;
    movimientos: MovimientoStock[];
}

interface EventoActividad {
    id: number;
    usuarioNombre: string;
    entidad: string;
    entidadId: string;
    accion: string;
    detalle: string;
    fecha: string;
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
    responsableNombre?: string;
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

    cambiarEstadoMesa: (mesaId: number, estado: "libre" | "ocupada") => Promise<boolean>;

    crearMesaMapa: (capacidad: number) => Mesa;

    comandas: Comanda[];

    crearComanda: (
        mesaId: number | undefined,
        productos: ProductoComanda[],
        datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
    ) => Promise<boolean>;

    finalizarComanda: (
        comandaId: number
    ) => Promise<boolean>;

    cancelarComanda: (
        comandaId: number
    ) => Promise<boolean>;

    agregarProductosAComanda: (
        comandaId: number,
        productos: ProductoComanda[]
    ) => Promise<boolean>;

    editarComanda: (
    comandaId: number,
    productos: ProductoComanda[]
    ) => Promise<boolean>;

    obtenerComandaDeMesa: (
        mesaId: number
    ) => Comanda | undefined;

    cambiarEstadoProducto: (
        comandaId: number,
        productoId: number,
        estado: "preparando" | "listo"
    ) => Promise<boolean>;

    productos: Producto[];

    agregarProducto: (
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
            | "reventa",
        stockInicial?: number
    ) => Promise<{ creado: boolean; stockRegistrado: boolean }>;

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
    ) => Promise<boolean>;

    editarStockMinimoProducto: (id: number, stockMinimo: number) => Promise<boolean>;

    eliminarProductoCatalogo: (id: number) => Promise<boolean>;

    cambiarEstadoProductoCatalogo: (
        id: number,
        activo: boolean
    ) => Promise<boolean>;

    materiasPrimas: MateriaPrima[];

    agregarMateriaPrima: (
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number,
        stockInicial: number
    ) => Promise<boolean>;

    editarMateriaPrima: (
        id: number,
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number
    ) => Promise<boolean>;

    cambiarEstadoMateriaPrima: (
        id: number,
        activo: boolean
    ) => Promise<boolean>;

    registrarEntradaMateriaPrima: (
        materiaPrimaId: number,
        cantidad: number
    ) => Promise<boolean>;

    registrarEntradaProducto: (
        productoId: number,
        cantidad: number
    ) => Promise<boolean>;

    registrarSalidaMateriaPrima: (
        materiaPrimaId: number,
        cantidad: number
    ) => Promise<boolean>;

    recetas: Receta[];

    agregarReceta: (
        productoId: number,
        ingredientes: IngredienteReceta[]
    ) => Promise<boolean>;

    editarReceta: (
        recetaId: number,
        ingredientes: IngredienteReceta[]
    ) => Promise<boolean>;

    producciones: Produccion[];

    registrarProduccion: (
        productoId: number,
        cantidad: number
    ) => Promise<boolean>;

    procesarStockComanda: (
    comandaId: number
    ) => Promise<boolean>;

    movimientosStock: MovimientoStock[];

    operacionesStock: OperacionStock[];

    actividad: EventoActividad[];

    auditoriaDisponible: boolean;

    elementosMapa: ElementoMapa[];

    agregarElementoMapa: (
        elemento: ElementoMapa
    ) => Promise<{ success: boolean; error?: string }>;

    editarElementoMapa: (
        elemento: ElementoMapa
    ) => Promise<{ success: boolean; error?: string }>;

    eliminarElementoMapa: (
        id: string
    ) => Promise<{ success: boolean; error?: string }>;

    empleados: Empleado[];

agregarEmpleado: (
    nombre: string,
    email: string,
    password: string,
    rol: RolEmpleado
) => Promise<void>;

editarEmpleado: (
    id: string,
    nombre: string,
    email: string,
    password: string,
    rol: RolEmpleado
) => Promise<void>;

cambiarEstadoEmpleado: (
    id: string,
    activo: boolean
) => Promise<void>;
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
    const { usuario, estadoSesion } = useAuth();
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

    const [actividad, setActividad] = useState<EventoActividad[]>([]);

    const [auditoriaDisponible, setAuditoriaDisponible] = useState(false);

    const cargarEstadoRemoto = useCallback(async (cargarPersonal = false) => {
        const datos = await repositorioSupabaseCatalogo.cargarDatosIniciales();
        const mapaGuardado = cargarMapa();
        const mapaRemoto = datos.elementosMapa;
        const mapaFuente = mapaRemoto.length > 0 ? mapaRemoto : mapaGuardado;
        const mapaSincronizado = sincronizarMesasConMapa(datos.mesas as Mesa[], mapaFuente);
        setMesas(mapaSincronizado.mesas);
        setElementosMapa(mapaSincronizado.elementos);
        if (JSON.stringify(mapaSincronizado.elementos) !== JSON.stringify(mapaGuardado)) {
            localStorage.setItem(MAPA_STORAGE_KEY, JSON.stringify(mapaSincronizado.elementos));
        }
        setProductos(datos.productos as Producto[]);
        setMateriasPrimas(datos.materiasPrimas as MateriaPrima[]);
        setRecetas(datos.recetas);
        setComandas(datos.comandas as unknown as Comanda[]);
        setMovimientosStock(datos.movimientosStock as unknown as MovimientoStock[]);
        setOperacionesStock(datos.operacionesStock as unknown as OperacionStock[]);
        setActividad(datos.actividad);
        setAuditoriaDisponible(datos.auditoriaDisponible);
        setProducciones(datos.producciones);
        if (usuario?.rol === "ADMINISTRADOR" && cargarPersonal) {
            const personal = await repositorioPersonal.listar();
            setEmpleados(personal);
        } else if (usuario?.rol !== "ADMINISTRADOR") {
            setEmpleados([]);
        }
    }, [usuario?.rol]);

    const recargarDatos = useCallback(async () => {
        setEstadoDatos("cargando");
        setErrorDatos(null);
        try {
            await cargarEstadoRemoto(true);
            setEstadoDatos("listo");
        } catch (error) {
            const detalle = error instanceof Error ? ` Detalle: ${error.message}` : "";
            setErrorDatos(`No se pudieron cargar los datos. Revisá la conexión e intentá nuevamente.${detalle}`);
            setEstadoDatos("error");
        }
    }, [cargarEstadoRemoto]);

    const refrescarTrasOperacion = async () => {
        try {
            await cargarEstadoRemoto();
        } catch (error) {
            setErrorDatos(error instanceof Error
                ? `La operación se guardó, pero no se pudo actualizar la vista: ${error.message}`
                : "La operación se guardó, pero no se pudo actualizar la vista.");
        }
    };

    const usuarioId = usuario?.id;
    useEffect(() => {
        if (estadoSesion !== "lista" || !usuarioId) return;

        const temporizador = window.setTimeout(() => {
            void recargarDatos();
        }, 0);

        return () => window.clearTimeout(temporizador);
    }, [recargarDatos, estadoSesion, usuarioId]);

    // ==========================
    // COMANDAS
    // ==========================

    const crearComanda = async (
        mesaId: number | undefined,
        productosNuevos: ProductoComanda[],
        datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
    ): Promise<boolean> => {
        if (!productosNuevos.length || productosNuevos.some((item) => !Number.isFinite(item.cantidad) || item.cantidad <= 0)) {
            return false;
        }
        try {
            setErrorDatos(null);
            const comandaId = await repositorioSupabaseCatalogo.crearComanda(mesaId, productosNuevos, datosTakeAway);
            const nuevaComanda: Comanda = {
                id: comandaId,
                tipoAtencion: datosTakeAway ? "take-away" : "mesa",
                ...(mesaId === undefined ? {} : { mesaId }),
                ...(datosTakeAway ? {
                    clienteTakeAway: {
                        nombre: datosTakeAway.nombre,
                        telefono: datosTakeAway.telefono
                    },
                    horaRetiro: datosTakeAway.horaRetiro
                } : {}),
                productos: productosNuevos.map((item) => ({
                    productoId: item.productoId,
                    cantidad: item.cantidad,
                    estado: "pendiente",
                    cantidadStockProcesada: 0
                })),
                responsableNombre: usuario?.nombre,
                estado: "pendiente",
                fechaCreacion: new Date().toISOString()
            };
            setComandas((actuales) => [nuevaComanda, ...actuales]);
            if (mesaId !== undefined) {
                setMesas((actuales) => actuales.map((mesa) =>
                    mesa.id === mesaId ? { ...mesa, estado: "ocupada" } : mesa
                ));
            }
            // La confirmación ya quedó guardada; sincronizamos el resto en segundo plano.
            void refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo crear la comanda.");
            return false;
        }
    };

    const cambiarEstadoMesa = async (
        mesaId: number,
        estado: "libre" | "ocupada"
    ): Promise<boolean> => {
        if (obtenerComandaActivaDeMesa(comandas, mesaId)) {
            setErrorDatos("No se puede cambiar el estado manual de una mesa con una comanda activa.");
            return false;
        }
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.cambiarEstadoMesa(mesaId, estado);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo cambiar el estado de la mesa.");
            return false;
        }
    };

    const finalizarComanda = async (
        comandaId: number
    ): Promise<boolean> => {
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.finalizarComanda(comandaId);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo marcar la comanda como entregada.");
            return false;
        }
    };

    const cancelarComanda = async (
        comandaId: number
    ): Promise<boolean> => {
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.cancelarComanda(comandaId);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo cancelar la comanda.");
            return false;
        }
    };

    const agregarProductosAComanda = async (
        comandaId: number,
        productosNuevos: ProductoComanda[]
    ): Promise<boolean> => {
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.agregarProductosAComanda(comandaId, productosNuevos);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudieron agregar productos a la comanda.");
            return false;
        }
    };

    const editarComanda = async (
    comandaId: number,
    productosNuevos: ProductoComanda[]
): Promise<boolean> => {
        if (!productosNuevos.length) return false;
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.editarComanda(comandaId, productosNuevos);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo editar la comanda.");
            return false;
        }
    };

    const obtenerComandaDeMesa = (
        mesaId: number
    ) => {

        return obtenerComandaActivaDeMesa(comandas, mesaId);
    };

    const cambiarEstadoProducto = async (
        comandaId: number,
        productoId: number,
        estado: "preparando" | "listo"
    ): Promise<boolean> => {
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.cambiarEstadoItemComanda(comandaId, productoId, estado);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo cambiar el estado del producto.");
            return false;
        }
    };

    const crearMesaMapa = (capacidad: number): Mesa => ({
            id: Math.max(0, ...mesas.map((mesa) => mesa.id)) + 1,
            numero: Math.max(0, ...mesas.map((mesa) => mesa.numero)) + 1,
            capacidad,
            estado: "libre"
        });

    // Persiste el plano y sincroniza la numeración; el estado libre/ocupada no se altera.
    const guardarElementosMapa = async (
        mesasCandidatas: Mesa[],
        elementos: ElementoMapa[],
        idsEliminar: string[] = []
    ): Promise<{ success: boolean; error?: string }> => {
        const sincronizados = sincronizarMesasConMapa(mesasCandidatas, elementos);
        try {
            await repositorioSupabaseCatalogo.guardarMapa(
                sincronizados.mesas,
                sincronizados.elementos,
                idsEliminar
            );
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Error desconocido al guardar en Supabase."
            };
        }
        setMesas(sincronizados.mesas);
        setElementosMapa(sincronizados.elementos);
        localStorage.setItem(MAPA_STORAGE_KEY, JSON.stringify(sincronizados.elementos));
        return { success: true };
    };

    const agregarElementoMapa = async (elemento: ElementoMapa): Promise<{ success: boolean; error?: string }> => {
        const nuevos = [...elementosMapa, elemento];
        let mesasCandidatas = mesas;
        if (elemento.tipo === "mesa" && elemento.mesaId !== undefined && !mesas.some((mesa) => mesa.id === elemento.mesaId)) {
            mesasCandidatas = [...mesas, {
                id: elemento.mesaId,
                numero: Math.max(0, ...mesas.map((mesa) => mesa.numero)) + 1,
                capacidad: elemento.capacidad ?? 4,
                estado: "libre"
            }];
        }
        return guardarElementosMapa(mesasCandidatas, nuevos);
    };

    const eliminarElementoMapa = async (id: string): Promise<{ success: boolean; error?: string }> => {
        const elementoEliminado = elementosMapa.find((elemento) => elemento.id === id);
        const nuevos = elementosMapa.filter((elemento) => elemento.id !== id);
        if (!elementoEliminado) return { success: false, error: "No se encontró el elemento seleccionado." };
        return guardarElementosMapa(mesas, nuevos, [id]);
    };

    const editarElementoMapa = async (elementoActualizado: ElementoMapa): Promise<{ success: boolean; error?: string }> => {
        const nuevos = elementosMapa.map((elemento) =>
            elemento.id === elementoActualizado.id ? elementoActualizado : elemento
        );
        if (!elementosMapa.some((elemento) => elemento.id === elementoActualizado.id)) {
            return { success: false, error: "No se encontró el elemento seleccionado." };
        }
        return guardarElementosMapa(mesas, nuevos);
    };

    // Empleados 

    const agregarEmpleado = async (
        nombre: string,
        email: string,
        password: string,
        rol: RolEmpleado
    ): Promise<void> => {
        const empleado = await repositorioPersonal.crear({ nombre, email, password, rol });
        setEmpleados((actuales) => [...actuales, empleado]);
    };

    const editarEmpleado = async (
        id: string,
        nombre: string,
        email: string,
        password: string,
        rol: RolEmpleado
    ): Promise<void> => {
        const actualizado = await repositorioPersonal.editar(id, {
            nombre,
            email,
            ...(password ? { password } : {}),
            rol
        });
        setEmpleados((actuales) => actuales.map((empleado) => empleado.id === id ? actualizado : empleado));
    };

    const cambiarEstadoEmpleado = async (id: string, activo: boolean): Promise<void> => {
        const actualizado = await repositorioPersonal.cambiarEstado(id, activo);
        setEmpleados((actuales) => actuales.map((empleado) => empleado.id === id ? actualizado : empleado));
    };

    // ==========================
    // REGISTRAR PRODUCCIÓN
    // ==========================

    const registrarProduccion = async (
        productoId: number,
        cantidad: number
    ): Promise<boolean> => {
        const producto = productos.find((actual) => actual.id === productoId);
        const receta = recetas.find((actual) => actual.productoId === productoId);
        if (!Number.isFinite(cantidad) || cantidad <= 0 || producto?.tipoElaboracion !== 'preelaborado' || !receta) {
            return false;
        }
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.registrarProduccion(productoId, cantidad);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : 'No se pudo registrar la producción.');
            return false;
        }
    };

// ==========================
// PROCESAR STOCK COMANDA
// ==========================

const procesarStockComanda = async (
    comandaId: number
): Promise<boolean> => {
    try {
        setErrorDatos(null);
        const procesada = await repositorioSupabaseCatalogo.procesarStockComanda(comandaId);
        if (!procesada) return false;
        setComandas((actuales) => actuales.map((comanda) => comanda.id === comandaId
            ? {
                ...comanda,
                estado: "preparando",
                productos: comanda.productos.map((item) => ({
                    ...item,
                    cantidadStockProcesada: item.cantidad
                }))
            }
            : comanda
        ));
        void refrescarTrasOperacion();
        return true;
    } catch (error) {
        setErrorDatos(error instanceof Error ? error.message : "No se pudo procesar el stock de la comanda.");
        return false;
    }
};

    // ==========================
    // PRODUCTOS
    // ==========================

    const agregarProducto = async (
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
            | "reventa",
        stockInicial = 0
    ): Promise<{ creado: boolean; stockRegistrado: boolean }> => {
        try {
            const nuevoProducto = await repositorioSupabaseCatalogo.crearProducto({
                nombre, precio, categoria, sector, tipoElaboracion
            }) as Producto;
            setProductos((actuales) => [...actuales, nuevoProducto]);
            if (tipoElaboracion !== "reventa" || stockInicial === 0) {
                return { creado: true, stockRegistrado: true };
            }

            try {
                await repositorioSupabaseCatalogo.registrarMovimientoStock(
                    nuevoProducto.id,
                    "producto",
                    "entrada",
                    stockInicial,
                    `Stock inicial de ${stockInicial} ${nuevoProducto.unidadVenta} de ${nuevoProducto.nombre} para reventa`
                );
                await refrescarTrasOperacion();
                return { creado: true, stockRegistrado: true };
            } catch (error) {
                setErrorDatos(error instanceof Error ? error.message : "No se pudo registrar el stock inicial.");
                return { creado: true, stockRegistrado: false };
            }
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo crear el producto.");
            return { creado: false, stockRegistrado: false };
        }
    };

    const editarProducto = async (
        id: number,
        nombre: string,
        precio: number,
        categoria: string,
        sector: string,
        tipoElaboracion:
            | "bajo_pedido"
            | "preelaborado"
            | "reventa"
    ): Promise<boolean> => {
        try {
            const actualizado = await repositorioSupabaseCatalogo.editarProducto(id, {
                nombre, precio, categoria, sector, tipoElaboracion
            }) as Producto;
            setProductos((actuales) => actuales.map((producto) => producto.id === id ? actualizado : producto));
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo actualizar el producto.");
            return false;
        }
    };

    const editarStockMinimoProducto = async (id: number, stockMinimo: number): Promise<boolean> => {
        if (!Number.isFinite(stockMinimo) || stockMinimo < 0 || !productos.some((producto) => producto.id === id)) {
            return false;
        }
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.editarStockMinimoProducto(id, stockMinimo);
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo actualizar el stock mínimo del producto.");
            return false;
        }
    };

    const eliminarProductoCatalogo = async (id: number): Promise<boolean> => {
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

        try {
            await repositorioSupabaseCatalogo.eliminarProducto(id);
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo eliminar el producto.");
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

    const cambiarEstadoProductoCatalogo = async (
        id: number,
        activo: boolean
    ): Promise<boolean> => {
        try {
            await repositorioSupabaseCatalogo.cambiarEstadoProducto(id, activo);
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo actualizar el producto.");
            return false;
        }
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
        return true;
    };

    // ==========================
    // MATERIAS PRIMAS
    // ==========================

    const cambiarEstadoMateriaPrima = async (
        id: number,
        activo: boolean
    ): Promise<boolean> => {
        try {
            await repositorioSupabaseCatalogo.cambiarEstadoMateriaPrima(id, activo);
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo actualizar la materia prima.");
            return false;
        }
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
        return true;
    };

    const editarMateriaPrima = async (
        id: number,
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number
    ): Promise<boolean> => {
        let actualizada: MateriaPrima;
        try {
            actualizada = await repositorioSupabaseCatalogo.editarMateriaPrima(id, {
                nombre, categoria, unidad, stockMinimo
            }) as MateriaPrima;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo actualizar la materia prima.");
            return false;
        }
        setMateriasPrimas((materiasActuales) =>
            materiasActuales.map((materia) =>
                materia.id === id
                    ? actualizada as MateriaPrima
                    : materia
            )
        );
        return true;
    };

    const registrarEntradaProducto = async (
        productoId: number,
        cantidad: number
    ): Promise<boolean> => {
        const producto = productos.find((actual) => actual.id === productoId);
        if (!Number.isInteger(cantidad) || cantidad <= 0 || producto?.tipoElaboracion !== 'reventa') {
            return false;
        }
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.registrarMovimientoStock(
                productoId,
                'producto',
                'entrada',
                cantidad,
                `Ingreso de ${cantidad} ${producto.unidadVenta} de ${producto.nombre} para reventa`
            );
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : 'No se pudo registrar la entrada de producto.');
            return false;
        }
    };

    const registrarEntradaMateriaPrima = async (
        materiaPrimaId: number,
        cantidad: number
    ): Promise<boolean> => {
        const materia = materiasPrimas.find((actual) => actual.id === materiaPrimaId);
        if (!materia || !Number.isFinite(cantidad) || cantidad <= 0) return false;
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.registrarMovimientoStock(
                materiaPrimaId,
                'materiaPrima',
                'entrada',
                cantidad,
                `Entrada de ${cantidad} ${materia.unidad} de ${materia.nombre}`
            );
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : 'No se pudo registrar la entrada de stock.');
            return false;
        }
    };
    const agregarMateriaPrima = async (
        nombre: string,
        categoria: string,
        unidad: MateriaPrima["unidad"],
        stockMinimo: number,
        stockInicial: number
    ): Promise<boolean> => {
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

        try {
            const nuevaMateria = await repositorioSupabaseCatalogo.crearMateriaPrima({
                nombre, categoria, unidad, stockMinimo
            }, stockInicial) as MateriaPrima;
            setMateriasPrimas((actuales) => [...actuales, nuevaMateria]);
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo crear la materia prima.");
            return false;
        }
    };

    const registrarSalidaMateriaPrima = async (
        materiaPrimaId: number,
        cantidad: number
    ): Promise<boolean> => {
        const materia = materiasPrimas.find((actual) => actual.id === materiaPrimaId);
        if (!materia || !Number.isFinite(cantidad) || cantidad <= 0) return false;
        try {
            setErrorDatos(null);
            await repositorioSupabaseCatalogo.registrarMovimientoStock(
                materiaPrimaId,
                'materiaPrima',
                'salida',
                cantidad,
                `Salida de ${cantidad} ${materia.unidad} de ${materia.nombre}`
            );
            await refrescarTrasOperacion();
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : 'No se pudo registrar la salida de stock.');
            return false;
        }
    };
    // ==========================
    // RECETAS
    // ==========================

    const agregarReceta = async (
        productoId: number,
        ingredientes: IngredienteReceta[]
    ): Promise<boolean> => {

        const recetaExistente =
            recetas.find(
                (receta) =>
                    receta.productoId ===
                    productoId
            );

        if (recetaExistente) {
            return false;
        }

        try {
            const id = await repositorioSupabaseCatalogo.guardarReceta(productoId, ingredientes);
            setRecetas((actuales) => [...actuales, { id, productoId, ingredientes }]);
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo guardar la receta.");
            return false;
        }
    };

    const editarReceta = async (
        recetaId: number,
        ingredientes: IngredienteReceta[]
    ): Promise<boolean> => {
        const receta = recetas.find((actual) => actual.id === recetaId);
        if (!receta) return false;
        try {
            const idPersistido = await repositorioSupabaseCatalogo.guardarReceta(receta.productoId, ingredientes);
            setRecetas((actuales) => actuales.map((item) => item.id === recetaId
                ? { ...item, id: idPersistido, ingredientes }
                : item));
            return true;
        } catch (error) {
            setErrorDatos(error instanceof Error ? error.message : "No se pudo guardar la receta.");
            return false;
        }
    };

    return (
        <CafeteriaContext.Provider
            value={{

                estadoDatos,
                errorDatos,
                recargarDatos,

                mesas,
                cambiarEstadoMesa,

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
                editarStockMinimoProducto,
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
                actividad,
                auditoriaDisponible,

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

// El provider y su hook se mantienen juntos porque comparten el contexto privado.
// oxlint-disable-next-line react/only-export-components
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
