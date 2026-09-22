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

    const [nombre, setNombre] = useState("");
    const [precio, setPrecio] = useState("");
    const [sector, setSector] = useState("Cocina");

    const limpiarFormulario = () => {
        setNombre("");
        setPrecio("");
        setSector("Cocina");
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
            sector
        );

        limpiarFormulario();
        setMostrarFormulario(false);
    };

    const comenzarEdicion = (id: number) => {
        const producto = productos.find(
            (producto) => producto.id === id
        );

        if (!producto) {
            return;
        }

        setProductoEditando(id);

        setNombre(producto.nombre);
        setPrecio(String(producto.precio));
        setSector(producto.sector);
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
            sector
        );

        setProductoEditando(null);
        limpiarFormulario();
    };

    return (
        <div className="dashboard-content">

            <div className="productos-header">

                <div>
                    <h1>Productos</h1>

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

                        setProductoEditando(null);
                        limpiarFormulario();
                    }}
                >
                    + Nuevo producto
                </button>

            </div>

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
                            setNombre(e.target.value)
                        }
                    />

                    <input
                        type="number"
                        placeholder="Precio"
                        value={precio}
                        onChange={(e) =>
                            setPrecio(e.target.value)
                        }
                    />

                    <select
                        value={sector}
                        onChange={(e) =>
                            setSector(e.target.value)
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

                    <div className="producto-form-actions">

                        <button
                            className="primary-button"
                            onClick={crearProducto}
                        >
                            Crear producto
                        </button>

                        <button
                            className="secondary-button"
                            onClick={() => {
                                limpiarFormulario();
                                setMostrarFormulario(false);
                            }}
                        >
                            Cancelar
                        </button>

                    </div>

                </div>
            )}

            <div className="productos-table">

                <div className="producto-row producto-row-header">

                    <span>
                        Producto
                    </span>

                    <span>
                        Precio
                    </span>

                    <span>
                        Sector
                    </span>

                    <span>
                        Estado
                    </span>

                    <span>
                        Acción
                    </span>

                </div>

                {productos.map((producto) => {

                    const estaEditando =
                        productoEditando === producto.id;

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

                                <input
                                    type="number"
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
                                $
                                {producto.precio.toLocaleString()}
                            </span>

                            <span>
                                {producto.sector}
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
                })}

            </div>

        </div>
    );
}

export default Productos;