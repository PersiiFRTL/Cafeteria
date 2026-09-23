import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";

function Stock() {

    const {
        materiasPrimas,
        productos,
        cambiarEstadoMateriaPrima,
        registrarEntradaMateriaPrima,
        registrarSalidaMateriaPrima,
        operacionesStock
    } = useCafeteria();

    const [vista, setVista] = useState<
        "materiasPrimas" | "productos" | "movimientos"
    >("materiasPrimas");

    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] =
        useState<number | null>(null);

    const [cantidad, setCantidad] = useState("");


    const registrarMovimiento = (
        tipo: "entrada" | "salida"
    ) => {

        if (
            materiaPrimaSeleccionada === null ||
            cantidad === ""
        ) {
            return;
        }

        const cantidadNumero = Number(cantidad);

        if (cantidadNumero <= 0) {
            return;
        }

        if (tipo === "entrada") {

            registrarEntradaMateriaPrima(
                materiaPrimaSeleccionada,
                cantidadNumero
            );

        } else {

            registrarSalidaMateriaPrima(
                materiaPrimaSeleccionada,
                cantidadNumero
            );
        }

        setCantidad("");
        setMateriaPrimaSeleccionada(null);
    };


    return (
        <div className="dashboard-content">

            <div className="stock-header">

                <div>

                    <h1>Stock</h1>

                    <p>
                        Gestión de materias primas y productos
                        de la cafetería.
                    </p>

                </div>

            </div>


            {/* ==========================
                SELECTOR DE VISTA
            ========================== */}

            <div className="stock-tabs">

                <button
                    className={
                        vista === "materiasPrimas"
                            ? "stock-tab stock-tab-active"
                            : "stock-tab"
                    }
                    onClick={() => {
                        setVista("materiasPrimas");
                        setMateriaPrimaSeleccionada(null);
                        setCantidad("");
                    }}
                >
                    🧂 Materias primas
                </button>


                <button
                    className={
                        vista === "productos"
                            ? "stock-tab stock-tab-active"
                            : "stock-tab"
                    }
                    onClick={() => {
                        setVista("productos");
                        setMateriaPrimaSeleccionada(null);
                        setCantidad("");
                    }}
                >
                    🛍 Productos
                </button>


                <button
                    className={
                        vista === "movimientos"
                            ? "stock-tab stock-tab-active"
                            : "stock-tab"
                    }
                    onClick={() => {
                        setVista("movimientos");
                        setMateriaPrimaSeleccionada(null);
                        setCantidad("");
                    }}
                >
                    📋 Movimientos
                </button>

            </div>


            {/* ==========================
                MATERIAS PRIMAS
            ========================== */}

            {vista === "materiasPrimas" && (

                <>

                    <div className="stock-table">

                        <div className="stock-row stock-row-header">

                            <span>
                                Materia prima
                            </span>

                            <span>
                                Categoría
                            </span>

                            <span>
                                Stock actual
                            </span>

                            <span>
                                Estado
                            </span>

                            <span>
                                Acciones
                            </span>

                        </div>


                        {materiasPrimas.map((materia) => {

                            const stockBajo =
                                materia.stockActual <=
                                materia.stockMinimo;

                            return (

                                <div
                                    key={materia.id}
                                    className="stock-row"
                                >

                                    <div>

                                        <strong>
                                            {materia.nombre}
                                        </strong>

                                    </div>


                                    <span>
                                        {materia.categoria}
                                    </span>


                                    <span>
                                        {materia.stockActual}{" "}
                                        {materia.unidad}
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


                                    <div className="stock-actions">

                                        <button
                                            className="stock-button"
                                            onClick={() =>
                                                setMateriaPrimaSeleccionada(
                                                    materia.id
                                                )
                                            }
                                        >
                                            Movimiento
                                        </button>


                                        <button
                                            className="stock-button"
                                            onClick={() =>
                                                cambiarEstadoMateriaPrima(
                                                    materia.id,
                                                    !materia.activo
                                                )
                                            }
                                        >
                                            {materia.activo
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>

                                    </div>

                                </div>

                            );
                        })}

                    </div>


                    {/* FORMULARIO DE MOVIMIENTO */}

                    {materiaPrimaSeleccionada !== null && (

                        <div className="stock-movimiento">

                            <h2>
                                Registrar movimiento
                            </h2>


                            <p>

                                Materia prima seleccionada:{" "}

                                <strong>
                                    {
                                        materiasPrimas.find(
                                            (materia) =>
                                                materia.id ===
                                                materiaPrimaSeleccionada
                                        )?.nombre
                                    }
                                </strong>

                            </p>


                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Cantidad"
                                value={cantidad}
                                onChange={(e) =>
                                    setCantidad(
                                        e.target.value
                                    )
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
                                    className="stock-button"
                                    onClick={() =>
                                        registrarMovimiento(
                                            "salida"
                                        )
                                    }
                                >
                                    - Salida
                                </button>


                                <button
                                    className="stock-button"
                                    onClick={() => {
                                        setCantidad("");
                                        setMateriaPrimaSeleccionada(
                                            null
                                        );
                                    }}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </div>

                    )}

                </>

            )}


            {/* ==========================
                PRODUCTOS
            ========================== */}

            {vista === "productos" && (

                <div className="stock-table">

                    <div className="stock-row stock-row-header">

                        <span>
                            Producto
                        </span>

                        <span>
                            Categoría
                        </span>

                        <span>
                            Tipo
                        </span>

                        <span>
                            Stock actual
                        </span>

                        <span>
                            Estado
                        </span>

                    </div>


                    {productos
                        .filter(
                            (producto) =>
                                producto.tipoElaboracion ===
                                "preelaborado"
                        )
                        .map((producto) => {

                            const stockBajo =
                                producto.stockActual <=
                                producto.stockMinimo;

                            return (

                                <div
                                    key={producto.id}
                                    className="stock-row"
                                >

                                    <div>

                                        <strong>
                                            {producto.nombre}
                                        </strong>

                                    </div>


                                    <span>
                                        {producto.categoria}
                                    </span>


                                    <span>
                                        Preelaborado
                                    </span>


                                    <span>
                                        {producto.stockActual}{" "}
                                        {producto.unidadVenta}
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

                                </div>

                            );
                        })}

                </div>

            )}


            {/* ==========================
                OPERACIONES DE STOCK
            ========================== */}

            {vista === "movimientos" && (

                <div className="operaciones-stock">

                    {operacionesStock.length === 0 ? (

                        <div className="stock-empty">

                            <h2>
                                No hay operaciones registradas
                            </h2>

                            <p>
                                Los movimientos generados por
                                producciones y comandas aparecerán
                                agrupados aquí.
                            </p>

                        </div>

                    ) : (

                        [...operacionesStock]
                            .reverse()
                            .map((operacion) => {

                                return (

                                    <div
                                        className="operacion-stock"
                                        key={operacion.id}
                                    >

                                        <div className="operacion-stock-header">

                                            <div>

                                                <strong>

                                                    {operacion.tipo ===
                                                        "produccion"
                                                        ? "🏭 Producción"
                                                        : "📋 Comanda"}

                                                </strong>


                                                <p>
                                                    {operacion.descripcion}
                                                </p>

                                            </div>


                                            <span>

                                                {new Date(
                                                    operacion.fecha
                                                ).toLocaleString(
                                                    "es-AR"
                                                )}

                                            </span>

                                        </div>


                                        <div className="operacion-stock-detalle">

                                            {operacion.movimientos.map(
                                                (movimiento) => {

                                                    const nombre =
                                                        movimiento.categoria ===
                                                        "materiaPrima"

                                                            ? materiasPrimas.find(
                                                                (materia) =>
                                                                    materia.id ===
                                                                    movimiento.referenciaId
                                                            )?.nombre

                                                            : productos.find(
                                                                (producto) =>
                                                                    producto.id ===
                                                                    movimiento.referenciaId
                                                            )?.nombre;


                                                    return (

                                                        <div
                                                            className="operacion-stock-item"
                                                            key={
                                                                movimiento.id
                                                            }
                                                        >

                                                            <span>
                                                                {nombre ??
                                                                    "Desconocido"}
                                                            </span>


                                                            <strong>
                                                                -
                                                                {
                                                                    movimiento.cantidad
                                                                }
                                                            </strong>

                                                        </div>

                                                    );

                                                }
                                            )}

                                        </div>

                                    </div>

                                );

                            })

                    )}

                </div>

            )}

        </div>
    );
}

export default Stock;