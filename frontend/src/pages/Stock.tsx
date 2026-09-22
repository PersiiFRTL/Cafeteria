import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";

function Stock() {
    const {
        insumos,
        cambiarEstadoInsumo,
        movimientosStock,
        registrarMovimientoStock
    } = useCafeteria();

    const [insumoSeleccionado, setInsumoSeleccionado] =
        useState<number | null>(null);

    const [cantidad, setCantidad] = useState("");

const registrarMovimiento = (
    tipo: "entrada" | "salida"
) => {

    if (
        insumoSeleccionado === null ||
        cantidad === ""
    ) {
        return;
    }

    const cantidadNumero = Number(cantidad);

    if (cantidadNumero <= 0) {
        return;
    }

    registrarMovimientoStock(
        insumoSeleccionado,
        tipo,
        cantidadNumero
    );

    setCantidad("");
    setInsumoSeleccionado(null);
};

    return (
        <div className="dashboard-content">

            <div className="stock-header">
                <div>
                    <h1>Stock</h1>

                    <p>
                        Gestión de insumos y existencias
                        de la cafetería.
                    </p>
                </div>
            </div>

            <div className="stock-table">

                <div className="stock-row stock-row-header">
                    <span>Insumo</span>
                    <span>Stock actual</span>
                    <span>Stock mínimo</span>
                    <span>Estado</span>
                    <span>Acciones</span>
                </div>

                {insumos.map((insumo) => {

                    const stockBajo =
                        insumo.stockActual <=
                        insumo.stockMinimo;

                    return (
                        <div
                            className="stock-row"
                            key={insumo.id}
                        >

                            <span>
                                <strong>
                                    {insumo.nombre}
                                </strong>
                            </span>

                            <span>
                                {insumo.stockActual}{" "}
                                {insumo.unidad}
                            </span>

                            <span>
                                {insumo.stockMinimo}{" "}
                                {insumo.unidad}
                            </span>

                            <span>
                                <span
                                    className={
                                        stockBajo
                                            ? "stock-bajo"
                                            : "stock-normal"
                                    }
                                >
                                    {stockBajo
                                        ? "Stock bajo"
                                        : "Normal"}
                                </span>
                            </span>

                            <span className="stock-actions">

                                <button
                                    className="stock-button"
                                    onClick={() => {
                                        setInsumoSeleccionado(
                                            insumo.id
                                        );
                                    }}
                                >
                                    + / −
                                </button>

                                <button
                                    className={
                                        insumo.activo
                                            ? "estado-activo"
                                            : "estado-inactivo"
                                    }
                                    onClick={() =>
                                        cambiarEstadoInsumo(
                                            insumo.id,
                                            !insumo.activo
                                        )
                                    }
                                >
                                    {insumo.activo
                                        ? "Activo"
                                        : "Inactivo"}
                                </button>

                            </span>

                        </div>
                    );
                })}

            </div>
                            <div className="stock-historial">

                    <h2>Últimos movimientos</h2>

                    {movimientosStock.length === 0 ? (

                        <p>
                            Todavía no hay movimientos
                            registrados.
                        </p>

                    ) : (

                        <div className="stock-movimientos">

                            {movimientosStock
                                .slice()
                                .reverse()
                                .map((movimiento) => {

                                    const insumo =
                                        insumos.find(
                                            (insumo) =>
                                                insumo.id ===
                                                movimiento.insumoId
                                        );

                                    if (!insumo) {
                                        return null;
                                    }

                                    return (
                                        <div
                                            className="stock-movimiento-row"
                                            key={movimiento.id}
                                        >

                                            <span>
                                                {insumo.nombre}
                                            </span>

                                            <span
                                                className={
                                                    movimiento.tipo ===
                                                    "entrada"
                                                        ? "movimiento-entrada"
                                                        : "movimiento-salida"
                                                }
                                            >
                                                {movimiento.tipo ===
                                                "entrada"
                                                    ? "Entrada"
                                                    : "Salida"}
                                            </span>

                                            <span>
                                                {movimiento.tipo ===
                                                "entrada"
                                                    ? "+"
                                                    : "-"}
                                                {movimiento.cantidad}{" "}
                                                {insumo.unidad}
                                            </span>

                                            <span>
                                                {new Date(
                                                    movimiento.fecha
                                                ).toLocaleString()}
                                            </span>

                                        </div>
                                    );
                                })}

                        </div>
                    )}

                </div>

            {insumoSeleccionado !== null && (

                <div className="stock-movimiento">

                    <h2>Movimiento de stock</h2>

                    <p>
                        Insumo seleccionado:{" "}
                        <strong>
                            {
                                insumos.find(
                                    (insumo) =>
                                        insumo.id ===
                                        insumoSeleccionado
                                )?.nombre
                            }
                        </strong>
                    </p>

                    <input
                        type="number"
                        min="1"
                        placeholder="Cantidad"
                        value={cantidad}
                        onChange={(e) =>
                            setCantidad(e.target.value)
                        }
                    />

                    <div className="stock-movimiento-actions">

                        <button
                            className="primary-button"
                            onClick={() =>
                                registrarMovimiento(
                                    "entrada"
                                )
                            }
                        >
                            + Entrada
                        </button>

                        <button
                            className="secondary-button"
                            onClick={() =>
                                registrarMovimiento(
                                    "salida"
                                )
                            }
                        >
                            − Salida
                        </button>

                        <button
                            className="secondary-button"
                            onClick={() => {
                                setCantidad("");
                                setInsumoSeleccionado(null);
                            }}
                        >
                            Cancelar
                        </button>

                    </div>

                </div>
            )}

        </div>
    );
}

export default Stock;