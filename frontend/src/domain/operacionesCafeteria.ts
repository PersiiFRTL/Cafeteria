// Lógica de negocio pura: transforma datos y la usa CafeteriaContext.
// A diferencia del archivo .test.cjs, aquí no se preparan escenarios ni se hacen aserciones.
export type EstadoProductoComanda = "pendiente" | "preparando" | "listo";
export type EstadoComanda = "pendiente" | "preparando" | "lista" | "finalizada" | "cancelada";

export interface ProductoComandaOperacion {
    productoId: number;
    cantidad: number;
    estado: EstadoProductoComanda;
    cantidadStockProcesada: number;
}

export interface ComandaOperacion {
    id: number;
    tipoAtencion: "mesa" | "take-away";
    mesaId?: number;
    clienteTakeAway?: { nombre: string; telefono: string };
    horaRetiro?: string;
    productos: ProductoComandaOperacion[];
    estado: EstadoComanda;
    fechaCreacion: string;
}

export interface MesaOperacion {
    id: number;
    estado: "libre" | "ocupada";
}

export interface MateriaPrimaOperacion {
    id: number;
    nombre: string;
    stockActual: number;
}

// Cuenta las comandas finalizadas cuya fecha de creación corresponde al día indicado.
export function contarComandasFinalizadasDelDia<T extends { estado: string; fechaCreacion: string }>(
    comandas: T[],
    fechaReferencia: Date
): number {
    return comandas.filter((comanda) => {
        const fechaComanda = new Date(comanda.fechaCreacion);
        return comanda.estado === "finalizada" &&
            fechaComanda.getFullYear() === fechaReferencia.getFullYear() &&
            fechaComanda.getMonth() === fechaReferencia.getMonth() &&
            fechaComanda.getDate() === fechaReferencia.getDate();
    }).length;
}

// Calcula el estado general a partir del avance de sus productos.
export function calcularEstadoComanda(
    productos: ProductoComandaOperacion[]
): EstadoComanda {
    if (productos.length === 0) return "pendiente";
    if (productos.every((producto) => producto.estado === "listo")) return "lista";
    if (productos.some((producto) => producto.estado === "preparando" || producto.estado === "listo")) {
        return "preparando";
    }
    return "pendiente";
}

// Construye una comanda pendiente y ocupa su mesa, si corresponde.
export function crearComandaEnMemoria<TMesa extends MesaOperacion>(
    comandas: ComandaOperacion[],
    mesas: TMesa[],
    mesaId: number | undefined,
    productos: ProductoComandaOperacion[],
    fechaCreacion: string,
    datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
): { comanda: ComandaOperacion; mesas: TMesa[] } {
    const comanda: ComandaOperacion = {
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
        productos: productos.map((producto) => ({
            ...producto,
            cantidadStockProcesada: producto.cantidadStockProcesada ?? 0
        })),
        estado: "pendiente",
        fechaCreacion
    };

    return {
        comanda,
        mesas: mesaId === undefined
            ? mesas
            : mesas.map((mesa) => mesa.id === mesaId ? { ...mesa, estado: "ocupada" as const } as TMesa : mesa)
    };
}

// Devuelve una comanda de la mesa que todavía no fue cerrada.
export function obtenerComandaActivaDeMesa<TComanda extends ComandaOperacion>(
    comandas: TComanda[],
    mesaId: number
): TComanda | undefined {
    return comandas.find((comanda) =>
        comanda.mesaId === mesaId &&
        comanda.estado !== "finalizada" &&
        comanda.estado !== "cancelada"
    );
}

// Agrega cantidades o productos y marca lo añadido como pendiente.
export function agregarProductosPendientesAComanda(
    comandas: ComandaOperacion[],
    comandaId: number,
    productosNuevos: ProductoComandaOperacion[]
): ComandaOperacion[] {
    return comandas.map((comanda) => {
        if (comanda.id !== comandaId) return comanda;

        const productosActualizados = comanda.productos.map((producto) => ({ ...producto }));
        productosNuevos.forEach((productoNuevo) => {
            const existente = productosActualizados.find(
                (producto) => producto.productoId === productoNuevo.productoId
            );
            if (existente) {
                existente.cantidad += productoNuevo.cantidad;
                existente.estado = "pendiente";
                return;
            }
            productosActualizados.push({
                ...productoNuevo,
                estado: "pendiente",
                cantidadStockProcesada: productoNuevo.cantidadStockProcesada ?? 0
            });
        });

        const estado = calcularEstadoComanda(productosActualizados);
        return { ...comanda, productos: productosActualizados, estado };
    });
}

// Finaliza la comanda y libera la mesa asociada; devuelve null si no existe.
export function finalizarComandaYLiberarMesa<TMesa extends MesaOperacion>(
    comandas: ComandaOperacion[],
    mesas: TMesa[],
    comandaId: number
): { comandas: ComandaOperacion[]; mesas: TMesa[] } | null {
    const comanda = comandas.find((item) => item.id === comandaId);
    if (!comanda) return null;

    return {
        comandas: comandas.map((item) => item.id === comandaId
            ? { ...item, estado: "finalizada" as const }
            : item),
        mesas: mesas.map((mesa) => mesa.id === comanda.mesaId
            ? { ...mesa, estado: "libre" as const } as TMesa
            : mesa)
    };
}

// Descuenta stock sin mutar el arreglo; devuelve null si la salida no es válida.
export function descontarStockMateriaPrima<T extends MateriaPrimaOperacion>(
    materiasPrimas: T[],
    materiaPrimaId: number,
    cantidad: number
): T[] | null {
    const materia = materiasPrimas.find((item) => item.id === materiaPrimaId);
    if (!materia || !Number.isFinite(cantidad) || cantidad <= 0 || materia.stockActual < cantidad) {
        return null;
    }

    return materiasPrimas.map((item) => item.id === materiaPrimaId
        ? { ...item, stockActual: item.stockActual - cantidad }
        : item);
}
