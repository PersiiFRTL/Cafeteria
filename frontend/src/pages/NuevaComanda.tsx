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
        productos,
        recetas,
        materiasPrimas
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

    const puedeAgregarProducto = (
        productoId: number,
        cantidadSeleccionada: number
    ) => {
        const producto = productos.find(
            (item) => item.id === productoId
        );

        if (!producto) {
            return false;
        }

        const cantidadSolicitada = cantidadSeleccionada + 1;

        if (producto.tipoElaboracion === "preelaborado") {
            return cantidadSolicitada <= producto.stockActual;
        }

        const cantidadesConProducto = {
            ...cantidades,
            [productoId]: cantidadSolicitada
        };

        const consumoPorMateriaPrima = new Map<number, number>();

        for (const [idProducto, cantidad] of Object.entries(
            cantidadesConProducto
        )) {
            const productoSeleccionado = productos.find(
                (item) => item.id === Number(idProducto)
            );

            if (!productoSeleccionado || cantidad <= 0) {
                continue;
            }

            if (productoSeleccionado.tipoElaboracion === "preelaborado") {
                if (cantidad > productoSeleccionado.stockActual) {
                    return false;
                }
                continue;
            }

            const receta = recetas.find(
                (item) => item.productoId === Number(idProducto)
            );

            // Sin receta todavía no hay consumos que puedan validarse aquí.
            if (!receta) {
                continue;
            }

            for (const ingrediente of receta.ingredientes) {
                const cantidadActual =
                    consumoPorMateriaPrima.get(
                        ingrediente.materiaPrimaId
                    ) ?? 0;

                consumoPorMateriaPrima.set(
                    ingrediente.materiaPrimaId,
                    cantidadActual + ingrediente.cantidad * cantidad
                );
            }
        }

        return Array.from(consumoPorMateriaPrima.entries()).every(
            ([materiaPrimaId, cantidadNecesaria]) => {
                const materiaPrima = materiasPrimas.find(
                    (materia) => materia.id === materiaPrimaId
                );

                return Boolean(
                    materiaPrima?.activo &&
                    materiaPrima.stockActual >= cantidadNecesaria
                );
            }
        );
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
                    estado: "pendiente" as const,
                    cantidadStockProcesada: 0
                })
            );

        const confirmar = window.confirm(
            modoAgregar
                ? `¿Agregar estos productos a la comanda de la Mesa ${numeroMesa}?`
                : `¿Crear la comanda para la Mesa ${numeroMesa}?`
        );

        if (!confirmar) {
            return;
        }

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

                                const puedeAgregar =
                                    puedeAgregarProducto(
                                        producto.id,
                                        cantidad
                                    );

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

                                            {puedeAgregar && (
                                                <button
                                                    onClick={() =>
                                                        agregarProducto(
                                                            producto.id
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>
                                            )}

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