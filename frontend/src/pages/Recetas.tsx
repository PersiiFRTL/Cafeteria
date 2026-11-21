import { useState } from "react";
import { Pencil, Power, Trash2, X } from "lucide-react";
import { useCatalogo } from "../context/useCatalogo";
import { numeroValido } from "../validaciones";
import { useToast } from "../context/useToast";

function Recetas() {
    const { mostrarToast } = useToast();

    const {
        productos,
        materiasPrimas,
        recetas,
        agregarReceta,
        editarReceta,
        cambiarEstadoReceta
    } = useCatalogo();

    const [productoSeleccionado, setProductoSeleccionado] =
        useState<number | null>(null);

    const [materiaPrimaSeleccionada, setMateriaPrimaSeleccionada] =
        useState<number | null>(null);

    const [cantidad, setCantidad] =
        useState("");
    const [errorCantidad, setErrorCantidad] =
        useState("");
    const [ingredienteEnEdicion, setIngredienteEnEdicion] = useState<number | null>(null);
    const [filtroRecetas, setFiltroRecetas] = useState("");
    const [guardandoReceta, setGuardandoReceta] = useState(false);

    const ejecutarGuardadoReceta = async (accion: () => Promise<boolean>) => {
        if (guardandoReceta) return false;
        setGuardandoReceta(true);
        try {
            return await accion();
        } finally {
            setGuardandoReceta(false);
        }
    };

    const prepararEdicionReceta = (productoId: number) => {
        setProductoSeleccionado(productoId);
        setFiltroRecetas(productos.find((producto) => producto.id === productoId)?.nombre ?? "");
        setIngredienteEnEdicion(null);
        setMateriaPrimaSeleccionada(null);
        setCantidad("");
        setErrorCantidad("");
        requestAnimationFrame(() => document.getElementById("editor-receta")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };

    const cerrarEditorReceta = () => {
        setProductoSeleccionado(null);
        setIngredienteEnEdicion(null);
        setMateriaPrimaSeleccionada(null);
        setCantidad("");
        setErrorCantidad("");
    };

    const prepararEdicionIngrediente = (productoId: number, materiaPrimaId: number, cantidadActual: number) => {
        setProductoSeleccionado(productoId);
        setFiltroRecetas(productos.find((producto) => producto.id === productoId)?.nombre ?? "");
        setIngredienteEnEdicion(materiaPrimaId);
        setMateriaPrimaSeleccionada(materiaPrimaId);
        setCantidad(String(cantidadActual));
        setErrorCantidad("");
        requestAnimationFrame(() => document.getElementById("editor-receta")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };

    const alternarEstadoReceta = async (recetaId: number, activo: boolean) => {
        const guardada = await cambiarEstadoReceta(recetaId, activo);
        if (!guardada) {
            mostrarToast("No se pudo actualizar el estado de la receta.");
            return;
        }
        mostrarToast(activo ? "Receta habilitada." : "Receta deshabilitada.");
    };

    const agregarIngrediente = async () => {

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

                const guardada = await ejecutarGuardadoReceta(() => editarReceta(
                    recetaExistente.id,
                    ingredientesActualizados
                ));
                if (!guardada) {
                    mostrarToast("No se pudo guardar la receta en Supabase.");
                    return;
                }

            } else {

                const guardada = await ejecutarGuardadoReceta(() => editarReceta(
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
                ));
                if (!guardada) {
                    mostrarToast("No se pudo guardar la receta en Supabase.");
                    return;
                }
            }

        } else {

            const guardada = await ejecutarGuardadoReceta(() => agregarReceta(
                productoSeleccionado,
                [
                    {
                        materiaPrimaId:
                            materiaPrimaSeleccionada,
                        cantidad:
                            cantidadNumero
                    }
                ]
            ));
            if (!guardada) {
                mostrarToast("No se pudo guardar la receta en Supabase.");
                return;
            }
        }

        mostrarToast("Ingrediente de receta guardado.");
        setMateriaPrimaSeleccionada(null);
        setCantidad("");
        setIngredienteEnEdicion(null);
        setErrorCantidad("");
    };

    const eliminarIngrediente = async (
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

        const guardada = await editarReceta(
            receta.id,
            ingredientesActualizados
        );
        if (!guardada) {
            mostrarToast("No se pudo actualizar la receta en Supabase.");
            return;
        }
        if (ingredienteEnEdicion === materiaPrimaId) {
            setIngredienteEnEdicion(null);
            setMateriaPrimaSeleccionada(null);
            setCantidad("");
        }
        mostrarToast("Ingrediente eliminado de la receta.");
    };

    const recetaActual =
        recetas.find(
            (receta) =>
                receta.productoId ===
                productoSeleccionado
        );

    const productoActual = productos.find((producto) => producto.id === productoSeleccionado);

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

            <section className="recetas-listado" aria-label="Listado de recetas">
                <div className="recetas-listado-header">
                    <h2>Recetas cargadas</h2>
                    <input
                        type="search"
                        className="recetas-listado-search"
                        placeholder="Buscar o seleccionar un producto..."
                        aria-label="Buscar recetas o seleccionar un producto para editar"
                        list="productos-recetas-opciones"
                        value={filtroRecetas}
                        onChange={(event) => {
                            const busqueda = event.target.value;
                            const productoElegido = productos.find((producto) =>
                                producto.nombre.trim().toLocaleLowerCase("es-AR") === busqueda.trim().toLocaleLowerCase("es-AR")
                            );
                            setFiltroRecetas(busqueda);
                            setProductoSeleccionado(productoElegido?.id ?? null);
                            setMateriaPrimaSeleccionada(null);
                            setCantidad("");
                            setIngredienteEnEdicion(null);
                        }}
                    />
                    <datalist id="productos-recetas-opciones">
                        {productos.map((producto) => <option key={producto.id} value={producto.nombre} />)}
                    </datalist>
                    <span>{recetas.filter((receta) => {
                        const nombreProducto = productos.find((item) => item.id === receta.productoId)?.nombre ?? "";
                        return nombreProducto.toLocaleLowerCase().includes(filtroRecetas.trim().toLocaleLowerCase());
                    }).length} receta(s)</span>
                </div>
                {recetas.length === 0 ? (
                    <p className="recetas-listado-vacio">Todavía no hay recetas cargadas.</p>
                ) : (
                    <div className="recetas-cards">
                        {recetas.filter((receta) => {
                            const nombreProducto = productos.find((item) => item.id === receta.productoId)?.nombre ?? "";
                            return nombreProducto.toLocaleLowerCase().includes(filtroRecetas.trim().toLocaleLowerCase());
                        }).map((receta) => {
                            const producto = productos.find((item) => item.id === receta.productoId);
                            return (
                                <article className={`receta-card${receta.activo ? "" : " receta-card-deshabilitada"}`} key={receta.id}>
                                    <div className="receta-card-heading">
                                        <h3>{producto?.nombre ?? "Producto desconocido"}</h3>
                                        <span className={`receta-estado ${receta.activo ? "activo" : "inactivo"}`}>{receta.activo ? "Activa" : "Deshabilitada"}</span>
                                    </div>
                                    <p>{receta.ingredientes.length} ingrediente(s)</p>
                                    <div className="receta-card-ingredientes">
                                        {receta.ingredientes.map((ingrediente) => {
                                            const materia = materiasPrimas.find((item) => item.id === ingrediente.materiaPrimaId);
                                            return (
                                                <div className="receta-card-ingrediente" key={ingrediente.materiaPrimaId}>
                                                    <span>{materia?.nombre ?? "Materia desconocida"}: {ingrediente.cantidad} {materia?.unidad ?? ""}</span>
                                                    <button type="button" className="receta-accion receta-accion-editar" aria-label={`Editar ${materia?.nombre ?? "ingrediente"} en la receta de ${producto?.nombre ?? "producto"}`} onClick={() => prepararEdicionIngrediente(receta.productoId, ingrediente.materiaPrimaId, ingrediente.cantidad)}>
                                                        <Pencil className="ui-icon" aria-hidden="true" /> Editar
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="receta-card-actions">
                                        <button type="button" disabled={guardandoReceta} className="secondary-button receta-accion receta-accion-editar" onClick={() => prepararEdicionReceta(receta.productoId)}>
                                            <Pencil className="ui-icon" aria-hidden="true" /> Editar receta
                                        </button>
                                        <button type="button" className={`receta-accion ${receta.activo ? "receta-accion-deshabilitar" : "receta-accion-habilitar"}`} onClick={() => void alternarEstadoReceta(receta.id, !receta.activo)}>
                                            <Power className="ui-icon" aria-hidden="true" /> {receta.activo ? "Deshabilitar" : "Habilitar"}
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>


            {productoSeleccionado !== null && (

                <>

                    {/* ==========================
                        AGREGAR INGREDIENTE
                    ========================== */}

                    <div className="receta-form" id="editor-receta" data-shortcut-form>

                        <div className="receta-editor-heading">
                            <div>
                                <span className="receta-editor-eyebrow">Editor de receta</span>
                                <h2>{ingredienteEnEdicion === null
                                    ? `Receta de ${productoActual?.nombre ?? "producto"}`
                                    : `Editando ingrediente de ${productoActual?.nombre ?? "la receta"}`}</h2>
                            </div>
                            <div className="receta-editor-actions">
                                {recetaActual && (
                                    <span className={`receta-estado ${recetaActual.activo ? "activo" : "inactivo"}`}>
                                        {recetaActual.activo ? "Activa" : "Deshabilitada"}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className="receta-editor-cerrar"
                                    aria-label="Cancelar y cerrar editor de receta"
                                    title="Cancelar y cerrar"
                                    data-shortcut-close
                                    disabled={guardandoReceta}
                                    onClick={cerrarEditorReceta}
                                >
                                    <X className="ui-icon" aria-hidden="true" />
                                </button>
                            </div>
                        </div>

                        <h3 className="receta-form-subtitulo">
                            {ingredienteEnEdicion === null ? "Agregar ingrediente" : "Editar ingrediente"}
                        </h3>

                        <div className="receta-form-fields">

                            <select
                                disabled={ingredienteEnEdicion !== null}
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
                                            materia.activo || materia.id === materiaPrimaSeleccionada
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
                                                {materia.nombre} ({materia.unidad}){materia.activo ? "" : " (inactiva)"}
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
                                disabled={guardandoReceta}
                                data-shortcut-enter
                                type="button"
                                onClick={
                                    agregarIngrediente
                                }
                            >
                                {guardandoReceta && <span className="spinner-inline" aria-hidden="true" />}
                                {guardandoReceta ? "Guardando…" : ingredienteEnEdicion === null ? "+ Agregar" : "Guardar cambios"}
                            </button>

                            {ingredienteEnEdicion !== null && (
                                <button type="button" className="secondary-button" onClick={() => {
                                    setIngredienteEnEdicion(null);
                                    setMateriaPrimaSeleccionada(null);
                                    setCantidad("");
                                }}>
                                    Cancelar edición
                                </button>
                            )}

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
                                                    className="secondary-button receta-accion receta-accion-editar"
                                                    type="button"
                                                    onClick={() => prepararEdicionIngrediente(productoSeleccionado!, materia.id, ingrediente.cantidad)}
                                                >
                                                    <Pencil className="ui-icon" aria-hidden="true" />
                                                    Editar
                                                </button>

                                                <button
                                                    className="secondary-button receta-accion receta-accion-eliminar"
                                                    type="button"
                                                    aria-label={`Eliminar ${materia.nombre} de la receta`}
                                                    onClick={() =>
                                                        eliminarIngrediente(
                                                            materia.id
                                                        )
                                                    }
                                                >
                                                    <Trash2 className="ui-icon" aria-hidden="true" />
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

        </div>
    );
}

export default Recetas;
