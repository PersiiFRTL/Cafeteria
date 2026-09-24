import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";

function Recetas() {

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

    const agregarIngrediente = () => {

        if (
            productoSeleccionado === null ||
            materiaPrimaSeleccionada === null ||
            cantidad === ""
        ) {
            return;
        }

        const cantidadNumero =
            Number(cantidad);

        if (cantidadNumero <= 0) {
            return;
        }

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

        setMateriaPrimaSeleccionada(null);
        setCantidad("");
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
    };

    const recetaActual =
        recetas.find(
            (receta) =>
                receta.productoId ===
                productoSeleccionado
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
                                                {
                                                    materia.nombre
                                                }
                                            </option>
                                        )
                                    )}

                            </select>


                            <input
                                type="number"
                                min="0"
                                step="0.001"
                                placeholder="Cantidad"
                                value={cantidad}
                                onChange={(e) =>
                                    setCantidad(
                                        e.target.value
                                    )
                                }
                            />


                            <button
                                className="primary-button"
                                onClick={
                                    agregarIngrediente
                                }
                            >
                                + Agregar
                            </button>

                        </div>

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