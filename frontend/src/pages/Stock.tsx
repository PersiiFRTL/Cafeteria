import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";
import { numeroValido } from "../validaciones";
import { useToast } from "../context/useToast";

function Stock() {
    const { mostrarToast } = useToast();

    const {
        materiasPrimas,
        productos,
        agregarMateriaPrima,
        editarMateriaPrima,
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
    const [mensajeErrorMateriaPrima, setMensajeErrorMateriaPrima] = useState("");

    const [
        mostrarFormularioMateriaPrima,
        setMostrarFormularioMateriaPrima
    ] = useState(false);
    const [materiaPrimaEditando, setMateriaPrimaEditando] =
        useState<number | null>(null);

    const [nombreMateriaPrima, setNombreMateriaPrima] = useState("");
    const [categoriaMateriaPrima, setCategoriaMateriaPrima] = useState("");

    const [unidadMateriaPrima, setUnidadMateriaPrima] = useState<
        "unidad" | "kg" | "litro"
    >("unidad");

    const [stockMinimoMateriaPrima, setStockMinimoMateriaPrima] =
        useState("");

    const [stockInicialMateriaPrima, setStockInicialMateriaPrima] =
        useState("");

    const [productoStockSeleccionado, setProductoStockSeleccionado] =
        useState<number | null>(null);


    // =========================================================
    // REGISTRAR MOVIMIENTO
    // =========================================================

    const registrarMovimiento = (
        tipo: "entrada" | "salida"
    ) => {

        if (materiaPrimaSeleccionada === null) {
            setMensajeErrorStock("Seleccioná una materia prima.");
            return;
        }

        if (!numeroValido(cantidad, Number.MIN_VALUE)) {

            setMensajeErrorStock(
                "La cantidad debe ser mayor que 0."
            );

            return;
        }

        const cantidadNumero = Number(cantidad);

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

            mostrarToast("Entrada de stock registrada.");
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


        const salidaRegistrada = registrarSalidaMateriaPrima(
            materiaPrimaSeleccionada,
            cantidadNumero
        );

        if (!salidaRegistrada) {
            setMensajeErrorStock(
                `No hay suficiente stock de ${materiaPrima.nombre}. Stock disponible: ${materiaPrima.stockActual} ${materiaPrima.unidad}.`
            );
            return;
        }

        mostrarToast("Salida de stock registrada.");
        setMensajeErrorStock("");
        setCantidad("");
        setMateriaPrimaSeleccionada(null);
    };


    // =========================================================
    // AGREGAR MATERIA PRIMA
    // =========================================================

    const guardarMateriaPrima = () => {

        if (!nombreMateriaPrima.trim() || !categoriaMateriaPrima.trim()) {
            setMensajeErrorMateriaPrima("Completá el nombre y la categoría.");
            return;
        }

        if (!numeroValido(stockMinimoMateriaPrima, 0)) {
            setMensajeErrorMateriaPrima("El stock mínimo debe ser un número igual o mayor que 0.");
            return;
        }

        if (materiaPrimaEditando === null && !numeroValido(stockInicialMateriaPrima, 0)) {
            setMensajeErrorMateriaPrima("La cantidad inicial debe ser un número igual o mayor que 0.");
            return;
        }

        const stockMinimo = Number(stockMinimoMateriaPrima);
        const stockInicial = Number(stockInicialMateriaPrima);


        const nombreRepetido = materiasPrimas.some(
            (materia) =>
                materia.id !== materiaPrimaEditando &&
                materia.nombre.trim().toLowerCase() ===
                nombreMateriaPrima.trim().toLowerCase()
        );


        if (nombreRepetido) {
            setMensajeErrorMateriaPrima("Ya existe una materia prima con ese nombre.");
            return;
        }


        if (materiaPrimaEditando !== null) {
            editarMateriaPrima(
                materiaPrimaEditando,
                nombreMateriaPrima,
                categoriaMateriaPrima,
                unidadMateriaPrima,
                stockMinimo
            );
        } else {
            const materiaPrimaAgregada = agregarMateriaPrima(
                nombreMateriaPrima,
                categoriaMateriaPrima,
                unidadMateriaPrima,
                stockMinimo,
                stockInicial
            );

            if (!materiaPrimaAgregada) {
                setMensajeErrorMateriaPrima("No se pudo agregar la materia prima. Revisá si ya existe con ese nombre.");
                return;
            }
        }

        mostrarToast(materiaPrimaEditando !== null
            ? "Materia prima actualizada."
            : "Materia prima creada.");

        setNombreMateriaPrima("");
        setCategoriaMateriaPrima("");
        setUnidadMateriaPrima("unidad");
        setStockMinimoMateriaPrima("");
        setStockInicialMateriaPrima("");
        setMateriaPrimaEditando(null);
        setMensajeErrorMateriaPrima("");

        setMostrarFormularioMateriaPrima(false);
    };

    const comenzarEdicionMateriaPrima = (id: number) => {
        const materia = materiasPrimas.find((item) => item.id === id);
        if (!materia) return;

        setMateriaPrimaEditando(id);
        setNombreMateriaPrima(materia.nombre);
        setCategoriaMateriaPrima(materia.categoria);
        setUnidadMateriaPrima(materia.unidad);
        setStockMinimoMateriaPrima(String(materia.stockMinimo));
        setStockInicialMateriaPrima(String(materia.stockActual));
        setMensajeErrorMateriaPrima("");
        setMostrarFormularioMateriaPrima(true);
    };

    const cancelarEdicionMateriaPrima = () => {
        setMateriaPrimaEditando(null);
        setNombreMateriaPrima("");
        setCategoriaMateriaPrima("");
        setUnidadMateriaPrima("unidad");
        setStockMinimoMateriaPrima("");
        setStockInicialMateriaPrima("");
        setMostrarFormularioMateriaPrima(false);
        setMensajeErrorMateriaPrima("");
    };

    const productosPreelaborados = productos.filter(
        (producto) => producto.tipoElaboracion === "preelaborado"
    );
    const productosStockVisibles = productoStockSeleccionado === null
        ? productosPreelaborados
        : productosPreelaborados.filter(
              (producto) => producto.id === productoStockSeleccionado
          );


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
                                cancelarEdicionMateriaPrima();

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
                                {materiaPrimaEditando !== null
                                    ? "Editar materia prima"
                                    : "Nueva materia prima"}
                            </h2>

                            <div className="stock-form-fields">

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
                                required
                                placeholder="Stock mínimo"
                                value={stockMinimoMateriaPrima}
                                onChange={(e) =>
                                    setStockMinimoMateriaPrima(
                                        e.target.value
                                    )
                                }
                            />


                            {materiaPrimaEditando !== null ? (
                                <p className="stock-form-note">
                                    Stock actual: {stockInicialMateriaPrima} {unidadMateriaPrima}. Para modificarlo, registrá una entrada o salida.
                                </p>
                            ) : (
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="Cantidad inicial"
                                    value={stockInicialMateriaPrima}
                                    onChange={(e) =>
                                        setStockInicialMateriaPrima(e.target.value)
                                    }
                                />
                            )}

                            </div>

                            {mensajeErrorMateriaPrima && (
                                <p className="form-field-error" role="alert">
                                    {mensajeErrorMateriaPrima}
                                </p>
                            )}


                            <div className="stock-movimiento-actions">

                                <button
                                    className="primary-button"
                                    onClick={guardarMateriaPrima}
                                >
                                    {materiaPrimaEditando !== null ? "Guardar cambios" : "Guardar"}
                                </button>


                                <button
                                    className="stock-button"
                                    onClick={cancelarEdicionMateriaPrima}
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
                                            Registrar movimiento
                                        </button>

                                        <button
                                            className="stock-button"
                                            onClick={() => comenzarEdicionMateriaPrima(materia.id)}
                                        >
                                            Editar
                                        </button>


                                        <button
                                            className="stock-button"
                                            onClick={() =>
                                                {
                                                    const activo = !materia.activo;
                                                    cambiarEstadoMateriaPrima(materia.id, activo);
                                                    mostrarToast(activo
                                                        ? "Materia prima activada."
                                                        : "Materia prima desactivada.");
                                                }
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
                                required
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

                <div className="stock-productos-toolbar">
                    <div>
                        <h2>Productos preelaborados</h2>
                        <p>El stock aumenta al registrar una producción.</p>
                    </div>
                    <label>
                        Consultar producto
                        <select
                            value={productoStockSeleccionado ?? ""}
                            onChange={(event) =>
                                setProductoStockSeleccionado(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : null
                                )
                            }
                        >
                            <option value="">Todos los productos</option>
                            {productosPreelaborados.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                    {producto.nombre}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

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
                            Estado de stock
                        </span>

                    </div>


                    {productosStockVisibles.map((producto) => {

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