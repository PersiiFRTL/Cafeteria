import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";

type RolEmpleado =
    | "ADMINISTRADOR"
    | "EMPLEADO"
    | "COCINA";

function Empleados() {

    const {
        empleados,
        agregarEmpleado,
        editarEmpleado,
        cambiarEstadoEmpleado
    } = useCafeteria();


    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [empleadoEditando, setEmpleadoEditando] =
        useState<number | null>(null);


    const [nombre, setNombre] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [rol, setRol] =
        useState<RolEmpleado>("EMPLEADO");


    const limpiarFormulario = () => {

        setNombre("");

        setEmail("");

        setPassword("");

        setRol("EMPLEADO");
    };


    const crearEmpleado = () => {

        if (
            nombre.trim() === "" ||
            email.trim() === "" ||
            password.trim() === ""
        ) {
            return;
        }

        agregarEmpleado(
            nombre,
            email,
            password,
            rol
        );

        limpiarFormulario();

        setMostrarFormulario(false);
    };


    const comenzarEdicion = (
        id: number
    ) => {

        const empleado =
            empleados.find(
                (empleado) =>
                    empleado.id === id
            );

        if (!empleado) {
            return;
        }

        setEmpleadoEditando(id);

        setNombre(empleado.nombre);

        setEmail(empleado.email);

        setPassword(empleado.password);

        setRol(empleado.rol);
    };


    const cancelarEdicion = () => {

        setEmpleadoEditando(null);

        limpiarFormulario();
    };


    const guardarEdicion = () => {

        if (
            empleadoEditando === null ||
            nombre.trim() === "" ||
            email.trim() === "" ||
            password.trim() === ""
        ) {
            return;
        }

        editarEmpleado(
            empleadoEditando,
            nombre,
            email,
            password,
            rol
        );

        setEmpleadoEditando(null);

        limpiarFormulario();
    };


    const obtenerNombreRol = (
        rol: RolEmpleado
    ) => {

        switch (rol) {

            case "ADMINISTRADOR":
                return "Administrador";

            case "EMPLEADO":
                return "Empleado";

            case "COCINA":
                return "Cocina";

            default:
                return rol;
        }
    };


    return (
        <div className="dashboard-content">

            {/* ==========================
                ENCABEZADO
            ========================== */}

            <div className="productos-header">

                <div>

                    <h1>
                        Empleados
                    </h1>

                    <p>
                        Administración de empleados
                        de la cafetería.
                    </p>

                </div>


                <button
                    className="primary-button producto-nuevo-button"
                    onClick={() => {

                        setMostrarFormulario(
                            !mostrarFormulario
                        );

                        setEmpleadoEditando(
                            null
                        );

                        limpiarFormulario();
                    }}
                >
                    + Nuevo empleado
                </button>

            </div>


            {/* ==========================
                FORMULARIO NUEVO EMPLEADO
            ========================== */}

            {mostrarFormulario && (

                <div className="producto-form">

                    <h2>
                        Nuevo empleado
                    </h2>


                    <input
                        type="text"
                        placeholder="Nombre completo"
                        value={nombre}
                        onChange={(e) =>
                            setNombre(
                                e.target.value
                            )
                        }
                    />


                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(
                                e.target.value
                            )
                        }
                    />


                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                    />


                    <select
                        value={rol}
                        onChange={(e) =>
                            setRol(
                                e.target.value as RolEmpleado
                            )
                        }
                    >

                        <option value="ADMINISTRADOR">
                            Administrador
                        </option>

                        <option value="EMPLEADO">
                            Empleado
                        </option>

                        <option value="COCINA">
                            Cocina
                        </option>

                    </select>


                    <div className="producto-form-actions">

                        <button
                            className="primary-button"
                            onClick={
                                crearEmpleado
                            }
                        >
                            Crear empleado
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
                TABLA DE EMPLEADOS
            ========================== */}

            <div className="productos-table">

                <div className="producto-row producto-row-header">

                    <span>
                        Nombre
                    </span>

                    <span>
                        Email
                    </span>

                    <span>
                        Contraseña
                    </span>

                    <span>
                        Rol
                    </span>

                    <span>
                        Estado
                    </span>

                    <span>
                        Acción
                    </span>

                </div>


                {empleados.map(
                    (empleado) => {

                        const estaEditando =
                            empleadoEditando ===
                            empleado.id;


                        if (estaEditando) {

                            return (

                                <div
                                    className="producto-row producto-row-editando"
                                    key={empleado.id}
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
                                        type="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(
                                                e.target.value
                                            )
                                        }
                                    />


                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(
                                                e.target.value
                                            )
                                        }
                                    />


                                    <select
                                        value={rol}
                                        onChange={(e) =>
                                            setRol(
                                                e.target.value as RolEmpleado
                                            )
                                        }
                                    >

                                        <option value="ADMINISTRADOR">
                                            Administrador
                                        </option>

                                        <option value="EMPLEADO">
                                            Empleado
                                        </option>

                                        <option value="COCINA">
                                            Cocina
                                        </option>

                                    </select>


                                    <button
                                        className={
                                            empleado.activo
                                                ? "estado-activo"
                                                : "estado-inactivo"
                                        }
                                        onClick={() =>
                                            cambiarEstadoEmpleado(
                                                empleado.id,
                                                !empleado.activo
                                            )
                                        }
                                    >
                                        {empleado.activo
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
                                key={empleado.id}
                            >

                                <span>
                                    {empleado.nombre}
                                </span>


                                <span>
                                    {empleado.email}
                                </span>


                                <span>
                                    ••••••••
                                </span>


                                <span>
                                    {obtenerNombreRol(
                                        empleado.rol
                                    )}
                                </span>


                                <span>

                                    <button
                                        className={
                                            empleado.activo
                                                ? "estado-activo"
                                                : "estado-inactivo"
                                        }
                                        onClick={() =>
                                            cambiarEstadoEmpleado(
                                                empleado.id,
                                                !empleado.activo
                                            )
                                        }
                                    >
                                        {empleado.activo
                                            ? "Activo"
                                            : "Inactivo"}
                                    </button>

                                </span>


                                <span>

                                    <button
                                        className="editar-producto-button"
                                        onClick={() =>
                                            comenzarEdicion(
                                                empleado.id
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

export default Empleados;