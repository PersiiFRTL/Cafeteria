import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";
import productosData from "../data/productos.json";

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    sector: string;
}

const productos: Producto[] = productosData;

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

    const {
        comandas,
        cambiarEstadoProducto
    } = useCafeteria();

    const [sectorSeleccionado, setSectorSeleccionado] =
        useState<string | null>(null);

    const obtenerProducto = (productoId: number) => {

        return productos.find(
            (producto) => producto.id === productoId
        );

    };

    const volverSectores = () => {
        setSectorSeleccionado(null);
    };

    /*
     * PANTALLA DE SELECCIÓN
     */

    if (!sectorSeleccionado) {

        return (
            <div className="dashboard-content">

                <div className="preparacion-header">

                    <h1>Preparación</h1>

                    <p>
                        Seleccione el sector que desea visualizar.
                    </p>

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

    const pedidosSector = comandas.flatMap(
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
    );

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

                <div className="pedidos-sector">

                    {pedidosSector.map(
                        ({
                            comanda,
                            item,
                            producto
                        }) => (

                            <div
                                className="pedido-preparacion"
                                key={`${comanda.id}-${item.productoId}`}
                            >

                                <div className="pedido-info">

                                    <div className="pedido-mesa">
                                        Mesa {comanda.mesaId}
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
                                            onClick={() =>
                                                cambiarEstadoProducto(
                                                    comanda.id,
                                                    item.productoId,
                                                    "preparando"
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
                                            onClick={() =>
                                                cambiarEstadoProducto(
                                                    comanda.id,
                                                    item.productoId,
                                                    "listo"
                                                )
                                            }
                                        >
                                            ✓ Marcar como listo
                                        </button>

                                    )}

                                </div>

                            </div>

                        )
                    )}

                </div>

            )}

        </div>
    );
}

export default Preparacion;