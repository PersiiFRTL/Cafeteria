import { solicitarApiAutenticada } from "./apiAutenticada";
import type { ElementoMapa } from "../types/mapa";

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    categoria: string;
    sector: string;
    tipoElaboracion: "bajo_pedido" | "preelaborado" | "reventa";
    unidadVenta: "unidad" | "porcion" | "litro" | "kg";
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
    disponible: boolean;
}

interface MateriaPrima {
    id: number;
    nombre: string;
    categoria: string;
    unidad: "unidad" | "kg" | "litro";
    stockActual: number;
    stockMinimo: number;
    activo: boolean;
}

interface Receta {
    id: number;
    productoId: number;
    ingredientes: Array<{ materiaPrimaId: number; cantidad: number }>;
}

interface Mesa {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

type ProductoInput = Pick<Producto, "nombre" | "precio" | "categoria" | "sector" | "tipoElaboracion">;
type MateriaPrimaInput = Pick<MateriaPrima, "nombre" | "categoria" | "unidad" | "stockMinimo">;

export interface DatosCafeteriaConMapa {
    mesas: Mesa[];
    productos: Producto[];
    materiasPrimas: MateriaPrima[];
    recetas: Receta[];
    elementosMapa: ElementoMapa[];
    comandas: Array<Record<string, unknown>>;
    operacionesStock: Array<Record<string, unknown>>;
    movimientosStock: Array<Record<string, unknown>>;
    producciones: Array<{
        id: number;
        productoId: number;
        cantidad: number;
        fecha: string;
        responsableNombre?: string;
        ingredientes: Array<{ materiaPrimaId: number; cantidad: number }>;
    }>;
    actividad: Array<{
        id: number;
        usuarioNombre: string;
        entidad: string;
        entidadId: string;
        accion: string;
        detalle: string;
        fecha: string;
    }>;
    auditoriaDisponible: boolean;
}

interface MesaRemota {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

function mapearProducto(row: Record<string, unknown>): Producto {
    return {
        id: Number(row.id),
        nombre: String(row.nombre),
        precio: Number(row.precio),
        categoria: String(row.categoria),
        sector: String(row.sector),
        tipoElaboracion: row.tipo_elaboracion as Producto["tipoElaboracion"],
        unidadVenta: row.unidad_venta as Producto["unidadVenta"],
        stockActual: Number(row.stock_actual),
        stockMinimo: Number(row.stock_minimo),
        activo: Boolean(row.activo),
        disponible: Boolean(row.disponible)
    };
}

function mapearMateriaPrima(row: Record<string, unknown>): MateriaPrima {
    return {
        id: Number(row.id),
        nombre: String(row.nombre),
        categoria: String(row.categoria),
        unidad: row.unidad as MateriaPrima["unidad"],
        stockActual: Number(row.stock_actual),
        stockMinimo: Number(row.stock_minimo),
        activo: Boolean(row.activo)
    };
}

function mapearReceta(row: Record<string, unknown>): Receta {
    const ingredientes = (row.ingredientes ?? []) as Array<Record<string, unknown>>;
    return {
        id: Number(row.id),
        productoId: Number(row.producto_id),
        ingredientes: ingredientes.map((ingrediente) => ({
            materiaPrimaId: Number(ingrediente.materia_prima_id),
            cantidad: Number(ingrediente.cantidad)
        }))
    };
}

function mapearMesa(row: Record<string, unknown>): MesaRemota {
    return {
        id: Number(row.id),
        numero: Number(row.numero),
        capacidad: Number(row.capacidad),
        estado: row.estado as MesaRemota["estado"]
    };
}

function mapearElementoMapa(row: Record<string, unknown>): ElementoMapa {
    const mesaRelacionada = row.mesa as { capacidad?: number } | null;
    return {
        id: String(row.id),
        tipo: row.tipo as ElementoMapa["tipo"],
        x: Number(row.x),
        y: Number(row.y),
        ancho: Number(row.ancho),
        alto: Number(row.alto),
        rotacion: Number(row.rotacion),
        ...(row.mesa_id === null ? {} : { mesaId: Number(row.mesa_id) }),
        ...(mesaRelacionada?.capacidad === undefined ? {} : { capacidad: Number(mesaRelacionada.capacidad) }),
        ...(row.grosor === null ? {} : { grosor: Number(row.grosor) })
    };
}

function mapearComanda(row: Record<string, unknown>, nombresPorId: Map<string, string>): Record<string, unknown> {
    const clienteNombre = row.cliente_nombre;
    const clienteTelefono = row.cliente_telefono;
    const horaRetiro = row.hora_retiro;
    const items = (row.productos ?? []) as Array<Record<string, unknown>>;
    return {
        id: Number(row.id),
        tipoAtencion: row.tipo_atencion as "mesa" | "take-away",
        ...(row.mesa_id === null ? {} : { mesaId: Number(row.mesa_id) }),
        ...(row.tipo_atencion === "take-away" ? {
            clienteTakeAway: {
                nombre: String(clienteNombre ?? ""),
                telefono: String(clienteTelefono ?? "")
            },
            horaRetiro: String(horaRetiro ?? "")
        } : {}),
        productos: items.map((item) => ({
            productoId: Number(item.producto_id),
            cantidad: Number(item.cantidad),
            estado: item.estado as "pendiente" | "preparando" | "listo",
            cantidadStockProcesada: Number(item.cantidad_stock_procesada ?? 0),
            nombreProducto: String(item.nombre_producto),
            precioUnitario: Number(item.precio_unitario)
        })),
        ...(typeof row.creada_por === "string" && nombresPorId.has(row.creada_por)
            ? { responsableNombre: nombresPorId.get(row.creada_por) }
            : {}),
        estado: row.estado as "pendiente" | "preparando" | "lista" | "finalizada" | "cancelada",
        fechaCreacion: String(row.fecha_creacion)
    };
}

function mapearOperacionStock(row: Record<string, unknown>, nombresPorId: Map<string, string>): Record<string, unknown> {
    const movimientos = (row.movimientos ?? []) as Array<Record<string, unknown>>;
    return {
        id: Number(row.id),
        tipo: row.tipo,
        referenciaId: Number(row.comanda_id ?? row.produccion_id ?? row.id),
        fecha: String(row.fecha),
        descripcion: String(row.descripcion ?? ""),
        ...(typeof row.creada_por === "string" && nombresPorId.has(row.creada_por)
            ? { responsableNombre: nombresPorId.get(row.creada_por) }
            : {}),
        movimientos: movimientos.map(mapearMovimientoStock)
    };
}

function mapearMovimientoStock(row: Record<string, unknown>): Record<string, unknown> {
    const esMateriaPrima = row.materia_prima_id !== null;
    return {
        id: Number(row.id),
        tipo: row.tipo,
        categoria: esMateriaPrima ? "materiaPrima" : "producto",
        referenciaId: Number(esMateriaPrima ? row.materia_prima_id : row.producto_id),
        cantidad: Number(row.cantidad),
        fecha: String(row.fecha),
        descripcion: String(row.descripcion ?? "")
    };
}

/** Lee los datos operativos persistidos en Supabase. */
export const repositorioSupabaseCatalogo = {
    async cargarDatosIniciales(): Promise<DatosCafeteriaConMapa> {
        type RegistroRemoto = Record<string, unknown>;
        const datos = await solicitarApiAutenticada<{
                productos: RegistroRemoto[];
                materiasPrimas: RegistroRemoto[];
                recetas: RegistroRemoto[];
                mesas: RegistroRemoto[];
                elementosMapa: RegistroRemoto[];
                comandas: RegistroRemoto[];
                operacionesStock: RegistroRemoto[];
                producciones: RegistroRemoto[];
                auditoriaEventos: RegistroRemoto[];
                auditoriaDisponible: boolean;
                perfiles: Array<{ id: string; nombre: string }>;
            }>("/api/datos-iniciales");

        const nombresPorId = new Map(datos.perfiles.map((perfil) => [perfil.id, perfil.nombre]));
        const comandasMapeadas = datos.comandas.map((row) =>
            mapearComanda(row as Record<string, unknown>, nombresPorId)
        );
        const operacionesMapeadas = datos.operacionesStock.map((row) =>
            mapearOperacionStock(row as Record<string, unknown>, nombresPorId)
        );
        const movimientosMapeados = operacionesMapeadas.flatMap((operacion) =>
            operacion.movimientos as Array<Record<string, unknown>>
        );
        const produccionesMapeadas = datos.producciones.map((row) => {
            const produccion = row as Record<string, unknown>;
            const operacionProduccion = datos.operacionesStock.find((item) =>
                Number((item as Record<string, unknown>).produccion_id) === Number(produccion.id)
            ) as Record<string, unknown> | undefined;
            const movimientos = ((operacionProduccion?.movimientos ?? []) as Array<Record<string, unknown>>)
                .filter((item) => item.materia_prima_id !== null);
            return {
                id: Number(produccion.id),
                productoId: Number(produccion.producto_id),
                cantidad: Number(produccion.cantidad),
                fecha: String(produccion.fecha),
                ...(typeof produccion.creada_por === "string" && nombresPorId.has(produccion.creada_por)
                    ? { responsableNombre: nombresPorId.get(produccion.creada_por) }
                    : {}),
                ingredientes: movimientos.map((item) => ({
                    materiaPrimaId: Number(item.materia_prima_id),
                    cantidad: Number(item.cantidad)
                }))
            };
        });
        const actividadMapeada = datos.auditoriaEventos.map((row) => {
            const evento = row as Record<string, unknown>;
            return {
                id: Number(evento.id),
                usuarioNombre: String(evento.usuario_nombre ?? "Usuario"),
                entidad: String(evento.entidad),
                entidadId: String(evento.entidad_id),
                accion: String(evento.accion),
                detalle: String(evento.detalle),
                fecha: String(evento.fecha)
            };
        });

        return {
            mesas: datos.mesas.map((row) => mapearMesa(row as Record<string, unknown>)),
            productos: datos.productos.map((row) => mapearProducto(row as Record<string, unknown>)),
            materiasPrimas: datos.materiasPrimas.map((row) => mapearMateriaPrima(row as Record<string, unknown>)),
            recetas: datos.recetas.map((row) => mapearReceta(row as Record<string, unknown>)),
            elementosMapa: datos.elementosMapa.map((row) => mapearElementoMapa(row as Record<string, unknown>)),
            comandas: comandasMapeadas,
            operacionesStock: operacionesMapeadas,
            movimientosStock: movimientosMapeados,
            producciones: produccionesMapeadas,
            actividad: actividadMapeada,
            auditoriaDisponible: datos.auditoriaDisponible
        };
    },

    async crearComanda(
        mesaId: number | undefined,
        productos: Array<{ productoId: number; cantidad: number }>,
        datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
    ): Promise<number> {
        const respuesta = await solicitarApiAutenticada<{ data: number }>("/api/comandas", {
            method: "POST",
            body: JSON.stringify({
                mesaId: mesaId ?? null,
                productos: productos.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
                clienteNombre: datosTakeAway?.nombre ?? null,
                clienteTelefono: datosTakeAway?.telefono ?? null,
                horaRetiro: datosTakeAway?.horaRetiro ?? null
            })
        });
        return Number(respuesta.data);
    },

    async cambiarEstadoMesa(mesaId: number, estado: "libre" | "ocupada"): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/mesas/${mesaId}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ estado })
        });
    },

    async editarComanda(comandaId: number, productos: Array<{ productoId: number; cantidad: number }>): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/comandas/${comandaId}`, {
            method: "PATCH",
            body: JSON.stringify({ productos })
        });
    },

    async agregarProductosAComanda(comandaId: number, productos: Array<{ productoId: number; cantidad: number }>): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/comandas/${comandaId}/productos`, {
            method: "POST",
            body: JSON.stringify({ productos })
        });
    },

    async procesarStockComanda(comandaId: number): Promise<boolean> {
        const respuesta = await solicitarApiAutenticada<{ data: boolean }>(`/api/comandas/${comandaId}/procesar-stock`, {
            method: "POST"
        });
        return Boolean(respuesta.data);
    },

    async cambiarEstadoItemComanda(
        comandaId: number,
        productoId: number,
        estado: "preparando" | "listo"
    ): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/comandas/${comandaId}/items/${productoId}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ estado })
        });
    },

    async finalizarComanda(comandaId: number): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/comandas/${comandaId}/finalizar`, { method: "POST" });
    },

    async cancelarComanda(comandaId: number): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/comandas/${comandaId}/cancelar`, { method: "POST" });
    },

    async registrarMovimientoStock(
        referenciaId: number,
        categoria: "materiaPrima" | "producto",
        tipo: "entrada" | "salida",
        cantidad: number,
        descripcion: string
    ): Promise<void> {
        await solicitarApiAutenticada<void>("/api/stock/movimientos", {
            method: "POST",
            body: JSON.stringify({
                materiaPrimaId: categoria === "materiaPrima" ? referenciaId : null,
                productoId: categoria === "producto" ? referenciaId : null,
                tipo,
                cantidad,
                descripcion
            })
        });
    },

    async registrarProduccion(productoId: number, cantidad: number): Promise<void> {
        await solicitarApiAutenticada<void>("/api/producciones", {
            method: "POST",
            body: JSON.stringify({ productoId, cantidad })
        });
    },

    async guardarMapa(
        mesas: MesaRemota[],
        elementos: ElementoMapa[],
        idsEliminar: string[] = []
    ): Promise<void> {
        await solicitarApiAutenticada<void>("/api/mapa", {
            method: "PUT",
            body: JSON.stringify({
                mesas: mesas.map((mesa) => ({
                    id: mesa.id,
                    numero: mesa.numero,
                    capacidad: mesa.capacidad
                })),
                elementos: elementos.map((elemento) => ({
                    id: elemento.id,
                    tipo: elemento.tipo,
                    x: elemento.x,
                    y: elemento.y,
                    ancho: elemento.ancho,
                    alto: elemento.alto,
                    rotacion: elemento.rotacion,
                    mesaId: elemento.mesaId ?? null,
                    grosor: elemento.grosor ?? null
                })),
                idsEliminar
            })
        });
    },

    async crearProducto(input: ProductoInput): Promise<Producto> {
        const respuesta = await solicitarApiAutenticada<{ data: Record<string, unknown> }>("/api/productos", {
            method: "POST",
            body: JSON.stringify({
                nombre: input.nombre.trim(),
                precio: input.precio,
                categoria: input.categoria.trim(),
                sector: input.sector,
                tipoElaboracion: input.tipoElaboracion
            })
        });
        return mapearProducto(respuesta.data);
    },

    async editarProducto(id: number, input: ProductoInput): Promise<Producto> {
        const respuesta = await solicitarApiAutenticada<{ data: Record<string, unknown> }>(`/api/productos/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                nombre: input.nombre.trim(),
                precio: input.precio,
                categoria: input.categoria.trim(),
                sector: input.sector,
                tipoElaboracion: input.tipoElaboracion
            })
        });
        return mapearProducto(respuesta.data);
    },

    async editarStockMinimoProducto(id: number, stockMinimo: number): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/productos/${id}/stock-minimo`, {
            method: "PATCH",
            body: JSON.stringify({ stockMinimo })
        });
    },

    async eliminarProducto(id: number): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/productos/${id}`, { method: "DELETE" });
    },

    async cambiarEstadoProducto(id: number, activo: boolean): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/productos/${id}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ activo })
        });
    },

    async crearMateriaPrima(input: MateriaPrimaInput, stockInicial: number): Promise<MateriaPrima> {
        const respuesta = await solicitarApiAutenticada<{ data: Record<string, unknown> }>("/api/materias-primas", {
            method: "POST",
            body: JSON.stringify({
                nombre: input.nombre.trim(),
                categoria: input.categoria.trim(),
                unidad: input.unidad,
                stockMinimo: input.stockMinimo,
                stockInicial
            })
        });
        return mapearMateriaPrima(respuesta.data);
    },

    async editarMateriaPrima(id: number, input: MateriaPrimaInput): Promise<MateriaPrima> {
        const respuesta = await solicitarApiAutenticada<{ data: Record<string, unknown> }>(`/api/materias-primas/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                nombre: input.nombre.trim(),
                categoria: input.categoria.trim(),
                unidad: input.unidad,
                stockMinimo: input.stockMinimo
            })
        });
        return mapearMateriaPrima(respuesta.data);
    },

    async cambiarEstadoMateriaPrima(id: number, activo: boolean): Promise<void> {
        await solicitarApiAutenticada<void>(`/api/materias-primas/${id}/estado`, {
            method: "PATCH",
            body: JSON.stringify({ activo })
        });
    },

    async guardarReceta(productoId: number, ingredientes: Receta["ingredientes"]): Promise<number> {
        const respuesta = await solicitarApiAutenticada<{ data: number }>(`/api/recetas/${productoId}`, {
            method: "PUT",
            body: JSON.stringify({
                ingredientes: ingredientes.map((ingrediente) => ({
                    materiaPrimaId: ingrediente.materiaPrimaId,
                    cantidad: ingrediente.cantidad
                }))
            })
        });
        return Number(respuesta.data);
    }
};
