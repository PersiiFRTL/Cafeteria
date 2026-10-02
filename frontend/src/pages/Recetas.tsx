import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";
import { numeroValido } from "../validaciones";
import { useToast } from "../context/useToast";

function Recetas() {
    const { mostrarToast } = useToast();

    const {
        productos,
        materiasPrimas,
        recetas,
        agregarReceta,
        editarReceta
    } = useCafeteria();

    const [productoSeleccionado, setProductoSeleccionado] =
        useState<number | null>(null);

    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] =
        useState<number | null>(null);

    const [cantidad, setCantidad] =
        useState("");
    const [errorCantidad, setErrorCantidad] =
        useState("");

    const agregarIngrediente = () => {

        if (productoSeleccionado === null || materiaPrimaSeleccionada === null) {
            setErrorCantidad("Seleccioná un producto y una materia prima.");
            return;
        }

        if (!numeroValido(cantidad, Number.MIN_VALUE)) {
            setErrorCantidad("La cantidad debe ser mayor que 0.");
            return;
        }

        const cantidadNumero = Number(cantidad);

        const recetaExistente =
            recetas.find(
                (receta) =>
                    receta.productoId ===
                    productoSeleccionado
            );

        if (recetaExistente) {

            const ingredienteExistente =
                recetaExistente.ingredientes.find(
                    (ingrediente) =>
                        ingrediente.materiaPrimaId ===
                        materiaPrimaSeleccionada
                );

            if (ingredienteExistente) {

                const ingredientesActualizados =
                    recetaExistente.ingredientes.map(
                        (ingrediente) =>
                            ingrediente.materiaPrimaId ===
                            materiaPrimaSeleccionada
                                ? {
                                    ...ingrediente,
                                    cantidad:
                                        cantidadNumero
                                }
                                : ingrediente
                    );

                editarReceta(
                    recetaExistente.id,
                    ingredientesActualizados
                );

            } else {

                editarReceta(
                    recetaExistente.id,
                    [
                        ...recetaExistente.ingredientes,
                        {
                            materiaPrimaId:
                                materiaPrimaSeleccionada,
                            cantidad:
                                cantidadNumero
                        }
                    ]
                );
            }

        } else {

            agregarReceta(
                productoSeleccionado,
                [
                    {
                        materiaPrimaId:
                            materiaPrimaSeleccionada,
                        cantidad:
                            cantidadNumero
                    }
                ]
            );
        }

        mostrarToast("Ingrediente de receta guardado.");
        setMateriaPrimaSeleccionada(null);
        setCantidad("");
        setErrorCantidad("");
    };

    const eliminarIngrediente = (
        materiaPrimaId: number
    ) => {

        if (
            productoSeleccionado === null
        ) {
            return;
        }

        const receta =
            recetas.find(
                (receta) =>
                    receta.productoId ===
                    productoSeleccionado
            );

        if (!receta) {
            return;
        }

        const ingredientesActualizados =
            receta.ingredientes.filter(
                (ingrediente) =>
                    ingrediente.materiaPrimaId !==
                    materiaPrimaId
            );

        editarReceta(
            receta.id,
            ingredientesActualizados
        );
        mostrarToast("Ingrediente eliminado de la receta.");
    };

    const recetaActual =
        recetas.find(
            (receta) =>
                receta.productoId ===
                productoSeleccionado
        );

    const materiaPrimaActual = materiasPrimas.find(
        (materia) => materia.id === materiaPrimaSeleccionada
    );

    return (
        <div className="dashboard-content">

            <div className="recetas-header">

                <div>

                    <h1>
                        Recetas
                    </h1>

                    <p>
                        Configuración de ingredientes
                        utilizados en cada producto.
                    </p>

                </div>

            </div>


            {/* ==========================
                SELECCIONAR PRODUCTO
            ========================== */}

            <div className="receta-selector">

                <label>
                    Producto
                </label>

                <select
                    value={
                        productoSeleccionado ?? ""
                    }
                    onChange={(e) => {

                        const valor =
                            Number(
                                e.target.value
                            );

                        setProductoSeleccionado(
                            valor || null
                        );

                        setMateriaPrimaSeleccionada(
                            null
                        );

                        setCantidad("");
                    }}
                >

                    <option value="">
                        Seleccionar producto
                    </option>

                    {productos
                        .filter(
                            (producto) =>
                                producto.activo
                        )
                        .map(
                            (producto) => (
                                <option
                                    key={producto.id}
                                    value={producto.id}
                                >
                                    {producto.nombre}
                                </option>
                            )
                        )}

                </select>

            </div>


            {productoSeleccionado !== null && (

                <>

                    {/* ==========================
                        AGREGAR INGREDIENTE
                    ========================== */}

                    <div className="receta-form">

                        <h2>
                            Agregar ingrediente
                        </h2>

                        <div className="receta-form-fields">

                            <select
                                value={
                                    materiaPrimaSeleccionada ??
                                    ""
                                }
                                onChange={(e) =>
                                    setMateriaPrimaSeleccionada(
                                        Number(
                                            e.target.value
                                        ) || null
                                    )
                                }
                            >

                                <option value="">
                                    Seleccionar materia prima
                                </option>

                                {materiasPrimas
                                    .filter(
                                        (materia) =>
                                            materia.activo
                                    )
                                    .map(
                                        (materia) => (
                                            <option
                                                key={
                                                    materia.id
                                                }
                                                value={
                                                    materia.id
                                                }
                                            >
                                                {materia.nombre} ({materia.unidad})
                                            </option>
                                        )
                                    )}

                            </select>


                            <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                required
                                placeholder="Cantidad por producto"
                                value={cantidad}
                                onChange={(e) => {
                                    setCantidad(e.target.value);
                                    setErrorCantidad("");
                                }}
                            />

                            <span className="receta-unidad-hint">
                                {materiaPrimaActual
                                    ? `Unidad: ${materiaPrimaActual.unidad}`
                                    : "Elegí una materia prima para ver la unidad"}
                            </span>


                            <button
                                className="primary-button"
                                onClick={
                                    agregarIngrediente
                                }
                            >
                                + Agregar
                            </button>

                        </div>

                        {errorCantidad && (
                            <p className="form-field-error" role="alert">
                                {errorCantidad}
                            </p>
                        )}

                    </div>


                    {/* ==========================
                        INGREDIENTES
                    ========================== */}

                    <div className="receta-table">

                        <div className="receta-row receta-row-header">

                            <span>
                                Materia prima
                            </span>

                            <span>
                                Cantidad
                            </span>

                            <span>
                                Unidad
                            </span>

                            <span>
                                Acción
                            </span>

                        </div>


                        {recetaActual &&
                        recetaActual.ingredientes.length >
                            0 ? (

                            recetaActual.ingredientes.map(
                                (ingrediente) => {

                                    const materia =
                                        materiasPrimas.find(
                                            (materia) =>
                                                materia.id ===
                                                ingrediente.materiaPrimaId
                                        );

                                    if (!materia) {
                                        return null;
                                    }

                                    return (
                                        <div
                                            className="receta-row"
                                            key={
                                                ingrediente.materiaPrimaId
                                            }
                                        >

                                            <span>
                                                {
                                                    materia.nombre
                                                }
                                            </span>

                                            <span>
                                                {
                                                    ingrediente.cantidad
                                                }
                                            </span>

                                            <span>
                                                {
                                                    materia.unidad
                                                }
                                            </span>

                                            <span>

                                                <button
                                                    className="secondary-button"
                                                    onClick={() =>
                                                        eliminarIngrediente(
                                                            materia.id
                                                        )
                                                    }
                                                >
                                                    Eliminar
                                                </button>

                                            </span>

                                        </div>
                                    );
                                }
                            )

                        ) : (

                            <div className="receta-vacia">

                                Este producto todavía
                                no tiene ingredientes
                                configurados.

                            </div>

                        )}

                    </div>

                </>
            )}

            {/* ==========================
                RECETAS EXISTENTES
            ========================== */}

            <div className="recetas-listado">

                <div className="recetas-listado-header">
                    <h2>Recetas cargadas</h2>

                    <span>
                        {recetas.length} receta(s)
                    </span>
                </div>

                {recetas.length === 0 ? (

                    <p className="recetas-listado-vacio">
                        Todavía no hay recetas cargadas.
                    </p>

                ) : (

                    <div className="recetas-cards">
                        {recetas.map((receta) => {
                            const producto = productos.find(
                                (item) =>
                                    item.id === receta.productoId
                            );

                            return (
                                <div
                                    className="receta-card"
                                    key={receta.id}
                                >
                                    <h3>
                                        {producto?.nombre ??
                                            "Producto desconocido"}
                                    </h3>

                                    <div className="receta-card-ingredientes">
                                        {receta.ingredientes.map(
                                            (ingrediente) => {
                                                const materia =
                                                    materiasPrimas.find(
                                                        (item) =>
                                                            item.id ===
                                                            ingrediente.materiaPrimaId
                                                    );

                                                return (
                                                    <span
                                                        key={
                                                            ingrediente.materiaPrimaId
                                                        }
                                                    >
                                                        {materia?.nombre ??
                                                            "Materia desconocida"}
                                                        : {ingrediente.cantidad}{" "}
                                                        {materia?.unidad ?? ""}
                                                    </span>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

            </div>

        </div>
    );
}

export default Recetas;