import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";
import { numeroValido } from "../validaciones";
import { useToast } from "../context/useToast";

function Produccion() {
    const { mostrarToast } = useToast();

    const {
        productos,
        recetas,
        materiasPrimas,
        producciones,
        registrarProduccion
    } = useCafeteria();

    const [productoId, setProductoId] =
        useState<number | null>(null);

    const [cantidad, setCantidad] =
        useState("");

    const [mensaje, setMensaje] =
        useState("");

    const [produccionDetalleId, setProduccionDetalleId] =
        useState<number | null>(null);

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
                receta.productoId === productoId
        );

    // ==========================
    // PRODUCIR
    // ==========================

    const producir = () => {

        setMensaje("");

        if (!productoId) {
            setMensaje(
                "Seleccioná un producto."
            );
            return;
        }

        const cantidadProduccion =
            Number(cantidad);

        if (!numeroValido(cantidad, 1, Number.POSITIVE_INFINITY, true)) {
            setMensaje(
                "Ingresá una cantidad entera mayor que 0."
            );
            return;
        }

        if (!receta) {
            setMensaje(
                "El producto no tiene una receta cargada."
            );
            return;
        }

        const resultado =
            registrarProduccion(
                productoId,
                cantidadProduccion
            );

        if (!resultado) {
            setMensaje(
                "No hay suficiente materia prima para realizar la producción."
            );
            return;
        }

        setMensaje(
            `Producción realizada correctamente: ${cantidadProduccion} ${productoSeleccionado?.nombre}.`
        );
        mostrarToast("Producción registrada correctamente.");

        setCantidad("");
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

            <div className="produccion-form">

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
                        onClick={producir}
                    >
                        Producir
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

                    <div className="produccion-mensaje">
                        {mensaje}
                    </div>

                )}

            </div>


            {/* ========================== */}
            {/* HISTORIAL */}
            {/* ========================== */}

            <div className="produccion-historial">

                <div className="section-header">

                    <div>
                        <h2>
                            Historial de producción
                        </h2>
                    </div>

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


                    {producciones.length === 0 ? (

                        <div className="produccion-vacia">
                            No hay producciones registradas.
                        </div>

                    ) : (

                        [...producciones]
                            .reverse()
                            .map(
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

            </div>

        </div>
    );
}

export default Produccion;