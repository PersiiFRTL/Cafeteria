import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCafeteria } from "../context/CafeteriaContext";

function NuevaComanda() {
    const [cantidades, setCantidades] =
        useState<Record<number, number>>({});

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const numeroMesa = searchParams.get("mesa");
    const modoAgregar = searchParams.get("agregar") === "true";

    const {
        crearComanda,
        agregarProductosAComanda,
        obtenerComandaDeMesa,
        productos
    } = useCafeteria();

    const agregarProducto = (productoId: number) => {
        setCantidades((actuales) => ({
            ...actuales,
            [productoId]: (actuales[productoId] || 0) + 1
        }));
    };

    const quitarProducto = (productoId: number) => {
        setCantidades((actuales) => {
            const nuevaCantidad =
                (actuales[productoId] || 0) - 1;

            if (nuevaCantidad <= 0) {
                const copia = { ...actuales };

                delete copia[productoId];

                return copia;
            }

            return {
                ...actuales,
                [productoId]: nuevaCantidad
            };
        });
    };

    const obtenerTotal = () => {
        return productos.reduce((total, producto) => {
            const cantidad =
                cantidades[producto.id] || 0;

            return total + producto.precio * cantidad;
        }, 0);
    };

    const confirmarComanda = () => {
        if (!numeroMesa) {
            return;
        }

        const productosComanda =
            Object.entries(cantidades).map(
                ([productoId, cantidad]) => ({
                    productoId: Number(productoId),
                    cantidad: cantidad,
                    estado: "pendiente" as const
                })
            );

        const comandaActiva = obtenerComandaDeMesa(Number(numeroMesa));

        if (modoAgregar && comandaActiva) {
            agregarProductosAComanda(
                comandaActiva.id,
                productosComanda
            );
        } else {
            crearComanda(
                Number(numeroMesa),
                productosComanda
            );
        }

        alert(
            modoAgregar && comandaActiva
                ? `Productos agregados a la comanda de la Mesa ${numeroMesa}`
                : `Comanda creada para la Mesa ${numeroMesa}`
        );

        navigate("/mesas");
    };

    return (
        <div className="dashboard-content">

            <div className="comanda-header">
                <div>
                    <h1>Nueva comanda</h1>

                    <p>
                        Mesa {numeroMesa}
                    </p>
                </div>
            </div>

            <div className="comanda-layout">

                <div className="productos-section">

                    <h2>Productos</h2>

                    <div className="productos-container">

                        {productos
                            .filter(
                                (producto) =>
                                    producto.activo
                            )
                            .map((producto) => {

                                const cantidad =
                                    cantidades[producto.id] || 0;

                                return (
                                    <div
                                        key={producto.id}
                                        className="producto-card"
                                    >

                                        <div>

                                            <h3>
                                                {producto.nombre}
                                            </h3>

                                            <p>
                                                {producto.sector}
                                            </p>

                                            <strong>
                                                $
                                                {producto.precio.toLocaleString()}
                                            </strong>

                                        </div>

                                        <div className="producto-controls">

                                            {cantidad > 0 && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            quitarProducto(
                                                                producto.id
                                                            )
                                                        }
                                                    >
                                                        −
                                                    </button>

                                                    <span>
                                                        {cantidad}
                                                    </span>
                                                </>
                                            )}

                                            <button
                                                onClick={() =>
                                                    agregarProducto(
                                                        producto.id
                                                    )
                                                }
                                            >
                                                +
                                            </button>

                                        </div>

                                    </div>
                                );
                            })}

                    </div>

                </div>

                <div className="comanda-resumen">

                    <h2>Resumen</h2>

                    {Object.keys(cantidades).length === 0 ? (

                        <p>
                            No hay productos seleccionados.
                        </p>

                    ) : (

                        productos.map((producto) => {

                            const cantidad =
                                cantidades[producto.id];

                            if (!cantidad) {
                                return null;
                            }

                            return (
                                <div
                                    key={producto.id}
                                    className="resumen-producto"
                                >

                                    <span>
                                        {cantidad} x{" "}
                                        {producto.nombre}
                                    </span>

                                    <strong>
                                        $
                                        {(
                                            producto.precio *
                                            cantidad
                                        ).toLocaleString()}
                                    </strong>

                                </div>
                            );
                        })
                    )}

                    <div className="comanda-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            $
                            {obtenerTotal().toLocaleString()}
                        </strong>

                    </div>

                    <div className="comanda-actions">

                        <button
                            className="secondary-button cancelar-button"
                            onClick={() =>
                                navigate("/mesas")
                            }
                        >
                            Cancelar
                        </button>

                        <button
                            className="primary-button confirmar-button"
                            disabled={
                                Object.keys(cantidades)
                                    .length === 0
                            }
                            onClick={confirmarComanda}
                        >
                            ✓ Confirmar comanda
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}

export default NuevaComanda;