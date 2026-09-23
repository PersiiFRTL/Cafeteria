import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";

function Productos() {

    const {
        productos,
        agregarProducto,
        editarProducto,
        cambiarEstadoProductoCatalogo
    } = useCafeteria();

    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [productoEditando, setProductoEditando] =
        useState<number | null>(null);

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


    const limpiarFormulario = () => {

        setNombre("");

        setCategoria("Comida");

        setPrecio("");

        setSector("Cocina");

        setTipoElaboracion("bajo_pedido");
    };


    const crearProducto = () => {

        if (
            nombre.trim() === "" ||
            precio === ""
        ) {
            return;
        }

        agregarProducto(
            nombre,
            Number(precio),
            categoria,
            sector,
            tipoElaboracion
        );

        limpiarFormulario();

        setMostrarFormulario(false);
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

        setNombre(producto.nombre);

        setCategoria(producto.categoria);

        setPrecio(
            String(producto.precio)
        );

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

        if (
            productoEditando === null ||
            nombre.trim() === "" ||
            precio === ""
        ) {
            return;
        }

        editarProducto(
            productoEditando,
            nombre,
            Number(precio),
            categoria,
            sector,
            tipoElaboracion
        );

        setProductoEditando(null);

        limpiarFormulario();
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
                        type="number"
                        placeholder="Precio"
                        min="0"
                        value={precio}
                        onChange={(e) =>
                            setPrecio(
                                e.target.value
                            )
                        }
                    />


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


                {productos.map(
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
                                        type="number"
                                        value={precio}
                                        min="0"
                                        onChange={(e) =>
                                            setPrecio(
                                                e.target.value
                                            )
                                        }
                                    />


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
                                        value={
                                            tipoElaboracion
                                        }
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


                                    <button
                                        className={
                                            producto.activo
                                                ? "estado-activo"
                                                : "estado-inactivo"
                                        }
                                        onClick={() =>
                                            cambiarEstadoProductoCatalogo(
                                                producto.id,
                                                !producto.activo
                                            )
                                        }
                                    >
                                        {producto.activo
                                            ? "Activo"
                                            : "Inactivo"}
                                    </button>


                                    <div className="producto-edicion-actions">

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

                                <span>
                                    {producto.nombre}
                                </span>

                                <span>
                                    {producto.categoria}
                                </span>

                                <span>
                                    $
                                    {producto.precio.toLocaleString()}
                                </span>

                                <span>
                                    {producto.sector}
                                </span>

                                <span>

                                    {producto.tipoElaboracion ===
                                    "preelaborado"
                                        ? "Preelaborado"
                                        : "Bajo pedido"}

                                </span>

                                <span>

                                    <button
                                        className={
                                            producto.activo
                                                ? "estado-activo"
                                                : "estado-inactivo"
                                        }
                                        onClick={() =>
                                            cambiarEstadoProductoCatalogo(
                                                producto.id,
                                                !producto.activo
                                            )
                                        }
                                    >
                                        {producto.activo
                                            ? "Activo"
                                            : "Inactivo"}
                                    </button>

                                </span>

                                <span>

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

                                </span>

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}

export default Productos;