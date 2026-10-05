import { useEffect, useState, useRef } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useComandas } from "../context/useComandas";
import { useToast } from "../context/useToast";

const PREPARACION_VISTA_KEY = "cafeteria-preparacion-vista";

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
    const [vista, setVista] = useState<"grilla" | "lista">(() => {
        const valorGuardado = localStorage.getItem(PREPARACION_VISTA_KEY);
        return valorGuardado === "lista" || valorGuardado === "grilla"
            ? valorGuardado
            : "grilla";
    });

    useEffect(() => {
        localStorage.setItem(PREPARACION_VISTA_KEY, vista);
    }, [vista]);

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
        .filter(
            (comanda) =>
                comanda.estado === "preparando"
        )
        .flatMap(
        (comanda) =>

            comanda.productos
                .filter((item) => {

                    const producto =
                        obtenerProducto(
                            item.productoId
                        );

                    return (
                        producto?.sector ===
                        sectorSeleccionado
                    );

                })
                .map((item) => ({

                    comanda,
                    item,
                    producto:
                        obtenerProducto(
                            item.productoId
                        )

                }))
        ).sort((pedidoA, pedidoB) => {
        const prioridad = {
            pendiente: 0,
            preparando: 1,
            listo: 2
        };

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
                        No hay pedidos pendientes
                    </h2>

                    <p>
                        Todos los pedidos de{" "}
                        {sectorSeleccionado} están listos.
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
                                        className={`estado-producto ${item.estado}`}
                                    >
                                        {item.estado}
                                    </span>

                                </div>

                                <div className="pedido-acciones">

                                    {item.estado ===
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

                                    {item.estado ===
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
