import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCafeteria } from "../context/CafeteriaContext";
import productosData from "../data/productos.json";

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    sector: string;
}

const productos: Producto[] = productosData;

function NuevaComanda() {

    const [cantidades, setCantidades] = useState<Record<number, number>>({});
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const numeroMesa = searchParams.get("mesa");
    const { crearComanda } = useCafeteria();

    const agregarProducto = (productoId: number) => {

        setCantidades((actuales) => ({
            ...actuales,
            [productoId]: (actuales[productoId] || 0) + 1
        }));

    };

    const quitarProducto = (productoId: number) => {

        setCantidades((actuales) => {

            const nuevaCantidad = (actuales[productoId] || 0) - 1;

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

            const cantidad = cantidades[producto.id] || 0;

            return total + producto.precio * cantidad;

        }, 0);

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

                        {productos.map((producto) => {

                            const cantidad = cantidades[producto.id] || 0;

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
                                            ${producto.precio.toLocaleString()}
                                        </strong>

                                    </div>

                                    <div className="producto-controls">

                                        {cantidad > 0 && (
                                            <>
                                                <button
                                                    onClick={() =>
                                                        quitarProducto(producto.id)
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
                                                agregarProducto(producto.id)
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

                            const cantidad = cantidades[producto.id];

                            if (!cantidad) {
                                return null;
                            }

                            return (
                                <div
                                    key={producto.id}
                                    className="resumen-producto"
                                >

                                    <span>
                                        {cantidad} x {producto.nombre}
                                    </span>

                                    <strong>
                                        ${(producto.precio * cantidad).toLocaleString()}
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
                            ${obtenerTotal().toLocaleString()}
                        </strong>

                    </div>

                    <div className="comanda-actions">
                        <button
                            className="secondary-button cancelar-button"
                            onClick={() => navigate("/mesas")}
                        >
                            Cancelar
                        </button>

                        <button
                            className="primary-button confirmar-button"
                            disabled={Object.keys(cantidades).length === 0}
                            onClick={() => {
                            if (!numeroMesa) {
                            return;
                            }
                             const productosComanda = Object.entries(cantidades).map(
                                ([productoId, cantidad]) => ({
                                productoId: Number(productoId),
                                cantidad: cantidad,
                                estado: "pendiente" as const
                            })
                            );
                            crearComanda(
                                Number(numeroMesa),
                                productosComanda
                            );
                            alert(`Comanda creada para la Mesa ${numeroMesa}`);
                            navigate("/mesas");
                        }}
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