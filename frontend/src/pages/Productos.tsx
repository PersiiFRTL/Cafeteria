import { useEffect, useState } from "react";
import { useCatalogo } from "../context/useCatalogo";
import { coincideBusqueda, formatearPrecio, normalizarTexto, parsearPrecio } from "../validaciones";
import ModalConfirmacion from "../components/ModalConfirmacion";
import { useToast } from "../context/useToast";

interface DialogoProducto {
    titulo: string;
    mensaje: string;
    textoConfirmar: string;
    confirmar: () => void;
    cancelar?: () => void;
    destructivo?: boolean;
}

function Productos() {
    const { mostrarToast } = useToast();

    const {
        productos,
        agregarProducto,
        editarProducto,
        cambiarEstadoProductoCatalogo,
        eliminarProductoCatalogo
    } = useCatalogo();

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [productoEditando, setProductoEditando] =
        useState<number | null>(null);

    const [busqueda, setBusqueda] = useState("");
    const [busquedaDebounce, setBusquedaDebounce] = useState("");

    useEffect(() => {
        const temporizador = window.setTimeout(() => {
            setBusquedaDebounce(normalizarTexto(busqueda));
        }, 500);

        return () => window.clearTimeout(temporizador);
    }, [busqueda]);

    const productosFiltrados = productos.filter((producto) => {
        const textoBusqueda = busquedaDebounce;

        return (
            coincideBusqueda(producto.nombre, textoBusqueda) ||
            coincideBusqueda(producto.categoria, textoBusqueda) ||
            coincideBusqueda(producto.sector, textoBusqueda)
        );
    });

    const [nombre, setNombre] =
        useState("");

    const [categoria, setCategoria] =
        useState("Comida");

    const [precio, setPrecio] =
        useState("");

    const [sector, setSector] =
        useState("Cocina");

    const [tipoElaboracion, setTipoElaboracion] =
        useState<
            "bajo_pedido" | "preelaborado"
        >("bajo_pedido");
    const [errorPrecio, setErrorPrecio] = useState("");
    const [dialogo, setDialogo] = useState<DialogoProducto | null>(null);


    const limpiarFormulario = () => {

        setNombre("");

        setCategoria("Comida");

        setPrecio("");

        setSector("Cocina");

        setTipoElaboracion("bajo_pedido");
    };


    const crearProducto = () => {

        if (nombre.trim() === "") {
            setErrorPrecio("Ingresá el nombre del producto.");
            return;
        }

        const precioNumero = parsearPrecio(precio);
        if (precioNumero === null || precioNumero < 0) {
            setErrorPrecio("El precio debe ser un número igual o mayor que 0.");
            return;
        }

        agregarProducto(
            nombre,
            precioNumero,
            categoria,
            sector,
            tipoElaboracion
        );

        mostrarToast("Producto creado correctamente.");

        limpiarFormulario();

        setMostrarFormulario(false);
        setErrorPrecio("");
    };


    const comenzarEdicion = (
        id: number
    ) => {

        const producto =
            productos.find(
                (producto) =>
                    producto.id === id
            );

        if (!producto) {
            return;
        }

        setProductoEditando(id);
        setErrorPrecio("");

        setNombre(producto.nombre);

        setCategoria(producto.categoria);

        setPrecio(formatearPrecio(producto.precio));

        setSector(producto.sector);

        setTipoElaboracion(
            producto.tipoElaboracion
        );
    };


    const cancelarEdicion = () => {

        setProductoEditando(null);

        limpiarFormulario();
    };


    const guardarEdicion = () => {

        if (productoEditando === null) {
            return;
        }

        if (nombre.trim() === "") {
            setErrorPrecio("Ingresá el nombre del producto.");
            return;
        }

        const precioNumero = parsearPrecio(precio);
        if (precioNumero === null || precioNumero < 0) {
            setErrorPrecio("El precio debe ser un número igual o mayor que 0.");
            return;
        }

        editarProducto(
            productoEditando,
            nombre,
            precioNumero,
            categoria,
            sector,
            tipoElaboracion
        );

        mostrarToast("Producto actualizado correctamente.");

        setProductoEditando(null);

        limpiarFormulario();
        setErrorPrecio("");
    };

    const eliminarProducto = (id: number, nombreProducto: string) => {
        setDialogo({
            titulo: "Eliminar producto",
            mensaje: `¿Eliminar el producto "${nombreProducto}"? Esta acción no se puede deshacer.`,
            textoConfirmar: "Eliminar",
            destructivo: true,
            cancelar: () => setDialogo(null),
            confirmar: () => {
                if (!eliminarProductoCatalogo(id)) {
                    setDialogo({
                        titulo: "No se puede eliminar el producto",
                        mensaje: "Tiene pedidos u operaciones en el historial. Podés desactivarlo en su lugar.",
                        textoConfirmar: "Cerrar",
                        confirmar: () => setDialogo(null)
                    });
                    return;
                }

                if (productoEditando === id) cancelarEdicion();
                mostrarToast("Producto eliminado correctamente.");
            }
        });
    };

    const alternarEstadoProducto = (id: number, activo: boolean) => {
        cambiarEstadoProductoCatalogo(id, activo);
        mostrarToast(activo ? "Producto activado." : "Producto desactivado.");
    };


    return (
        <div className="dashboard-content">

            {/* ==========================
                ENCABEZADO
            ========================== */}

            <div className="productos-header">

                <div>

                    <h1>
                        Productos
                    </h1>

                    <p>
                        Administración de productos
                        de la cafetería.
                    </p>

                </div>

                <button
                    className="primary-button producto-nuevo-button"
                    onClick={() => {

                        setMostrarFormulario(
                            !mostrarFormulario
                        );

                        setProductoEditando(
                            null
                        );

                        limpiarFormulario();
                    }}
                >
                    + Nuevo producto
                </button>

            </div>


            {/* ==========================
                FORMULARIO NUEVO PRODUCTO
            ========================== */}

            {mostrarFormulario && (

                <div className="producto-form">

                    <h2>
                        Nuevo producto
                    </h2>

                    <div className="producto-form-fields">

                    <input
                        type="text"
                        placeholder="Nombre"
                        value={nombre}
                        onChange={(e) =>
                            setNombre(
                                e.target.value
                            )
                        }
                    />


                    <select
                        value={categoria}
                        onChange={(e) =>
                            setCategoria(
                                e.target.value
                            )
                        }
                    >

                        <option value="Comida">
                            Comida
                        </option>

                        <option value="Bebida">
                            Bebida
                        </option>

                        <option value="Panificados">
                            Panificados
                        </option>

                        <option value="Pastelería">
                            Pastelería
                        </option>

                        <option value="Otro">
                            Otro
                        </option>

                    </select>


                    <input
                        type="text"
                        placeholder="Precio"
                        inputMode="decimal"
                        required
                        value={precio}
                        onChange={(e) => {
                            setPrecio(e.target.value.replace(/[^\d.,]/g, ""));
                            setErrorPrecio("");
                        }}
                        onBlur={() => {
                            const valor = parsearPrecio(precio);
                            if (valor !== null) setPrecio(formatearPrecio(valor));
                        }}
                    />

                    {errorPrecio && (
                        <p className="form-field-error" role="alert">
                            {errorPrecio}
                        </p>
                    )}


                    <select
                        value={sector}
                        onChange={(e) =>
                            setSector(
                                e.target.value
                            )
                        }
                    >

                        <option value="Cocina">
                            Cocina
                        </option>

                        <option value="Cafetería">
                            Cafetería
                        </option>

                        <option value="Pastelería">
                            Pastelería
                        </option>

                    </select>


                    <select
                        value={tipoElaboracion}
                        onChange={(e) =>
                            setTipoElaboracion(
                                e.target.value as
                                    | "bajo_pedido"
                                    | "preelaborado"
                            )
                        }
                    >

                        <option value="bajo_pedido">
                            Bajo pedido
                        </option>

                        <option value="preelaborado">
                            Preelaborado
                        </option>

                    </select>

                    </div>

                    <div className="producto-form-actions">

                        <button
                            className="primary-button"
                            onClick={
                                crearProducto
                            }
                        >
                            Crear producto
                        </button>

                        <button
                            className="secondary-button"
                            onClick={() => {

                                limpiarFormulario();

                                setMostrarFormulario(
                                    false
                                );
                            }}
                        >
                            Cancelar
                        </button>

                    </div>

                </div>

            )}


            {/* ==========================
                BUSCADOR DE PRODUCTOS
            ========================== */}

            <div className="stock-buscador-wrap">
                <input
                    type="search"
                    className="stock-buscador"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                />
            </div>

            {/* ==========================
                TABLA DE PRODUCTOS
            ========================== */}

            <div className="productos-table">

                <div className="producto-row producto-row-header">

                    <span>
                        Producto
                    </span>

                    <span>
                        Categoría
                    </span>

                    <span>
                        Precio
                    </span>

                    <span>
                        Sector
                    </span>

                    <span>
                        Elaboración
                    </span>

                    <span>
                        Estado
                    </span>

                    <span>
                        Acción
                    </span>

                </div>


                {productosFiltrados.map(
                    (producto) => {

                        const estaEditando =
                            productoEditando ===
                            producto.id;


                        if (estaEditando) {

                            return (

                                <div
                                    className="producto-row producto-row-editando"
                                    key={producto.id}
                                >

                                    <input
                                        type="text"
                                        placeholder="Producto"
                                        aria-label="Producto"
                                        value={nombre}
                                        onChange={(e) =>
                                            setNombre(
                                                e.target.value
                                            )
                                        }
                                    />


                                    <select
                                        value={categoria}
                                        aria-label="Categoría"
                                        onChange={(e) =>
                                            setCategoria(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="Comida">
                                            Comida
                                        </option>

                                        <option value="Bebida">
                                            Bebida
                                        </option>

                                        <option value="Panificados">
                                            Panificados
                                        </option>

                                        <option value="Pastelería">
                                            Pastelería
                                        </option>

                                        <option value="Otro">
                                            Otro
                                        </option>

                                    </select>


                                    <input
                                        type="text"
                                        aria-label="Precio"
                                        value={precio}
                                        inputMode="decimal"
                                        required
                                        onChange={(e) =>
                                            {
                                                setPrecio(e.target.value.replace(/[^\d.,]/g, ""));
                                                setErrorPrecio("");
                                            }
                                        }
                                        onBlur={() => {
                                            const valor = parsearPrecio(precio);
                                            if (valor !== null) setPrecio(formatearPrecio(valor));
                                        }}
                                    />


                                    <select
                                        value={sector}
                                        aria-label="Sector"
                                        onChange={(e) =>
                                            setSector(
                                                e.target.value
                                            )
                                        }
                                    >

                                        <option value="Cocina">
                                            Cocina
                                        </option>

                                        <option value="Cafetería">
                                            Cafetería
                                        </option>

                                        <option value="Pastelería">
                                            Pastelería
                                        </option>

                                    </select>


                                    <select
                                        value={
                                            tipoElaboracion
                                        }
                                        aria-label="Tipo de elaboración"
                                        onChange={(e) =>
                                            setTipoElaboracion(
                                                e.target.value as
                                                    | "bajo_pedido"
                                                    | "preelaborado"
                                            )
                                        }
                                    >

                                        <option value="bajo_pedido">
                                            Bajo pedido
                                        </option>

                                        <option value="preelaborado">
                                            Preelaborado
                                        </option>

                                    </select>


                                    <label className="producto-estado-switch" data-label="Estado">
                                        <input
                                            type="checkbox"
                                            role="switch"
                                            checked={producto.activo}
                                            aria-label={`Estado de ${producto.nombre}`}
                                            onChange={(event) =>
                                                alternarEstadoProducto(
                                                    producto.id,
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        <span aria-hidden="true" />
                                        <span>{producto.activo ? "Activo" : "Inactivo"}</span>
                                    </label>


                                    <div className="producto-edicion-actions">

                                        {errorPrecio && (
                                            <p className="form-field-error" role="alert">
                                                {errorPrecio}
                                            </p>
                                        )}

                                        <button
                                            className="primary-button"
                                            onClick={
                                                guardarEdicion
                                            }
                                        >
                                            Guardar
                                        </button>

                                        <button
                                            className="secondary-button"
                                            onClick={
                                                cancelarEdicion
                                            }
                                        >
                                            Cancelar
                                        </button>

                                    </div>

                                </div>
                            );
                        }


                        return (

                            <div
                                className="producto-row"
                                key={producto.id}
                            >

                                <span data-label="Producto">
                                    {producto.nombre}
                                </span>

                                <span data-label="Categoría">
                                    {producto.categoria}
                                </span>

                                <span data-label="Precio">
                                    $
                                    {formatearPrecio(producto.precio)}
                                </span>

                                <span data-label="Sector">
                                    {producto.sector}
                                </span>

                                <span data-label="Elaboración">

                                    {producto.tipoElaboracion ===
                                    "preelaborado"
                                        ? "Preelaborado"
                                        : "Bajo pedido"}

                                </span>

                                <span data-label="Estado">

                                    <label className="producto-estado-switch">
                                        <input
                                            type="checkbox"
                                            role="switch"
                                            checked={producto.activo}
                                            aria-label={`Estado de ${producto.nombre}`}
                                            onChange={(event) =>
                                                alternarEstadoProducto(
                                                    producto.id,
                                                    event.target.checked
                                                )
                                            }
                                        />
                                        <span aria-hidden="true" />
                                        <span>{producto.activo ? "Activo" : "Inactivo"}</span>
                                    </label>

                                </span>

                                <div className="producto-row-actions" data-label="Acciones">

                                    <button
                                        className="editar-producto-button"
                                        onClick={() =>
                                            comenzarEdicion(
                                                producto.id
                                            )
                                        }
                                    >
                                        ✏ Editar
                                    </button>

                                    <button
                                        className="eliminar-producto-button"
                                        onClick={() => eliminarProducto(producto.id, producto.nombre)}
                                    >
                                        Eliminar
                                    </button>

                                </div>

                            </div>
                        );
                    }
                )}

            </div>

            {dialogo && (
                <ModalConfirmacion
                    titulo={dialogo.titulo}
                    mensaje={dialogo.mensaje}
                    textoConfirmar={dialogo.textoConfirmar}
                    destructivo={dialogo.destructivo}
                    cerrar={() => setDialogo(null)}
                    confirmar={() => {
                        const accion = dialogo.confirmar;
                        setDialogo(null);
                        accion();
                    }}
                    cancelar={dialogo.cancelar}
                />
            )}
        </div>
    );
}

export default Productos;
