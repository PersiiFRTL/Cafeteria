import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { usePersonal } from "../context/usePersonal";
import { contrasenaValida, emailValido } from "../validaciones";
import { useToast } from "../context/useToast";

type RolEmpleado =
    | "ADMINISTRADOR"
    | "EMPLEADO"
    | "COCINA";

function Empleados() {
    const { mostrarToast } = useToast();

    const {
        empleados,
        agregarEmpleado,
        editarEmpleado,
        cambiarEstadoEmpleado
    } = usePersonal();


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

    const [passwordOriginal, setPasswordOriginal] =
        useState("");

    const [mostrarPassword, setMostrarPassword] =
        useState(false);

    const [errorFormulario, setErrorFormulario] =
        useState("");

    const [rol, setRol] =
        useState<RolEmpleado>("EMPLEADO");


    const limpiarFormulario = () => {

        setNombre("");

        setEmail("");

        setPassword("");

        setPasswordOriginal("");

        setMostrarPassword(false);

        setErrorFormulario("");

        setRol("EMPLEADO");
    };


    const crearEmpleado = () => {

        if (!validarEmpleado()) {
            return;
        }

        agregarEmpleado(
            nombre,
            email,
            password,
            rol
        );

        mostrarToast("Empleado creado correctamente.");

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

        setPasswordOriginal(empleado.password);

        setMostrarPassword(false);

        setErrorFormulario("");

        setRol(empleado.rol);
    };


    const cancelarEdicion = () => {

        setEmpleadoEditando(null);

        limpiarFormulario();
    };


    const guardarEdicion = () => {

        if (empleadoEditando === null || !validarEmpleado(empleadoEditando)) {
            return;
        }

        editarEmpleado(
            empleadoEditando,
            nombre,
            email,
            password,
            rol
        );

        mostrarToast("Cambios del empleado guardados.");

        setEmpleadoEditando(null);

        limpiarFormulario();
    };

    const validarEmpleado = (idExcluido: number | null = null) => {
        if (!nombre.trim()) {
            setErrorFormulario("Ingresá el nombre del empleado.");
            return false;
        }

        if (!emailValido(email)) {
            setErrorFormulario("Ingresá un email válido.");
            return false;
        }

        const emailNormalizado = email.trim().toLowerCase();
        const emailDuplicado = empleados.some(
            (empleado) =>
                empleado.id !== idExcluido &&
                empleado.email.trim().toLowerCase() === emailNormalizado
        );

        if (emailDuplicado) {
            setErrorFormulario("Ya existe un empleado registrado con ese email.");
            return false;
        }

        const cambioContrasena = idExcluido === null || password !== passwordOriginal;
        if (cambioContrasena && !contrasenaValida(password)) {
            setErrorFormulario("La contraseña debe tener al menos 8 caracteres e incluir una letra y un número.");
            return false;
        }

        setErrorFormulario("");
        return true;
    };

    const alternarEstadoEmpleado = (id: number, activo: boolean) => {
        cambiarEstadoEmpleado(id, activo);
        mostrarToast(activo ? "Empleado activado." : "Empleado desactivado.");
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

                    <div className="producto-form-fields">
                    <input
                        type="text"
                        required
                        placeholder="Nombre completo"
                        value={nombre}
                        onChange={(e) => {
                            setNombre(e.target.value);
                            setErrorFormulario("");
                        }}
                    />


                    <input
                        type="email"
                        required
                        placeholder="Email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorFormulario("");
                        }}
                    />


                    <div className="empleado-password-field">
                        <input
                            type={mostrarPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={password}
                            required
                            autoComplete="new-password"
                            aria-label="Contraseña"
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setErrorFormulario("");
                            }}
                        />
                        <button
                            type="button"
                            className="password-visibility-button"
                            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            onClick={() => setMostrarPassword(!mostrarPassword)}
                        >
                            {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <small className="empleado-password-hint">
                            Mínimo 8 caracteres, con al menos una letra y un número.
                        </small>
                    </div>


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

                    {errorFormulario && (
                        <p className="form-field-error" role="alert">{errorFormulario}</p>
                    )}
                    </div>


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
                                        placeholder="Nombre"
                                        aria-label="Nombre"
                                        required
                                        value={nombre}
                                        onChange={(e) => {
                                            setNombre(e.target.value);
                                            setErrorFormulario("");
                                        }}
                                    />


                                    <input
                                        type="email"
                                        placeholder="Email"
                                        aria-label="Email"
                                        required
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setErrorFormulario("");
                                        }}
                                    />


                                    <div className="empleado-password-field" data-label="Contraseña">
                                        <input
                                            type={mostrarPassword ? "text" : "password"}
                                            placeholder="Contraseña"
                                            value={password}
                                            required
                                            autoComplete="new-password"
                                            aria-label="Contraseña"
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                setErrorFormulario("");
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="password-visibility-button"
                                            aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            title={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                            onClick={() => setMostrarPassword(!mostrarPassword)}
                                        >
                                            {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                        <small className="empleado-password-hint">
                                            Mínimo 8 caracteres, con al menos una letra y un número.
                                        </small>
                                    </div>


                                    <select
                                        value={rol}
                                        aria-label="Rol"
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
                                        data-label="Estado"
                                        className={
                                            empleado.activo
                                                ? "estado-activo"
                                                : "estado-inactivo"
                                        }
                                        onClick={() =>
                                            alternarEstadoEmpleado(
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

                                        {errorFormulario && (
                                            <p className="form-field-error" role="alert">{errorFormulario}</p>
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
                                key={empleado.id}
                            >

                                    <span data-label="Nombre">
                                    {empleado.nombre}
                                </span>


                                <span data-label="Email">
                                    {empleado.email}
                                </span>


                                <span data-label="Contraseña">
                                    ••••••••
                                </span>


                                <span data-label="Rol">
                                    {obtenerNombreRol(
                                        empleado.rol
                                    )}
                                </span>


                                <span data-label="Estado">

                                    <button
                                        className={
                                            empleado.activo
                                                ? "estado-activo"
                                                : "estado-inactivo"
                                        }
                                        onClick={() =>
                                            alternarEstadoEmpleado(
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


                                <span data-label="Acciones">

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
