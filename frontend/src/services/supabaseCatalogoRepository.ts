import type { DatosInicialesCafeteria } from "./demoCafeteriaRepository";
import { repositorioDemo } from "./demoCafeteriaRepository";
import { supabase } from "./supabase";
import type { ElementoMapa } from "../types/mapa";

type Producto = DatosInicialesCafeteria["productos"][number];
type MateriaPrima = DatosInicialesCafeteria["materiasPrimas"][number];
type Receta = DatosInicialesCafeteria["recetas"][number];

type ProductoInput = Pick<Producto, "nombre" | "precio" | "categoria" | "sector" | "tipoElaboracion">;
type MateriaPrimaInput = Pick<MateriaPrima, "nombre" | "categoria" | "unidad" | "stockMinimo">;

export interface DatosCafeteriaConMapa extends Omit<DatosInicialesCafeteria, "producciones"> {
    elementosMapa: ElementoMapa[];
    comandas: Array<Record<string, unknown>>;
    operacionesStock: Array<Record<string, unknown>>;
    movimientosStock: Array<Record<string, unknown>>;
    producciones: Array<{
        id: number;
        productoId: number;
        cantidad: number;
        fecha: string;
        ingredientes: Array<{ materiaPrimaId: number; cantidad: number }>;
    }>;
}

interface MesaRemota {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

function mensajeError(error: { message: string }): Error {
    return new Error(error.message || "No se pudo guardar el cambio en Supabase.");
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

function mapearComanda(row: Record<string, unknown>): Record<string, unknown> {
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
        estado: row.estado as "pendiente" | "preparando" | "lista" | "finalizada" | "cancelada",
        fechaCreacion: String(row.fecha_creacion)
    };
}

function mapearOperacionStock(row: Record<string, unknown>): Record<string, unknown> {
    const movimientos = (row.movimientos ?? []) as Array<Record<string, unknown>>;
    return {
        id: Number(row.id),
        tipo: row.tipo,
        referenciaId: Number(row.comanda_id ?? row.produccion_id ?? row.id),
        fecha: String(row.fecha),
        descripcion: String(row.descripcion ?? ""),
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

/** Lee el catálogo de Supabase y conserva temporalmente el resto de datos de demostración. */
export const repositorioSupabaseCatalogo = {
    async cargarDatosIniciales(): Promise<DatosCafeteriaConMapa> {
        const datosDemo = await repositorioDemo.cargarDatosIniciales();
        const [productos, materiasPrimas, recetas, mesas, elementosMapa, comandas, operacionesStock, producciones] = await Promise.all([
            supabase.from("productos").select("*").order("id"),
            supabase.from("materias_primas").select("*").order("id"),
            supabase
                .from("recetas")
                .select("id, producto_id, ingredientes:receta_ingredientes(materia_prima_id, cantidad)")
                .order("id"),
            supabase.from("mesas").select("*").order("numero"),
            supabase
                .from("elementos_mapa")
                .select("id, tipo, x, y, ancho, alto, rotacion, mesa_id, grosor, mesa:mesas(capacidad)")
                .order("id"),
            supabase
                .from("comandas")
                .select("*, productos:comanda_items(*)")
                .order("fecha_creacion", { ascending: false }),
            supabase
                .from("operaciones_stock")
                .select("*, movimientos:movimientos_stock(*)")
                .order("fecha", { ascending: false }),
            supabase.from("producciones").select("*").order("fecha", { ascending: false })
        ]);

        if (productos.error) throw mensajeError(productos.error);
        if (materiasPrimas.error) throw mensajeError(materiasPrimas.error);
        if (recetas.error) throw mensajeError(recetas.error);
        if (mesas.error) throw mensajeError(mesas.error);
        if (elementosMapa.error) throw mensajeError(elementosMapa.error);
        if (comandas.error) throw mensajeError(comandas.error);
        if (operacionesStock.error) throw mensajeError(operacionesStock.error);
        if (producciones.error) throw mensajeError(producciones.error);

        const comandasMapeadas = (comandas.data ?? []).map((row) =>
            mapearComanda(row as Record<string, unknown>)
        );
        const operacionesMapeadas = (operacionesStock.data ?? []).map((row) =>
            mapearOperacionStock(row as Record<string, unknown>)
        );
        const movimientosMapeados = operacionesMapeadas.flatMap((operacion) =>
            operacion.movimientos as Array<Record<string, unknown>>
        );
        const produccionesMapeadas = (producciones.data ?? []).map((row) => {
            const produccion = row as Record<string, unknown>;
            const operacionProduccion = (operacionesStock.data ?? []).find((item) =>
                Number((item as Record<string, unknown>).produccion_id) === Number(produccion.id)
            ) as Record<string, unknown> | undefined;
            const movimientos = ((operacionProduccion?.movimientos ?? []) as Array<Record<string, unknown>>)
                .filter((item) => item.materia_prima_id !== null);
            return {
                id: Number(produccion.id),
                productoId: Number(produccion.producto_id),
                cantidad: Number(produccion.cantidad),
                fecha: String(produccion.fecha),
                ingredientes: movimientos.map((item) => ({
                    materiaPrimaId: Number(item.materia_prima_id),
                    cantidad: Number(item.cantidad)
                }))
            };
        });

        return {
            ...datosDemo,
            mesas: (mesas.data ?? []).map((row) => mapearMesa(row as Record<string, unknown>)),
            productos: (productos.data ?? []).map((row) => mapearProducto(row as Record<string, unknown>)),
            materiasPrimas: (materiasPrimas.data ?? []).map((row) => mapearMateriaPrima(row as Record<string, unknown>)),
            recetas: (recetas.data ?? []).map((row) => mapearReceta(row as Record<string, unknown>)),
            elementosMapa: (elementosMapa.data ?? []).map((row) => mapearElementoMapa(row as Record<string, unknown>)),
            comandas: comandasMapeadas,
            operacionesStock: operacionesMapeadas,
            movimientosStock: movimientosMapeados,
            producciones: produccionesMapeadas
        };
    },

    async crearComanda(
        mesaId: number | undefined,
        productos: Array<{ productoId: number; cantidad: number }>,
        datosTakeAway?: { nombre: string; telefono: string; horaRetiro: string }
    ): Promise<number> {
        const { data, error } = await supabase.rpc("crear_comanda", {
            p_mesa_id: mesaId ?? null,
            p_productos: productos.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
            p_cliente_nombre: datosTakeAway?.nombre ?? null,
            p_cliente_telefono: datosTakeAway?.telefono ?? null,
            p_hora_retiro: datosTakeAway?.horaRetiro ?? null
        });
        if (error) throw mensajeError(error);
        return Number(data);
    },

    async editarComanda(comandaId: number, productos: Array<{ productoId: number; cantidad: number }>): Promise<void> {
        const { error } = await supabase.rpc("editar_comanda", {
            p_comanda_id: comandaId,
            p_productos: productos.map(({ productoId, cantidad }) => ({ productoId, cantidad }))
        });
        if (error) throw mensajeError(error);
    },

    async agregarProductosAComanda(comandaId: number, productos: Array<{ productoId: number; cantidad: number }>): Promise<void> {
        const { error } = await supabase.rpc("agregar_productos_comanda", {
            p_comanda_id: comandaId,
            p_productos: productos.map(({ productoId, cantidad }) => ({ productoId, cantidad }))
        });
        if (error) throw mensajeError(error);
    },

    async procesarStockComanda(comandaId: number): Promise<boolean> {
        const { data, error } = await supabase.rpc("procesar_stock_comanda", {
            p_comanda_id: comandaId
        });
        if (error) throw mensajeError(error);
        return Boolean(data);
    },

    async cambiarEstadoItemComanda(
        comandaId: number,
        productoId: number,
        estado: "preparando" | "listo"
    ): Promise<void> {
        const { error } = await supabase.rpc("cambiar_estado_item_comanda", {
            p_comanda_id: comandaId,
            p_producto_id: productoId,
            p_estado: estado
        });
        if (error) throw mensajeError(error);
    },

    async finalizarComanda(comandaId: number): Promise<void> {
        const { error } = await supabase.rpc("finalizar_comanda", { p_comanda_id: comandaId });
        if (error) throw mensajeError(error);
    },

    async cancelarComanda(comandaId: number): Promise<void> {
        const { error } = await supabase.rpc("cancelar_comanda", { p_comanda_id: comandaId });
        if (error) throw mensajeError(error);
    },

    async registrarMovimientoStock(
        referenciaId: number,
        categoria: "materiaPrima" | "producto",
        tipo: "entrada" | "salida",
        cantidad: number,
        descripcion: string
    ): Promise<void> {
        const { error } = await supabase.rpc("registrar_movimiento_stock", {
            p_materia_prima_id: categoria === "materiaPrima" ? referenciaId : null,
            p_producto_id: categoria === "producto" ? referenciaId : null,
            p_tipo: tipo,
            p_cantidad: cantidad,
            p_descripcion: descripcion
        });
        if (error) throw mensajeError(error);
    },

    async registrarProduccion(productoId: number, cantidad: number): Promise<void> {
        const { error } = await supabase.rpc("registrar_produccion", {
            p_producto_id: productoId,
            p_cantidad: cantidad
        });
        if (error) throw mensajeError(error);
    },

    async guardarMapa(
        mesas: MesaRemota[],
        elementos: ElementoMapa[],
        idsEliminar: string[] = []
    ): Promise<void> {
        const { error } = await supabase.rpc("guardar_mapa", {
            p_mesas: mesas.map((mesa) => ({
                id: mesa.id,
                numero: mesa.numero,
                capacidad: mesa.capacidad
            })),
            p_elementos: elementos.map((elemento) => ({
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
            p_ids_eliminar: idsEliminar
        });
        if (error) throw mensajeError(error);
    },

    async crearProducto(input: ProductoInput): Promise<Producto> {
        const { data, error } = await supabase
            .from("productos")
            .insert({
                nombre: input.nombre.trim(),
                precio: input.precio,
                categoria: input.categoria.trim(),
                sector: input.sector,
                tipo_elaboracion: input.tipoElaboracion,
                unidad_venta: "unidad"
            })
            .select("*")
            .single();
        if (error) throw mensajeError(error);
        return mapearProducto(data as Record<string, unknown>);
    },

    async editarProducto(id: number, input: ProductoInput): Promise<Producto> {
        const { data, error } = await supabase
            .from("productos")
            .update({
                nombre: input.nombre.trim(),
                precio: input.precio,
                categoria: input.categoria.trim(),
                sector: input.sector,
                tipo_elaboracion: input.tipoElaboracion
            })
            .eq("id", id)
            .select("*")
            .single();
        if (error) throw mensajeError(error);
        return mapearProducto(data as Record<string, unknown>);
    },

    async eliminarProducto(id: number): Promise<void> {
        const { error } = await supabase.from("productos").delete().eq("id", id);
        if (error) throw mensajeError(error);
    },

    async cambiarEstadoProducto(id: number, activo: boolean): Promise<void> {
        const { error } = await supabase.from("productos").update({ activo }).eq("id", id);
        if (error) throw mensajeError(error);
    },

    async crearMateriaPrima(input: MateriaPrimaInput, stockInicial: number): Promise<MateriaPrima> {
        const { data: id, error } = await supabase.rpc("crear_materia_prima", {
            p_nombre: input.nombre.trim(),
            p_categoria: input.categoria.trim(),
            p_unidad: input.unidad,
            p_stock_minimo: input.stockMinimo,
            p_stock_inicial: stockInicial
        });
        if (error) throw mensajeError(error);

        const { data, error: errorLectura } = await supabase
            .from("materias_primas")
            .select("*")
            .eq("id", Number(id))
            .single();
        if (errorLectura) throw mensajeError(errorLectura);
        return mapearMateriaPrima(data as Record<string, unknown>);
    },

    async editarMateriaPrima(id: number, input: MateriaPrimaInput): Promise<MateriaPrima> {
        const { data, error } = await supabase
            .from("materias_primas")
            .update({
                nombre: input.nombre.trim(),
                categoria: input.categoria.trim(),
                unidad: input.unidad,
                stock_minimo: input.stockMinimo
            })
            .eq("id", id)
            .select("*")
            .single();
        if (error) throw mensajeError(error);
        return mapearMateriaPrima(data as Record<string, unknown>);
    },

    async cambiarEstadoMateriaPrima(id: number, activo: boolean): Promise<void> {
        const { error } = await supabase.from("materias_primas").update({ activo }).eq("id", id);
        if (error) throw mensajeError(error);
    },

    async guardarReceta(productoId: number, ingredientes: Receta["ingredientes"]): Promise<number> {
        const { data, error } = await supabase.rpc("guardar_receta", {
            p_producto_id: productoId,
            p_ingredientes: ingredientes.map((ingrediente) => ({
                materiaPrimaId: ingrediente.materiaPrimaId,
                cantidad: ingrediente.cantidad
            }))
        });
        if (error) throw mensajeError(error);
        return Number(data);
    }
};
