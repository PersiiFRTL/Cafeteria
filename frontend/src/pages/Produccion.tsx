import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStock } from "../context/useStock";
import { numeroValido } from "../validaciones";
import { useToast } from "../context/useToast";
import { repositorioSupabaseCatalogo } from "../services/supabaseCatalogoRepository";

const PRODUCCIONES_POR_PAGINA = 10;

function Produccion() {
    const { mostrarToast } = useToast();
    const [searchParams] = useSearchParams();

    const {
        productos,
        recetas,
        materiasPrimas,
        producciones,
        registrarProduccion
    } = useStock();

    const [productoId, setProductoId] = useState<number | null>(() => {
        const valor = Number(searchParams.get("productoId"));
        return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
    });

    const [cantidad, setCantidad] =
        useState("");

    const [mensaje, setMensaje] =
        useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"error" | "exito" | null>(null);
    const [produciendo, setProduciendo] = useState(false);

    const [produccionDetalleId, setProduccionDetalleId] =
        useState<number | null>(null);
    const [paginaHistorial, setPaginaHistorial] = useState(1);
    const [ordenHistorial, setOrdenHistorial] = useState<"antiguos" | "recientes">("antiguos");
    const [produccionesPagina, setProduccionesPagina] = useState<typeof producciones>([]);
    const [totalProducciones, setTotalProducciones] = useState(0);
    const [totalPaginasHistorial, setTotalPaginasHistorial] = useState(1);
    const [cargandoHistorial, setCargandoHistorial] = useState(true);
    const [errorHistorial, setErrorHistorial] = useState("");
    const [revisionHistorial, setRevisionHistorial] = useState(0);
    const idProduccionMasReciente = producciones.reduce((idMaximo, produccion) => Math.max(idMaximo, produccion.id), 0);

    useEffect(() => {
        let vigente = true;
        Promise.resolve().then(() => {
            if (!vigente) return;
            setCargandoHistorial(true);
            setErrorHistorial("");
        });
        repositorioSupabaseCatalogo.listarProduccionesPagina({
            page: paginaHistorial,
            limit: PRODUCCIONES_POR_PAGINA,
            orden: ordenHistorial
        }).then(({ producciones: pagina, pagination }) => {
            if (!vigente) return;
            const paginas = Math.max(1, pagination.totalPages);
            setProduccionesPagina(pagina as unknown as typeof producciones);
            setTotalProducciones(pagination.total);
            setTotalPaginasHistorial(paginas);
            if (paginaHistorial > paginas) setPaginaHistorial(paginas);
        }).catch((error: unknown) => {
            if (!vigente) return;
            setErrorHistorial(error instanceof Error ? error.message : "No se pudo cargar el historial de producción.");
            setProduccionesPagina([]);
            setTotalProducciones(0);
        }).finally(() => {
            if (vigente) setCargandoHistorial(false);
        });
        return () => { vigente = false; };
    }, [paginaHistorial, ordenHistorial, idProduccionMasReciente, revisionHistorial]);

    // ==========================
    // PRODUCTOS PREELABORADOS
    // ==========================

    const productosPreelaborados =
        productos.filter(
            (producto) =>
                producto.tipoElaboracion ===
                    "preelaborado" &&
                producto.activo
        );

    // ==========================
    // PRODUCTO SELECCIONADO
    // ==========================

    const productoSeleccionado =
        productos.find(
            (producto) =>
                producto.id === productoId
        );

    // ==========================
    // RECETA
    // ==========================

    const receta =
        recetas.find(
            (receta) =>
                receta.productoId === productoId && receta.activo
        );

    // ==========================
    // PRODUCIR
    // ==========================

    const producir = async () => {

        setMensaje("");
        setTipoMensaje(null);

        if (!productoId) {
            setMensaje(
                "Seleccioná un producto."
            );
            setTipoMensaje("error");
            return;
        }

        const cantidadProduccion =
            Number(cantidad);

        if (!numeroValido(cantidad, 1, Number.POSITIVE_INFINITY, true)) {
            setMensaje(
                "Ingresá una cantidad entera mayor que 0."
            );
            setTipoMensaje("error");
            return;
        }

        if (!receta) {
            setMensaje(
                "El producto no tiene una receta cargada."
            );
            setTipoMensaje("error");
            return;
        }

        if (produciendo) return;
        setProduciendo(true);
        let resultado: boolean;
        try {
            resultado = await registrarProduccion(
                productoId,
                cantidadProduccion
            );
        } finally {
            setProduciendo(false);
        }

        if (!resultado) {
            setMensaje(
                "No hay suficiente materia prima para realizar la producción."
            );
            setTipoMensaje("error");
            return;
        }

        setMensaje(
            `Producción realizada correctamente: ${cantidadProduccion} ${productoSeleccionado?.nombre}.`
        );
        setTipoMensaje("exito");
        mostrarToast("Producción registrada correctamente.");

        setCantidad("");
        setPaginaHistorial(1);
        setProduccionDetalleId(null);
        setRevisionHistorial((revision) => revision + 1);
    };

    return (
        <div>

            {/* ========================== */}
            {/* ENCABEZADO */}
            {/* ========================== */}

            <div className="produccion-header">

                <div>
                    <h1>Producción</h1>

                    <p>
                        Producción de productos
                        preelaborados
                    </p>
                </div>

            </div>


            {/* ========================== */}
            {/* FORMULARIO */}
            {/* ========================== */}

            <div className="produccion-form" data-shortcut-form>

                <h2>
                    Registrar producción
                </h2>

                <div className="produccion-fields">

                    <div>
                        <label>
                            Producto
                        </label>

                        <select
                            value={
                                productoId ?? ""
                            }
                            onChange={(e) => {

                                const valor =
                                    e.target.value;

                                setProductoId(
                                    valor
                                        ? Number(valor)
                                        : null
                                );

                                setMensaje("");
                                setTipoMensaje(null);
                            }}
                        >

                            <option value="">
                                Seleccionar producto
                            </option>

                            {productosPreelaborados.map(
                                (producto) => (
                                    <option
                                        key={
                                            producto.id
                                        }
                                        value={
                                            producto.id
                                        }
                                    >
                                        {
                                            producto.nombre
                                        }
                                    </option>
                                )
                            )}

                        </select>

                    </div>


                    <div>
                        <label>
                            Cantidad
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={cantidad}
                            onChange={(e) =>
                                setCantidad(
                                    e.target.value
                                )
                            }
                            placeholder="Ej: 30"
                        />
                    </div>


                    <button
                        type="button"
                        disabled={produciendo}
                        data-shortcut-enter
                        onClick={producir}
                    >
                        {produciendo && <span className="spinner-inline" aria-hidden="true" />}
                        {produciendo ? "Produciendo…" : "Producir"}
                    </button>

                </div>


                {/* ========================== */}
                {/* RECETA */}
                {/* ========================== */}

                {productoSeleccionado &&
                    receta && (

                        <div className="produccion-receta">

                            <h3>
                                Materias primas necesarias
                            </h3>

                            <div className="produccion-receta-lista">

                                {receta.ingredientes.map(
                                    (ingrediente) => {

                                        const materiaPrima =
                                            materiasPrimas.find(
                                                (mp) =>
                                                    mp.id ===
                                                    ingrediente.materiaPrimaId
                                            );

                                        if (
                                            !materiaPrima
                                        ) {
                                            return null;
                                        }

                                        const cantidadNecesaria =
                                            cantidad
                                                ? ingrediente.cantidad *
                                                  Number(cantidad)
                                                : ingrediente.cantidad;

                                        return (
                                            <div
                                                className="produccion-ingrediente"
                                                key={
                                                    ingrediente.materiaPrimaId
                                                }
                                            >

                                                <span>
                                                    {
                                                        materiaPrima.nombre
                                                    }
                                                </span>

                                                <strong>
                                                    {
                                                        cantidadNecesaria
                                                    }{" "}
                                                    {
                                                        materiaPrima.unidad
                                                    }
                                                </strong>

                                            </div>
                                        );
                                    }
                                )}

                            </div>

                        </div>
                    )}


                {/* ========================== */}
                {/* MENSAJE */}
                {/* ========================== */}

                {mensaje && (

                    <div className={`produccion-mensaje ${tipoMensaje ?? ""}`} role={tipoMensaje === "error" ? "alert" : "status"}>
                        {mensaje}
                    </div>

                )}

            </div>


            {/* ========================== */}
            {/* HISTORIAL */}
            {/* ========================== */}

            <div className="produccion-historial" aria-busy={cargandoHistorial}>

                <div className="section-header">

                    <div>
                        <h2>
                            Historial de producción
                        </h2>
                    </div>

                    <label className="produccion-orden-label" htmlFor="orden-historial-produccion">
                        Ordenar por
                        <select
                            id="orden-historial-produccion"
                            value={ordenHistorial}
                            onChange={(event) => {
                                setOrdenHistorial(event.target.value as typeof ordenHistorial);
                                setPaginaHistorial(1);
                                setProduccionDetalleId(null);
                            }}
                        >
                            <option value="antiguos">Más antiguas primero</option>
                            <option value="recientes">Más recientes primero</option>
                        </select>
                    </label>

                </div>


                <div className="produccion-table">

                    <div className="produccion-row produccion-row-header">

                        <span>
                            Producto
                        </span>

                        <span>
                            Cantidad
                        </span>

                        <span>
                            Fecha
                        </span>

                        <span>
                            Detalle
                        </span>

                    </div>


                    {cargandoHistorial ? (
                        <div className="informe-cargando" role="status" aria-live="polite">
                            <span className="spinner-inline" aria-hidden="true" />
                            Cargando historial de producción…
                        </div>
                    ) : errorHistorial ? (
                        <div className="produccion-vacia" role="alert">{errorHistorial}</div>
                    ) : totalProducciones === 0 ? (

                        <div className="produccion-vacia">
                            No hay producciones registradas.
                        </div>

                    ) : (

                        produccionesPagina.map(
                                (produccion) => {

                                    const producto =
                                        productos.find(
                                            (p) =>
                                                p.id ===
                                                produccion.productoId
                                        );

                                    const detalleAbierto =
                                        produccionDetalleId === produccion.id;

                                    return (
                                        <div className="produccion-history-entry" key={produccion.id}>
                                        <div className="produccion-row">

                                            <span>
                                                {
                                                    producto?.nombre ??
                                                    "Producto desconocido"
                                                }
                                            </span>

                                            <span>
                                                {
                                                    produccion.cantidad
                                                }
                                            </span>

                                            <span>
                                                {new Date(
                                                    produccion.fecha
                                                ).toLocaleString(
                                                    "es-AR",
                                                    {
                                                        hour12: false,
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }
                                                )}
                                                {produccion.responsableNombre && (
                                                    <small className="registro-responsable">
                                                        Registró: {produccion.responsableNombre}
                                                    </small>
                                                )}
                                            </span>

                                            <button
                                                className="produccion-detalle-button"
                                                aria-expanded={detalleAbierto}
                                                onClick={() =>
                                                    setProduccionDetalleId(
                                                        detalleAbierto ? null : produccion.id
                                                    )
                                                }
                                            >
                                                {detalleAbierto ? "Ocultar" : "Ver detalle"}
                                            </button>

                                        </div>

                                        {detalleAbierto && (
                                            <div className="produccion-detalle">
                                                <strong>Materias primas consumidas</strong>
                                                {produccion.ingredientes?.length ? (
                                                    produccion.ingredientes.map((ingrediente) => {
                                                        const materiaPrima = materiasPrimas.find(
                                                            (materia) => materia.id === ingrediente.materiaPrimaId
                                                        );

                                                        return (
                                                            <div key={ingrediente.materiaPrimaId}>
                                                                <span>{materiaPrima?.nombre ?? "Materia prima desconocida"}</span>
                                                                <span>{ingrediente.cantidad} {materiaPrima?.unidad ?? ""}</span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <p>No hay detalle de consumo guardado para esta producción.</p>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                    );
                                }
                            )
                    )}

                </div>

                {!cargandoHistorial && !errorHistorial && totalProducciones > 0 && (
                    <nav className="informe-paginacion produccion-paginacion" aria-label="Paginación del historial de producción">
                        <span className="informe-paginacion-total">
                            {totalProducciones} registro(s) · Página {paginaHistorial} de {totalPaginasHistorial}
                        </span>
                        <div className="informe-paginacion-controles">
                            <button type="button" className="secondary-button" disabled={paginaHistorial <= 1}
                                onClick={() => { setProduccionDetalleId(null); setPaginaHistorial((pagina) => Math.max(1, pagina - 1)); }}
                                aria-label="Ver página anterior de producción">Anterior</button>
                            <button type="button" className="secondary-button" disabled={paginaHistorial >= totalPaginasHistorial}
                                onClick={() => { setProduccionDetalleId(null); setPaginaHistorial((pagina) => Math.min(totalPaginasHistorial, pagina + 1)); }}
                                aria-label="Ver página siguiente de producción">Siguiente</button>
                        </div>
                    </nav>
                )}

            </div>

        </div>
    );
}

export default Produccion;
