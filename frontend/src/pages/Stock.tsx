import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowDownToLine,
    ArrowUpFromLine,
    ClipboardList,
    Factory,
    ShoppingBag,
    TriangleAlert,
    Wheat,
    X,
} from "lucide-react";
import { useStock } from "../context/useStock";
import { coincideBusqueda, normalizarTexto, numeroValido } from "../validaciones";
import { useToast } from "../context/useToast";

const formatearCantidad = (valor: number) =>
    new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(valor);

function Stock() {
    const { mostrarToast } = useToast();
    const navigate = useNavigate();

    const {
        materiasPrimas,
        productos,
        recetas,
        agregarMateriaPrima,
        editarMateriaPrima,
        cambiarEstadoMateriaPrima,
        registrarEntradaMateriaPrima,
        registrarEntradaProducto,
        editarStockMinimoProducto,
        registrarSalidaMateriaPrima,
        operacionesStock
    } = useStock();

    const [vista, setVista] = useState<
        "materiasPrimas" | "productos" | "movimientos"
    >("materiasPrimas");

    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] =
        useState<number | null>(null);

    const [cantidad, setCantidad] = useState("");
    const [productoStockSeleccionado, setProductoStockSeleccionado] = useState<number | null>(null);
    const [cantidadCompraProducto, setCantidadCompraProducto] = useState("");
    const [minimoReposicionProducto, setMinimoReposicionProducto] = useState("");
    const [errorGestionProducto, setErrorGestionProducto] = useState("");
    const [guardandoMinimoProducto, setGuardandoMinimoProducto] = useState(false);

    const [mensajeErrorStock, setMensajeErrorStock] = useState("");
    const [mensajeErrorMateriaPrima, setMensajeErrorMateriaPrima] = useState("");

    const cerrarModalMovimiento = () => {
        setCantidad("");
        setMateriaPrimaSeleccionada(null);
        setMensajeErrorStock("");
    };

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

    const [busquedaMateriaPrima, setBusquedaMateriaPrima] = useState("");
    const [busquedaMateriaPrimaDebounce, setBusquedaMateriaPrimaDebounce] = useState("");
    const [busquedaProductoStock, setBusquedaProductoStock] = useState("");
    const [busquedaProductoStockDebounce, setBusquedaProductoStockDebounce] = useState("");

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            setBusquedaMateriaPrimaDebounce(normalizarTexto(busquedaMateriaPrima));
        }, 500);

        return () => window.clearTimeout(temporizador);
    }, [busquedaMateriaPrima]);

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            setBusquedaProductoStockDebounce(normalizarTexto(busquedaProductoStock));
        }, 500);

        return () => window.clearTimeout(temporizador);
    }, [busquedaProductoStock]);

    const materiasPrimasFiltradas = materiasPrimas.filter((materia) => {
        const textoBusqueda = busquedaMateriaPrimaDebounce;

        return (
            coincideBusqueda(materia.nombre, textoBusqueda) ||
            coincideBusqueda(materia.categoria, textoBusqueda)
        );
    });

    // =========================================================
    // REGISTRAR MOVIMIENTO
    // =========================================================

    const registrarMovimiento = async (
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
            const entradaRegistrada = await registrarEntradaMateriaPrima(
                materiaPrimaSeleccionada,
                cantidadNumero
            );
            if (!entradaRegistrada) {
                setMensajeErrorStock("No se pudo registrar la entrada en Supabase.");
                return;
            }

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
                `Stock disponible: ${formatearCantidad(materiaPrima.stockActual)} ${materiaPrima.unidad}.`
            );

            // IMPORTANTE:
            // No cerramos el formulario.
            // No borramos la cantidad.
            return;
        }


        const salidaRegistrada = await registrarSalidaMateriaPrima(
            materiaPrimaSeleccionada,
            cantidadNumero
        );

        if (!salidaRegistrada) {
            setMensajeErrorStock(
                `No hay suficiente stock de ${materiaPrima.nombre}. Stock disponible: ${formatearCantidad(materiaPrima.stockActual)} ${materiaPrima.unidad}.`
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

    const guardarMateriaPrima = async () => {

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
            const guardada = await editarMateriaPrima(
                materiaPrimaEditando,
                nombreMateriaPrima,
                categoriaMateriaPrima,
                unidadMateriaPrima,
                stockMinimo
            );
            if (!guardada) {
                setMensajeErrorMateriaPrima("No se pudo actualizar en Supabase. Revisá tus permisos y la conexión.");
                return;
            }
        } else {
            const materiaPrimaAgregada = await agregarMateriaPrima(
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

    const productosInventarioFiltrados = productos.filter((producto) => {
        const textoBusqueda = busquedaProductoStockDebounce;
        const tipoProducto = producto.tipoElaboracion === "bajo_pedido"
            ? "Bajo pedido"
            : producto.tipoElaboracion === "reventa"
                ? "Compra / reventa"
                : "Preelaborado";

        return (
            coincideBusqueda(producto.nombre, textoBusqueda) ||
            coincideBusqueda(producto.categoria, textoBusqueda) ||
            coincideBusqueda(tipoProducto, textoBusqueda)
        );
    });
    const cantidadProductosBajoPedido = productos.filter(
        (producto) => producto.tipoElaboracion === "bajo_pedido"
    ).length;
    const cantidadPreparablesPorReceta = (productoId: number) => {
        const receta = recetas.find((item) => item.productoId === productoId);
        if (!receta || receta.ingredientes.length === 0) return null;

        const cantidadesDisponibles = receta.ingredientes.map((ingrediente) => {
            const materiaPrima = materiasPrimas.find(
                (item) => item.id === ingrediente.materiaPrimaId && item.activo
            );
            if (!materiaPrima || ingrediente.cantidad <= 0) return null;
            return Math.floor(materiaPrima.stockActual / ingrediente.cantidad);
        });
        if (cantidadesDisponibles.some((cantidad) => cantidad === null)) return null;
        return Math.min(...cantidadesDisponibles as number[]);
    };
    const unidadCantidadPreparada = (unidad: string, cantidad: number) => {
        if (unidad === "unidad") return cantidad === 1 ? "unidad" : "unidades";
        if (unidad === "porcion") return cantidad === 1 ? "porción" : "porciones";
        if (unidad === "litro") return cantidad === 1 ? "litro" : "litros";
        return "kg";
    };
    const productoStockActual = productos.find((producto) => producto.id === productoStockSeleccionado);

    const abrirGestionProducto = (productoId: number) => {
        const producto = productos.find((item) => item.id === productoId);
        if (!producto || producto.tipoElaboracion === "bajo_pedido") return;
        setProductoStockSeleccionado(productoId);
        setMinimoReposicionProducto(String(producto.stockMinimo));
        setCantidadCompraProducto("");
        setErrorGestionProducto("");
    };

    const cerrarGestionProducto = () => {
        setProductoStockSeleccionado(null);
        setCantidadCompraProducto("");
        setErrorGestionProducto("");
    };

    const guardarMinimoReposicion = async () => {
        if (productoStockSeleccionado === null || !numeroValido(minimoReposicionProducto, 0, Number.POSITIVE_INFINITY, true)) {
            setErrorGestionProducto("Ingresá un mínimo de reposición igual o mayor que 0.");
            return;
        }
        setGuardandoMinimoProducto(true);
        const guardado = await editarStockMinimoProducto(productoStockSeleccionado, Number(minimoReposicionProducto));
        setGuardandoMinimoProducto(false);
        if (!guardado) {
            setErrorGestionProducto("No se pudo guardar el mínimo de reposición.");
            return;
        }
        setErrorGestionProducto("");
        mostrarToast("Mínimo de reposición actualizado.");
    };

    const registrarCompraProducto = async () => {
        if (productoStockSeleccionado === null || !numeroValido(cantidadCompraProducto, 1, Number.POSITIVE_INFINITY, true)) {
            setErrorGestionProducto("Ingresá una cantidad comprada entera mayor que 0.");
            return;
        }
        const registrada = await registrarEntradaProducto(productoStockSeleccionado, Number(cantidadCompraProducto));
        if (!registrada) {
            setErrorGestionProducto("No se pudo registrar la compra. Revisá la conexión e intentá nuevamente.");
            return;
        }
        cerrarGestionProducto();
        mostrarToast("Compra registrada y stock actualizado.");
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
                    <Wheat className="ui-icon" aria-hidden="true" />
                    Materias primas
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
                    <ShoppingBag className="ui-icon" aria-hidden="true" />
                    Productos
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
                    <ClipboardList className="ui-icon" aria-hidden="true" />
                    Movimientos
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

                        <div
                            className={materiaPrimaEditando !== null ? "stock-modal-overlay" : undefined}
                            onMouseDown={(event) => {
                                if (materiaPrimaEditando !== null && event.target === event.currentTarget) {
                                    cancelarEdicionMateriaPrima();
                                }
                            }}
                        >
                        <div
                            className={`stock-materia-form ${materiaPrimaEditando !== null ? "stock-modal-dialog" : ""}`}
                            data-shortcut-form
                            role={materiaPrimaEditando !== null ? "dialog" : undefined}
                            aria-modal={materiaPrimaEditando !== null ? true : undefined}
                            aria-labelledby={materiaPrimaEditando !== null ? "stock-form-title" : undefined}
                            onMouseDown={(event) => event.stopPropagation()}
                        >

                            <div className="stock-modal-heading">
                                <h2 id="stock-form-title">
                                    {materiaPrimaEditando !== null
                                        ? "Editar materia prima"
                                        : "Nueva materia prima"}
                                </h2>
                                {materiaPrimaEditando !== null && (
                                    <button type="button" data-shortcut-close className="stock-modal-close" aria-label="Cerrar edición" onClick={cancelarEdicionMateriaPrima}>
                                        ×
                                    </button>
                                )}
                            </div>

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
                                    data-shortcut-enter
                                    onClick={guardarMateriaPrima}
                                >
                                    {materiaPrimaEditando !== null ? "Guardar cambios" : "Guardar"}
                                </button>


                                <button
                                    className="stock-button"
                                    type="button"
                                    data-shortcut-close
                                    onClick={cancelarEdicionMateriaPrima}
                                >
                                    Cancelar
                                </button>

                            </div>

                        </div>
                        </div>

                    )}


                    {/* =================================================
                        TABLA DE MATERIAS PRIMAS
                    ================================================= */}

                    <div className="stock-buscador-wrap">
                        <input
                            type="search"
                            className="stock-buscador"
                            placeholder="Buscar materia prima..."
                            value={busquedaMateriaPrima}
                            onChange={(event) => setBusquedaMateriaPrima(event.target.value)}
                        />
                    </div>

                    <div className="stock-table stock-table-materias">

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


                        {materiasPrimasFiltradas.length === 0 && (
                            <div className="stock-empty" role="status">
                                <h2>No se encontraron materias primas</h2>
                                <p>Probá cambiar la búsqueda.</p>
                            </div>
                        )}

                        {materiasPrimasFiltradas.map((materia) => {

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
                                        {formatearCantidad(materia.stockActual)}{" "}
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
                                            className="stock-button stock-action-primary"
                                            onClick={() =>
                                                seleccionarMateriaPrima(
                                                    materia.id
                                                )
                                            }
                                        >
                                            Registrar movimiento
                                        </button>

                                        <button
                                            className="stock-button stock-action-edit"
                                            onClick={() => comenzarEdicionMateriaPrima(materia.id)}
                                        >
                                            Editar
                                        </button>


                                        <button
                                            className="stock-button"
                                            onClick={async () =>
                                                {
                                                    const activo = !materia.activo;
                                                    const actualizado = await cambiarEstadoMateriaPrima(materia.id, activo);
                                                    if (!actualizado) {
                                                        mostrarToast("No se pudo cambiar el estado en Supabase.");
                                                        return;
                                                    }
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

                        <div
                            className="stock-modal-overlay"
                            onMouseDown={(event) => {
                                if (event.target === event.currentTarget) cerrarModalMovimiento();
                            }}
                        >
                        <div className="stock-movimiento stock-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="stock-movimiento-title" onMouseDown={(event) => event.stopPropagation()}>

                            <div className="stock-modal-heading">
                                <h2 id="stock-movimiento-title">Registrar movimiento</h2>
                                <button type="button" data-shortcut-close className="stock-modal-close" aria-label="Cerrar movimiento" onClick={cerrarModalMovimiento}>
                                    ×
                                </button>
                            </div>


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
                                    <TriangleAlert className="ui-icon" aria-hidden="true" />
                                    {mensajeErrorStock}
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
                                    type="button"
                                    className="stock-button"
                                    data-shortcut-close
                                    onClick={cerrarModalMovimiento}
                                >
                                    Cancelar
                                </button>

                            </div>

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
                        <h2>Productos e inventario</h2>
                        <p>
                            {cantidadProductosBajoPedido} productos bajo pedido. Se muestran aquí, pero sus existencias se controlan mediante la receta y las materias primas.
                        </p>
                    </div>
                    <label className="stock-search-inline">
                        <span>Buscar producto</span>
                        <input
                            type="search"
                            className="stock-buscador stock-buscador-inline"
                            placeholder="Buscar producto..."
                            value={busquedaProductoStock}
                            onChange={(event) => setBusquedaProductoStock(event.target.value)}
                        />
                    </label>
                </div>

                <p className="stock-form-note">
                    Los productos bajo pedido muestran cuántas unidades permite preparar la receta con las materias primas disponibles. En Compra / reventa registrá las compras desde su fila y configurá el mínimo para saber cuándo reponer.
                </p>

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

                        <span>Disponible</span>

                        <span>
                            Mínimo para reponer
                        </span>

                        <span>
                            Control
                        </span>

                        <span>
                            Acción
                        </span>

                    </div>


                {productosInventarioFiltrados.length === 0 && (
                    <div className="stock-empty" role="status">
                        <h2>No se encontraron productos</h2>
                        <p>Probá cambiar la búsqueda.</p>
                    </div>
                )}

                {productosInventarioFiltrados.map((producto) => {

                            const controlaStockPropio = producto.tipoElaboracion !== "bajo_pedido";
                            const cantidadPreparables = producto.tipoElaboracion === "bajo_pedido"
                                ? cantidadPreparablesPorReceta(producto.id)
                                : null;
                            const stockBajo = controlaStockPropio &&
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
                                        {producto.tipoElaboracion === "bajo_pedido"
                                            ? "Bajo pedido"
                                            : producto.tipoElaboracion === "reventa"
                                                ? "Compra / reventa"
                                                : "Preelaborado"}
                                    </span>


                                    <span>
                                        {controlaStockPropio
                                            ? `${formatearCantidad(producto.stockActual)} ${producto.unidadVenta}`
                                            : cantidadPreparables === null
                                                ? "Sin receta completa"
                                                : `${cantidadPreparables} ${unidadCantidadPreparada(producto.unidadVenta, cantidadPreparables)}`}
                                    </span>

                                    <span>
                                        {controlaStockPropio
                                            ? `${formatearCantidad(producto.stockMinimo)} ${producto.unidadVenta}`
                                            : "—"}
                                    </span>


                                    <span>

                                        <span
                                            className={
                                                !controlaStockPropio
                                                    ? "stock-sin-stock-propio"
                                                    : stockBajo
                                                        ? "stock-bajo"
                                                        : "stock-normal"
                                            }
                                        >
                                            {!controlaStockPropio
                                                ? cantidadPreparables === null ? "Revisar receta" : "Según receta"
                                                : stockBajo
                                                    ? "Stock bajo"
                                                    : "Normal"}
                                        </span>

                                    </span>

                                    <span>
                                        {controlaStockPropio ? (
                                            <button
                                                type="button"
                                                className="stock-button stock-action-edit"
                                                onClick={() => abrirGestionProducto(producto.id)}
                                                aria-label={`Gestionar stock de ${producto.nombre}`}
                                            >
                                                {producto.tipoElaboracion === "reventa"
                                                    ? <ShoppingBag className="ui-icon" aria-hidden="true" />
                                                    : <Factory className="ui-icon" aria-hidden="true" />}
                                                Gestionar
                                            </button>
                                        ) : producto.tipoElaboracion === "bajo_pedido" ? (
                                            <span className="stock-row-note">Se prepara al pedir</span>
                                        ) : null}
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
                                const IconoOperacion = operacion.tipo === "produccion"
                                    ? Factory
                                    : operacion.tipo === "entrada"
                                        ? ArrowDownToLine
                                        : operacion.tipo === "salida"
                                            ? ArrowUpFromLine
                                            : ClipboardList;
                                const etiquetaOperacion = operacion.tipo === "produccion"
                                    ? "Producción"
                                    : operacion.tipo === "entrada"
                                        ? "Entrada de stock"
                                        : operacion.tipo === "salida"
                                            ? "Salida de stock"
                                            : "Comanda";

                                return (

                                    <div
                                        className="operacion-stock"
                                        key={operacion.id}
                                    >

                                        <div className="operacion-stock-header">

                                            <div>

                                                <strong>
                                                    <IconoOperacion className="ui-icon" aria-hidden="true" />
                                                    {etiquetaOperacion}
                                                </strong>


                                                <p>
                                                    {operacion.descripcion}
                                                </p>
                                                {operacion.responsableNombre && (
                                                    <small>Registró: {operacion.responsableNombre}</small>
                                                )}

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

                                                    const materiaPrima =
                                                        movimiento.categoria === "materiaPrima"
                                                            ? materiasPrimas.find(
                                                                (materia) =>
                                                                    materia.id === movimiento.referenciaId
                                                            )
                                                            : undefined;
                                                    const producto =
                                                        movimiento.categoria === "producto"
                                                            ? productos.find(
                                                                (productoActual) =>
                                                                    productoActual.id === movimiento.referenciaId
                                                            )
                                                            : undefined;
                                                    const nombre =
                                                        materiaPrima?.nombre ?? producto?.nombre;
                                                    const unidad =
                                                        materiaPrima?.unidad ?? producto?.unidadVenta;
                                                    const sumaStock = ["entrada", "produccion", "ajuste"].includes(movimiento.tipo);


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


                                                            <strong className={sumaStock ? "stock-movimiento-positivo" : "stock-movimiento-negativo"}>
                                                                {sumaStock ? "+" : "-"} {formatearCantidad(movimiento.cantidad)}
                                                                {unidad ? ` ${unidad}` : ""}
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

            {productoStockActual && (
                <div className="stock-modal-overlay" onClick={cerrarGestionProducto}>
                    <section
                        className="stock-materia-form stock-modal-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="producto-stock-dialog-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="stock-modal-heading">
                            <div>
                                <h2 id="producto-stock-dialog-title">Stock de {productoStockActual.nombre}</h2>
                                <p>
                                    Disponible: {formatearCantidad(productoStockActual.stockActual)} {productoStockActual.unidadVenta}
                                </p>
                            </div>
                            <button type="button" data-shortcut-close className="stock-modal-close" onClick={cerrarGestionProducto} aria-label="Cerrar">
                                <X size={20} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="stock-form-fields">
                            <label>
                                Mínimo para volver a comprar
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                    value={minimoReposicionProducto}
                                    onChange={(event) => {
                                        setMinimoReposicionProducto(event.target.value);
                                        setErrorGestionProducto("");
                                    }}
                                />
                            </label>
                        </div>
                        <p className="stock-form-note">
                            Se marcará como stock bajo cuando las existencias lleguen a este mínimo o queden por debajo.
                        </p>
                        {errorGestionProducto && <p className="form-field-error" role="alert">{errorGestionProducto}</p>}
                        <div className="stock-movimiento-actions stock-producto-stock-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                disabled={guardandoMinimoProducto}
                                onClick={() => void guardarMinimoReposicion()}
                            >
                                Guardar mínimo
                            </button>

                            {productoStockActual.tipoElaboracion === "reventa" ? (
                                <>
                                    <label className="stock-producto-cantidad-compra">
                                        Cantidad comprada
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            inputMode="numeric"
                                            value={cantidadCompraProducto}
                                            onChange={(event) => {
                                                setCantidadCompraProducto(event.target.value);
                                                setErrorGestionProducto("");
                                            }}
                                        />
                                    </label>
                                    <button type="button" className="primary-button" onClick={() => void registrarCompraProducto()}>
                                        <ShoppingBag className="ui-icon" aria-hidden="true" />
                                        Registrar compra
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={() => navigate(`/produccion?productoId=${productoStockActual.id}`)}
                                >
                                    <Factory className="ui-icon" aria-hidden="true" />
                                    Registrar producción
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            )}

        </div>
    );
}

export default Stock;
