import { useEffect, useState, useRef } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useComandas } from "../context/useComandas";
import { useToast } from "../context/useToast";

const PREPARACION_VISTA_KEY = "cafeteria-preparacion-vista";
const PREPARACION_FILTRO_KEY = "cafeteria-preparacion-filtro";

type FiltroComanda =
    | "todas"
    | "pendiente"
    | "preparando"
    | "lista"
    | "finalizada"
    | "cancelada";

const filtrosComandas: { valor: FiltroComanda; etiqueta: string }[] = [
    { valor: "todas", etiqueta: "Todas" },
    { valor: "pendiente", etiqueta: "Pendientes" },
    { valor: "preparando", etiqueta: "En preparación" },
    { valor: "lista", etiqueta: "Listas" },
    { valor: "finalizada", etiqueta: "Finalizadas" },
    { valor: "cancelada", etiqueta: "Canceladas" }
];

const etiquetasEstado: Record<FiltroComanda | "listo", string> = {
    todas: "Todas",
    pendiente: "Pendiente",
    preparando: "En preparación",
    lista: "Lista",
    listo: "Listo",
    finalizada: "Finalizada",
    cancelada: "Cancelada"
};

interface Sector {
    nombre: string;
    icono: string;
}

const sectores: Sector[] = [
    {
        nombre: "Cocina",
        icono: "👨‍🍳"
    },
    {
        nombre: "Cafetería",
        icono: "☕"
    },
    {
        nombre: "Pastelería",
        icono: "🥐"
    }
];

function Preparacion() {
    const { mostrarToast } = useToast();
    const bloqueoAccion = useRef(false);

    const ejecutarAccionConBloqueo = (accion: () => void) => {
        if (bloqueoAccion.current) {
            return;
        }

        bloqueoAccion.current = true;
        accion();

        window.setTimeout(() => {
            bloqueoAccion.current = false;
        }, 100);
    };

    const {
        comandas,
        productos,
        cambiarEstadoProducto,
        mesas
    } = useComandas();

    const [sectorSeleccionado, setSectorSeleccionado] =
        useState<string | null>(null);
    const [filtroComanda, setFiltroComanda] = useState<FiltroComanda>(() => {
        const valorGuardado = localStorage.getItem(PREPARACION_FILTRO_KEY) as FiltroComanda | null;
        return filtrosComandas.some((filtro) => filtro.valor === valorGuardado)
            ? valorGuardado ?? "todas"
            : "todas";
    });
    const [vista, setVista] = useState<"grilla" | "lista">(() => {
        const valorGuardado = localStorage.getItem(PREPARACION_VISTA_KEY);
        return valorGuardado === "lista" || valorGuardado === "grilla"
            ? valorGuardado
            : "grilla";
    });

    useEffect(() => {
        localStorage.setItem(PREPARACION_VISTA_KEY, vista);
    }, [vista]);

    useEffect(() => {
        localStorage.setItem(PREPARACION_FILTRO_KEY, filtroComanda);
    }, [filtroComanda]);

    const obtenerProducto = (productoId: number) => {

        return productos.find(
            (producto) => producto.id === productoId
        );

    };

    const obtenerMesa = (mesaId: number | undefined) => {
        return mesas.find((mesa) => mesa.id === mesaId);
    };

    const volverSectores = () => {
        setSectorSeleccionado(null);
    };

    const actualizarEstadoPedido = (
        comandaId: number,
        productoId: number,
        estado: "preparando" | "listo"
    ) => {
        cambiarEstadoProducto(comandaId, productoId, estado);
        mostrarToast(estado === "listo"
            ? "Producto marcado como listo."
            : "Preparación iniciada.");
    };

    /*
     * PANTALLA DE SELECCIÓN
     */

    if (!sectorSeleccionado) {

        return (
            <div className="dashboard-content">

                <div className="preparacion-header">

                    <div className="preparacion-header-copy">
                        <h1>Preparación</h1>

                        <p>
                            Seleccione el sector que desea visualizar.
                        </p>
                    </div>

                </div>

                <div className="sectores-seleccion">

                    {sectores.map((sector) => (

                        <button
                            className="sector-selector"
                            key={sector.nombre}
                            onClick={() =>
                                setSectorSeleccionado(
                                    sector.nombre
                                )
                            }
                        >

                            <span className="sector-selector-icon">
                                {sector.icono}
                            </span>

                            <strong>
                                {sector.nombre}
                            </strong>

                        </button>

                    ))}

                </div>

            </div>
        );

    }

    /*
     * PRODUCTOS DEL SECTOR SELECCIONADO
     */

    const pedidosSector = comandas
        .flatMap((comanda) =>
            comanda.productos
                .filter((item) => obtenerProducto(item.productoId)?.sector === sectorSeleccionado)
                .filter((item) => {
                    if (filtroComanda === "todas") return true;
                    if (filtroComanda === "finalizada" || filtroComanda === "cancelada") {
                        return comanda.estado === filtroComanda;
                    }
                    if (comanda.estado === "finalizada" || comanda.estado === "cancelada") {
                        return false;
                    }
                    return (filtroComanda === "lista"
                        ? item.estado === "listo"
                        : item.estado === filtroComanda) ||
                        (filtroComanda === "lista" && comanda.estado === "lista");
                })
                .map((item) => ({
                    comanda,
                    item,
                    producto: obtenerProducto(item.productoId)
                }))
        )
        .sort((pedidoA, pedidoB) => {
            const prioridad = { pendiente: 0, preparando: 1, listo: 2 };
            return prioridad[pedidoA.item.estado] - prioridad[pedidoB.item.estado];
        });

    return (
        <div className="dashboard-content">

            <div className="preparacion-header">

                <div>

                    <button
                        className="volver-sector"
                        onClick={volverSectores}
                    >
                        ← Volver a sectores
                    </button>

                    <h1>
                        {sectorSeleccionado}
                    </h1>

                    <p>
                        Pedidos correspondientes a este sector.
                    </p>

                </div>
            </div>

            <div className="comandas-toolbar">
                <div className="comandas-filtros" role="group" aria-label="Filtrar comandas del sector por estado">
                    {filtrosComandas.map((filtro) => (
                        <button
                            key={filtro.valor}
                            type="button"
                            className={`comandas-filtro ${filtroComanda === filtro.valor ? "activo" : ""}`}
                            data-estado={filtro.valor}
                            aria-pressed={filtroComanda === filtro.valor}
                            onClick={() => setFiltroComanda(filtro.valor)}
                        >
                            {filtro.etiqueta}
                        </button>
                    ))}
                </div>

                <div className="preparacion-vistas" role="group" aria-label="Vista de preparación">
                    <button
                        type="button"
                        aria-label="Vista de grilla"
                        aria-pressed={vista === "grilla"}
                        title="Vista de grilla"
                        className={vista === "grilla" ? "activo" : ""}
                        onClick={() => setVista("grilla")}
                    >
                        <LayoutGrid size={18} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        aria-label="Vista de lista"
                        aria-pressed={vista === "lista"}
                        title="Vista de lista"
                        className={vista === "lista" ? "activo" : ""}
                        onClick={() => setVista("lista")}
                    >
                        <List size={18} aria-hidden="true" />
                    </button>
                </div>
            </div>

            {pedidosSector.length === 0 ? (

                <div className="sector-vacio">

                    <div className="sector-vacio-icon">
                        ✓
                    </div>

                    <h2>
                        {filtroComanda === "todas"
                            ? "No hay pedidos en este sector"
                            : "No hay comandas en este filtro"}
                    </h2>

                    <p>
                        {filtroComanda === "todas"
                            ? `Todavía no hay pedidos de ${sectorSeleccionado}.`
                            : `No hay comandas con estado ${etiquetasEstado[filtroComanda].toLowerCase()} en ${sectorSeleccionado}.`}
                    </p>

                </div>

            ) : (

                <div className={`pedidos-sector ${vista}`}>

                    {pedidosSector.map(
                        ({
                            comanda,
                            item,
                            producto
                        }) => {

                            const mesa = obtenerMesa(comanda.mesaId);
                            const comandaCerrada = comanda.estado === "finalizada" || comanda.estado === "cancelada";
                            const estadoVisible = comandaCerrada ? comanda.estado : item.estado;

                            return (
                                <div
                                    className={`pedido-preparacion estado-${item.estado}`}
                                    key={`${comanda.id}-${item.productoId}`}
                                >

                                    <div className="pedido-info">

                                        <div className="pedido-mesa">
                                            {comanda.tipoAtencion === "take-away"
                                                ? `Take away · ${comanda.clienteTakeAway?.nombre ?? "Cliente"} · Retiro ${comanda.horaRetiro?.slice(11, 16) ?? "sin horario"} · Pedido #${comanda.id}`
                                                : `Comanda #${comanda.id} · Mesa ${mesa?.numero ?? comanda.mesaId}`}
                                        </div>

                                    <h3>
                                        {producto?.nombre}
                                    </h3>

                                    <p>
                                        Cantidad:{" "}
                                        {item.cantidad}
                                    </p>

                                    <span
                                        className={`estado-producto ${estadoVisible}`}
                                    >
                                        {etiquetasEstado[estadoVisible]}
                                    </span>

                                </div>

                                <div className="pedido-acciones">

                                    {!comandaCerrada && item.estado ===
                                        "pendiente" && (

                                        <button
                                            className="primary-button"
                                            disabled={bloqueoAccion.current}
                                            onClick={() =>
                                                ejecutarAccionConBloqueo(() =>
                                                    actualizarEstadoPedido(
                                                        comanda.id,
                                                        item.productoId,
                                                        "preparando"
                                                    )
                                                )
                                            }
                                        >
                                            ▶ Comenzar preparación
                                        </button>

                                    )}

                                    {!comandaCerrada && item.estado ===
                                        "preparando" && (

                                        <button
                                            className="primary-button"
                                            disabled={bloqueoAccion.current}
                                            onClick={() =>
                                                ejecutarAccionConBloqueo(() =>
                                                    actualizarEstadoPedido(
                                                        comanda.id,
                                                        item.productoId,
                                                        "listo"
                                                    )
                                                )
                                            }
                                        >
                                            ✓ Marcar como listo
                                        </button>

                                    )}

                                    </div>

                                </div>
                            );
                        }
                    )}

                </div>

            )}

        </div>
    );
}

export default Preparacion;
