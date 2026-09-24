import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";

function Stock() {

    const {
        materiasPrimas,
        productos,
        agregarMateriaPrima,
        agregarProducto,
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

    const [mensajeErrorStock, setMensajeErrorStock] = useState("");

    const [
        mostrarFormularioMateriaPrima,
        setMostrarFormularioMateriaPrima
    ] = useState(false);

    const [nombreMateriaPrima, setNombreMateriaPrima] = useState("");
    const [categoriaMateriaPrima, setCategoriaMateriaPrima] = useState("");

    const [unidadMateriaPrima, setUnidadMateriaPrima] = useState<
        "unidad" | "kg" | "litro"
    >("unidad");

    const [stockMinimoMateriaPrima, setStockMinimoMateriaPrima] =
        useState("");

    const [stockInicialMateriaPrima, setStockInicialMateriaPrima] =
        useState("");

    const [mostrarFormularioProducto, setMostrarFormularioProducto] =
        useState(false);
    const [nombreProducto, setNombreProducto] = useState("");
    const [categoriaProducto, setCategoriaProducto] =
        useState("Comida");
    const [precioProducto, setPrecioProducto] = useState("");
    const [sectorProducto, setSectorProducto] = useState("Cocina");
    const [tipoProducto, setTipoProducto] = useState<
        "bajo_pedido" | "preelaborado"
    >("bajo_pedido");


    // =========================================================
    // REGISTRAR MOVIMIENTO
    // =========================================================

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

            setMensajeErrorStock(
                "La cantidad debe ser mayor que 0."
            );

            return;
        }

        const materiaPrima = materiasPrimas.find(
            (materia) =>
                materia.id === materiaPrimaSeleccionada
        );

        if (!materiaPrima) {

            setMensajeErrorStock(
                "No se encontró la materia prima seleccionada."
            );

            return;
        }


        // =====================================================
        // ENTRADA
        // =====================================================

        if (tipo === "entrada") {

            registrarEntradaMateriaPrima(
                materiaPrimaSeleccionada,
                cantidadNumero
            );

            setMensajeErrorStock("");
            setCantidad("");
            setMateriaPrimaSeleccionada(null);

            return;
        }


        // =====================================================
        // SALIDA
        // =====================================================

        if (cantidadNumero > materiaPrima.stockActual) {

            setMensajeErrorStock(
                `No hay suficiente stock de ${materiaPrima.nombre}. ` +
                `Stock disponible: ${materiaPrima.stockActual} ${materiaPrima.unidad}.`
            );

            // IMPORTANTE:
            // No cerramos el formulario.
            // No borramos la cantidad.
            return;
        }


        registrarSalidaMateriaPrima(
            materiaPrimaSeleccionada,
            cantidadNumero
        );

        setMensajeErrorStock("");
        setCantidad("");
        setMateriaPrimaSeleccionada(null);
    };


    // =========================================================
    // AGREGAR MATERIA PRIMA
    // =========================================================

    const guardarMateriaPrima = () => {

        const stockMinimo = Number(stockMinimoMateriaPrima);
        const stockInicial = Number(stockInicialMateriaPrima);


        if (
            nombreMateriaPrima.trim() === "" ||
            categoriaMateriaPrima.trim() === "" ||
            stockMinimo < 0 ||
            stockInicial < 0
        ) {
            return;
        }


        const nombreRepetido = materiasPrimas.some(
            (materia) =>
                materia.nombre.trim().toLowerCase() ===
                nombreMateriaPrima.trim().toLowerCase()
        );


        if (nombreRepetido) {

            window.alert(
                "Ya existe una materia prima con ese nombre."
            );

            return;
        }


        agregarMateriaPrima(
            nombreMateriaPrima,
            categoriaMateriaPrima,
            unidadMateriaPrima,
            stockMinimo,
            stockInicial
        );


        setNombreMateriaPrima("");
        setCategoriaMateriaPrima("");
        setUnidadMateriaPrima("unidad");
        setStockMinimoMateriaPrima("");
        setStockInicialMateriaPrima("");

        setMostrarFormularioMateriaPrima(false);
    };

    const guardarProducto = () => {
        if (
            nombreProducto.trim() === "" ||
            precioProducto === "" ||
            Number(precioProducto) < 0
        ) {
            return;
        }

        agregarProducto(
            nombreProducto,
            Number(precioProducto),
            categoriaProducto,
            sectorProducto,
            tipoProducto
        );

        setNombreProducto("");
        setCategoriaProducto("Comida");
        setPrecioProducto("");
        setSectorProducto("Cocina");
        setTipoProducto("bajo_pedido");
        setMostrarFormularioProducto(false);
    };


    // =========================================================
    // CAMBIAR DE PESTAÑA
    // =========================================================

    const cambiarVista = (
        nuevaVista:
            | "materiasPrimas"
            | "productos"
            | "movimientos"
    ) => {

        setVista(nuevaVista);

        setMateriaPrimaSeleccionada(null);
        setCantidad("");
        setMensajeErrorStock("");
    };


    // =========================================================
    // SELECCIONAR MATERIA PRIMA
    // =========================================================

    const seleccionarMateriaPrima = (id: number) => {

        setMateriaPrimaSeleccionada(id);
        setCantidad("");
        setMensajeErrorStock("");
    };


    return (
        <div className="dashboard-content">

            {/* =================================================
                ENCABEZADO
            ================================================= */}

            <div className="stock-header">

                <div>

                    <h1>Stock</h1>

                    <p>
                        Gestión de materias primas y productos
                        de la cafetería.
                    </p>

                </div>

            </div>


            {/* =================================================
                SELECTOR DE VISTA
            ================================================= */}

            <div className="stock-tabs">

                <button
                    className={
                        vista === "materiasPrimas"
                            ? "stock-tab stock-tab-active"
                            : "stock-tab"
                    }
                    onClick={() =>
                        cambiarVista("materiasPrimas")
                    }
                >
                    🧂 Materias primas
                </button>


                <button
                    className={
                        vista === "productos"
                            ? "stock-tab stock-tab-active"
                            : "stock-tab"
                    }
                    onClick={() =>
                        cambiarVista("productos")
                    }
                >
                    🛍 Productos
                </button>


                <button
                    className={
                        vista === "movimientos"
                            ? "stock-tab stock-tab-active"
                            : "stock-tab"
                    }
                    onClick={() =>
                        cambiarVista("movimientos")
                    }
                >
                    📋 Movimientos
                </button>

            </div>


            {/* =================================================
                MATERIAS PRIMAS
            ================================================= */}

            {vista === "materiasPrimas" && (

                <>

                    {/* =================================================
                        BOTÓN NUEVA MATERIA PRIMA
                    ================================================= */}

                    <div className="stock-section-actions">

                        <button
                            className="primary-button"
                            onClick={() => {

                                setMostrarFormularioMateriaPrima(
                                    !mostrarFormularioMateriaPrima
                                );

                                setMensajeErrorStock("");
                            }}
                        >
                            + Nueva materia prima
                        </button>

                    </div>


                    {/* =================================================
                        FORMULARIO NUEVA MATERIA PRIMA
                    ================================================= */}

                    {mostrarFormularioMateriaPrima && (

                        <div className="stock-materia-form">

                            <h2>
                                Nueva materia prima
                            </h2>


                            <input
                                type="text"
                                placeholder="Nombre"
                                value={nombreMateriaPrima}
                                onChange={(e) =>
                                    setNombreMateriaPrima(
                                        e.target.value
                                    )
                                }
                            />


                            <input
                                type="text"
                                placeholder="Categoría"
                                value={categoriaMateriaPrima}
                                onChange={(e) =>
                                    setCategoriaMateriaPrima(
                                        e.target.value
                                    )
                                }
                            />


                            <select
                                value={unidadMateriaPrima}
                                onChange={(e) =>
                                    setUnidadMateriaPrima(
                                        e.target.value as
                                        typeof unidadMateriaPrima
                                    )
                                }
                            >

                                <option value="unidad">
                                    Unidad
                                </option>

                                <option value="kg">
                                    Kilogramo
                                </option>

                                <option value="litro">
                                    Litro
                                </option>

                            </select>


                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Stock mínimo"
                                value={stockMinimoMateriaPrima}
                                onChange={(e) =>
                                    setStockMinimoMateriaPrima(
                                        e.target.value
                                    )
                                }
                            />


                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Cantidad inicial"
                                value={stockInicialMateriaPrima}
                                onChange={(e) =>
                                    setStockInicialMateriaPrima(
                                        e.target.value
                                    )
                                }
                            />


                            <div className="stock-movimiento-actions">

                                <button
                                    className="primary-button"
                                    onClick={guardarMateriaPrima}
                                >
                                    Guardar
                                </button>


                                <button
                                    className="stock-button"
                                    onClick={() => {

                                        setMostrarFormularioMateriaPrima(
                                            false
                                        );

                                    }}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        TABLA DE MATERIAS PRIMAS
                    ================================================= */}

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
                                                !materia.activo
                                                    ? "stock-inactivo"
                                                    : stockBajo
                                                    ? "stock-bajo"
                                                    : "stock-normal"
                                            }
                                        >

                                            {!materia.activo
                                                ? "Desactivado"
                                                : stockBajo
                                                ? "Stock bajo"
                                                : "Normal"}

                                        </span>

                                    </span>


                                    <div className="stock-actions">

                                        <button
                                            className="stock-button"
                                            onClick={() =>
                                                seleccionarMateriaPrima(
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


                    {/* =================================================
                        FORMULARIO DE MOVIMIENTO
                    ================================================= */}

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


                            {/* =================================================
                                CARTEL DE ERROR
                            ================================================= */}

                            {mensajeErrorStock !== "" && (

                                <div
                                    style={{
                                        marginTop: "15px",
                                        marginBottom: "15px",
                                        padding: "12px 15px",
                                        borderRadius: "8px",
                                        backgroundColor: "#fee2e2",
                                        border: "1px solid #fca5a5",
                                        color: "#b91c1c",
                                        fontWeight: 600
                                    }}
                                >
                                    ⚠️ {mensajeErrorStock}
                                </div>

                            )}


                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Cantidad"
                                value={cantidad}
                                onChange={(e) => {

                                    setCantidad(
                                        e.target.value
                                    );

                                    setMensajeErrorStock("");

                                }}
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

                                        setMensajeErrorStock("");

                                    }}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </div>

                    )}

                </>

            )}


            {/* =================================================
                PRODUCTOS
            ================================================= */}

            {vista === "productos" && (

                <>

                <div className="stock-section-actions">
                    <button
                        className="primary-button"
                        onClick={() =>
                            setMostrarFormularioProducto(
                                !mostrarFormularioProducto
                            )
                        }
                    >
                        + Nuevo producto
                    </button>
                </div>

                {mostrarFormularioProducto && (
                    <div className="stock-materia-form">
                        <h2>Nuevo producto</h2>

                        <input
                            type="text"
                            placeholder="Nombre"
                            value={nombreProducto}
                            onChange={(e) =>
                                setNombreProducto(e.target.value)
                            }
                        />

                        <input
                            type="text"
                            placeholder="Categoría"
                            value={categoriaProducto}
                            onChange={(e) =>
                                setCategoriaProducto(e.target.value)
                            }
                        />

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="Precio"
                            value={precioProducto}
                            onChange={(e) =>
                                setPrecioProducto(e.target.value)
                            }
                        />

                        <select
                            value={sectorProducto}
                            onChange={(e) =>
                                setSectorProducto(e.target.value)
                            }
                        >
                            <option value="Cocina">Cocina</option>
                            <option value="Cafetería">Cafetería</option>
                            <option value="Pastelería">Pastelería</option>
                        </select>

                        <select
                            value={tipoProducto}
                            onChange={(e) =>
                                setTipoProducto(
                                    e.target.value as typeof tipoProducto
                                )
                            }
                        >
                            <option value="bajo_pedido">Bajo pedido</option>
                            <option value="preelaborado">Preelaborado</option>
                        </select>

                        <div className="stock-movimiento-actions">
                            <button
                                className="primary-button"
                                onClick={guardarProducto}
                            >
                                Guardar
                            </button>

                            <button
                                className="stock-button"
                                onClick={() =>
                                    setMostrarFormularioProducto(false)
                                }
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

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

                </>

            )}


            {/* =================================================
                OPERACIONES DE STOCK
            ================================================= */}

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