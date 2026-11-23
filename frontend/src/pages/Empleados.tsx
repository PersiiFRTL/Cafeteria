import { useEffect, useState } from "react";
import { ChevronUp, Eye, EyeOff, Pencil, Plus } from "lucide-react";
import { usePersonal } from "../context/usePersonal";
import { contrasenaValida, emailValido } from "../validaciones";
import { useToast } from "../context/useToast";
import { useAuth } from "../context/AuthContext";
import { repositorioPersonal, type RolPersistido } from "../services/personalRepository";
import type { Modulo, PermisosRol } from "../config/permisos";

type RolEmpleado = string;

const MODULOS_ROL: Array<{ id: Modulo; nombre: string }> = [
    { id: "dashboard", nombre: "Inicio" }, { id: "mesas", nombre: "Mesas" },
    { id: "comandas", nombre: "Comandas" }, { id: "nueva-comanda", nombre: "Nueva comanda" },
    { id: "preparacion", nombre: "Preparación" }, { id: "productos", nombre: "Productos" },
    { id: "materias-primas", nombre: "Materias primas" }, { id: "stock", nombre: "Stock" },
    { id: "produccion", nombre: "Producción" }, { id: "recetas", nombre: "Recetas" },
    { id: "mapa", nombre: "Mapa" }, { id: "informes", nombre: "Informes" },
    { id: "empleados", nombre: "Empleados" }
];
const ROLES_BASE_EDITABLES = new Set(["EMPLEADO", "COCINA"]);

const permisosVacios = (): PermisosRol => Object.fromEntries(
    MODULOS_ROL.map(({ id }) => [id, { ver: false, interactuar: false }])
) as PermisosRol;

function Empleados() {
    const { mostrarToast } = useToast();
    const { usuario } = useAuth();
    const esAdministrador = usuario?.rol === "ADMINISTRADOR";

    const {
        empleados,
        agregarEmpleado,
        editarEmpleado,
        cambiarEstadoEmpleado
    } = usePersonal();


    const [mostrarFormulario, setMostrarFormulario] =
        useState(false);

    const [empleadoEditando, setEmpleadoEditando] =
        useState<string | null>(null);


    const [nombre, setNombre] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [mostrarPassword, setMostrarPassword] =
        useState(false);

    const [errorFormulario, setErrorFormulario] =
        useState("");

    const [rol, setRol] =
        useState<RolEmpleado>("EMPLEADO");
    const [roles, setRoles] = useState<RolPersistido[]>([]);
    const [mostrarPanelRoles, setMostrarPanelRoles] = useState(false);
    const [cargandoRoles, setCargandoRoles] = useState(false);
    const [errorCargaRoles, setErrorCargaRoles] = useState("");
    const [modalRol, setModalRol] = useState(false);
    const [rolEditando, setRolEditando] = useState<string | null>(null);
    const [rolesRenombrados, setRolesRenombrados] = useState<Record<string, string>>({});
    const [nombreRol, setNombreRol] = useState("");
    const [descripcionRol, setDescripcionRol] = useState("");
    const [permisosRol, setPermisosRol] = useState<PermisosRol>(permisosVacios);
    const [guardandoRol, setGuardandoRol] = useState(false);

    useEffect(() => {
        const puedeGestionar = esAdministrador || usuario?.permisos.empleados?.interactuar;
        if (!puedeGestionar) return;
        let vigente = true;
        void Promise.resolve().then(() => {
            if (!vigente) return;
            setCargandoRoles(true);
            setErrorCargaRoles("");
        });
        void repositorioPersonal.listarRoles().then((rolesCargados) => {
            if (!vigente) return;
            setRoles(rolesCargados);
        }).catch((error: unknown) => {
            if (!vigente) return;
            const mensaje = error instanceof Error ? error.message : "No se pudieron cargar los roles.";
            setErrorCargaRoles(mensaje);
            mostrarToast(mensaje, "error");
        }).finally(() => {
            if (vigente) setCargandoRoles(false);
        });
        return () => { vigente = false; };
    }, [esAdministrador, mostrarToast, usuario?.permisos.empleados?.interactuar]);

    const cambiarPermiso = (modulo: Modulo, accion: "ver" | "interactuar", activo: boolean) => {
        setPermisosRol((actuales) => {
            const fila = actuales[modulo] ?? { ver: false, interactuar: false };
            return { ...actuales, [modulo]: accion === "interactuar"
                ? { ver: activo || fila.ver, interactuar: activo }
                : { ver: activo || fila.interactuar, interactuar: activo ? fila.interactuar : false } };
        });
    };

    const abrirCreacionRol = () => {
        setRolEditando(null);
        setNombreRol("");
        setDescripcionRol("");
        setPermisosRol(permisosVacios());
        setModalRol(true);
    };

    const abrirEdicionRol = (rolExistente: RolPersistido) => {
        setRolEditando(rolExistente.nombre);
        setNombreRol(rolExistente.nombre);
        setDescripcionRol(rolExistente.descripcion);
        setPermisosRol({ ...permisosVacios(), ...rolExistente.permisos } as PermisosRol);
        setModalRol(true);
    };

    const cerrarModalRol = () => {
        if (guardandoRol) return;
        setModalRol(false);
        setRolEditando(null);
    };

    const resolverNombreRol = (nombre: string) => {
        let actual = nombre;
        const visitados = new Set<string>();
        while (rolesRenombrados[actual] && !visitados.has(actual)) {
            visitados.add(actual);
            actual = rolesRenombrados[actual];
        }
        return actual;
    };

    const guardarRol = async () => {
        const nombre = nombreRol.trim();
        if (nombre.length < 2 || nombre.length > 60) {
            mostrarToast("El nombre del rol debe tener entre 2 y 60 caracteres.", "error");
            return;
        }
        setGuardandoRol(true);
        try {
            const datosRol = { nombre, descripcion: descripcionRol.trim(), permisos: permisosRol };
            const anterior = rolEditando;
            const guardado = anterior
                ? await repositorioPersonal.editarRol(anterior, datosRol)
                : await repositorioPersonal.crearRol(datosRol);
            setRoles((actuales) => {
                const restantes = anterior ? actuales.filter((item) => item.nombre !== anterior) : actuales;
                return [...restantes, guardado].sort((a, b) => a.nombre.localeCompare(b.nombre));
            });
            setErrorCargaRoles("");
            if (anterior && anterior !== guardado.nombre) {
                setRolesRenombrados((actuales) => ({ ...actuales, [anterior]: guardado.nombre }));
            }
            if (!anterior || rol === anterior) setRol(guardado.nombre);
            setNombreRol(""); setDescripcionRol(""); setPermisosRol(permisosVacios()); setModalRol(false); setRolEditando(null);
            if (!anterior) setMostrarPanelRoles(true);
            mostrarToast(anterior ? "Rol actualizado correctamente." : "Rol creado correctamente.");
        } catch (error) {
            mostrarToast(error instanceof Error ? error.message : "No se pudo guardar el rol.", "error");
        } finally { setGuardandoRol(false); }
    };


    const limpiarFormulario = () => {

        setNombre("");

        setEmail("");

        setPassword("");


        setMostrarPassword(false);

        setErrorFormulario("");

        setRol("EMPLEADO");
    };


    const crearEmpleado = async () => {

        if (!validarEmpleado()) {
            return;
        }

        try {
            await agregarEmpleado(nombre, email, password, rol);
            mostrarToast("Empleado creado correctamente.");
        } catch (error) {
            mostrarToast(error instanceof Error ? error.message : "No se pudo crear el empleado.", "error");
            return;
        }

        limpiarFormulario();

        setMostrarFormulario(false);
    };


    const comenzarEdicion = (
        id: string
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

        setPassword("");

        setMostrarPassword(false);

        setErrorFormulario("");

        setRol(resolverNombreRol(empleado.rol));
    };


    const cancelarEdicion = () => {

        setEmpleadoEditando(null);

        limpiarFormulario();
    };


    const guardarEdicion = async () => {

        if (empleadoEditando === null || !validarEmpleado(empleadoEditando)) {
            return;
        }

        try {
            await editarEmpleado(empleadoEditando, nombre, email, password, rol);
            mostrarToast("Cambios del empleado guardados.");
        } catch (error) {
            mostrarToast(error instanceof Error ? error.message : "No se pudieron guardar los cambios.", "error");
            return;
        }

        setEmpleadoEditando(null);

        limpiarFormulario();
    };

    const validarEmpleado = (idExcluido: string | null = null) => {
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

        const cambioContrasena = idExcluido === null || password.length > 0;
        if (cambioContrasena && !contrasenaValida(password)) {
            setErrorFormulario("La contraseña debe tener al menos 8 caracteres e incluir una letra y un número.");
            return false;
        }

        setErrorFormulario("");
        return true;
    };

    const alternarEstadoEmpleado = async (id: string, activo: boolean) => {
        try {
            await cambiarEstadoEmpleado(id, activo);
            mostrarToast(activo ? "Empleado activado." : "Empleado desactivado.");
        } catch (error) {
            mostrarToast(error instanceof Error ? error.message : "No se pudo cambiar el estado del empleado.", "error");
        }
    };


    const obtenerNombreRol = (
        rol: RolEmpleado
    ) => {

        const nombreRolActual = resolverNombreRol(rol);
        switch (nombreRolActual) {

            case "ADMINISTRADOR":
                return "Administrador";

            case "EMPLEADO":
                return "Empleado";

            case "COCINA":
                return "Cocina";

            default:
                return nombreRolActual;
        }
    };

    const alternarPanelRoles = () => {
        const mostrar = !mostrarPanelRoles;
        setMostrarPanelRoles(mostrar);
        if (mostrar) requestAnimationFrame(() => document.getElementById("roles-admin-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }));
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


                <div className="empleados-header-actions">
                {esAdministrador && (
                    <button
                        type="button"
                        className="primary-button empleados-accion-header"
                        aria-expanded={mostrarPanelRoles}
                        aria-controls={mostrarPanelRoles ? "roles-admin-panel" : undefined}
                        onClick={alternarPanelRoles}
                    >
                        {mostrarPanelRoles ? <ChevronUp className="ui-icon" aria-hidden="true" /> : <Pencil className="ui-icon" aria-hidden="true" />}
                        {mostrarPanelRoles ? "Ocultar roles" : "Editar rol"}
                    </button>
                )}
                {esAdministrador && <button type="button" className="primary-button empleados-accion-header" onClick={abrirCreacionRol}>
                    <Plus className="ui-icon" aria-hidden="true" /> Nuevo rol
                </button>}
                {usuario?.permisos.empleados?.interactuar && <button
                    type="button"
                    className="primary-button empleado-nuevo-button"
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
                    <Plus className="ui-icon" aria-hidden="true" /> Nuevo empleado
                </button>}
                </div>

            </div>

            {esAdministrador && mostrarPanelRoles && (
                <section className="roles-admin-panel" id="roles-admin-panel" aria-label="Administrar roles">
                    <div className="roles-admin-panel-heading">
                        <div>
                            <h2>Roles y permisos</h2>
                            <p>Podés editar los roles Empleado, Cocina y los personalizados. Administrador permanece protegido.</p>
                        </div>
                    </div>
                    {errorCargaRoles && <p className="form-field-error" role="alert">No se pudieron cargar los roles: {errorCargaRoles}</p>}
                    {cargandoRoles ? (
                        <div className="roles-admin-loading" role="status"><span className="spinner-inline" aria-hidden="true" /> Cargando roles…</div>
                    ) : roles.length === 0 ? (
                        errorCargaRoles ? null : <p className="roles-admin-empty">Todavía no hay roles disponibles.</p>
                    ) : <div className="roles-admin-grid">
                        {roles.map((rolDisponible) => (
                            <article className="roles-admin-card" key={rolDisponible.nombre}>
                                <div className="roles-admin-card-heading">
                                    <h3>{obtenerNombreRol(rolDisponible.nombre)}</h3>
                                    <span className={rolDisponible.sistema ? "roles-admin-badge sistema" : "roles-admin-badge personalizado"}>
                                        {rolDisponible.sistema ? "Base" : "Personalizado"}
                                    </span>
                                </div>
                                <p>{rolDisponible.descripcion || "Sin descripción."}</p>
                                <div className="roles-admin-card-footer">
                                    <small>{Object.values(rolDisponible.permisos).filter((permiso) => permiso.ver || permiso.interactuar).length} módulos habilitados</small>
                                    {rolDisponible.sistema && !ROLES_BASE_EDITABLES.has(rolDisponible.nombre) ? (
                                        <span className="roles-admin-protegido">Protegido</span>
                                    ) : (
                                        <button type="button" className="primary-button roles-admin-edit" onClick={() => abrirEdicionRol(rolDisponible)}>
                                            <Pencil className="ui-icon" aria-hidden="true" /> Editar rol
                                        </button>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>}
                </section>
            )}

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
                        readOnly={!esAdministrador}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setErrorFormulario("");
                        }}
                    />


                    {esAdministrador && <div className="empleado-password-field">
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
                    </div>}


                    <select
                        disabled={!esAdministrador}
                        value={rol}
                        onChange={(e) =>
                            setRol(
                                e.target.value as RolEmpleado
                            )
                        }
                    >

                        {roles.map((opcion) => <option key={opcion.nombre} value={opcion.nombre}>{obtenerNombreRol(opcion.nombre)}</option>)}

                    </select>

                    {errorFormulario && (
                        <p className="form-field-error" role="alert">{errorFormulario}</p>
                    )}
                    </div>


                    <div className="producto-form-actions">

                        <button
                            type="button"
                            className="primary-button empleado-nuevo-button"
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

            {modalRol && esAdministrador && (
                <div className="sistema-modal-overlay" role="presentation" onClick={cerrarModalRol}>
                    <section className="sistema-modal roles-modal" role="dialog" aria-modal="true" aria-labelledby="gestionar-rol-titulo" onClick={(evento) => evento.stopPropagation()}>
                        <h2 id="gestionar-rol-titulo">{rolEditando ? `Editar rol: ${rolEditando}` : "Crear rol y permisos"}</h2>
                        <label>Nombre del rol<input autoFocus maxLength={60} value={nombreRol} disabled={Boolean(roles.find((opcion) => opcion.nombre === rolEditando)?.sistema)} onChange={(evento) => setNombreRol(evento.target.value)} placeholder="Ej. Barista" /></label>
                        {roles.find((opcion) => opcion.nombre === rolEditando)?.sistema && <small className="roles-base-ayuda">Los roles base conservan su nombre; podés cambiar su descripción y permisos.</small>}
                        <label>Descripción (opcional)<input maxLength={240} value={descripcionRol} onChange={(evento) => setDescripcionRol(evento.target.value)} placeholder="Responsabilidades del rol" /></label>
                        <div className="roles-permissions-heading"><strong>Permisos por módulo</strong><span>Interactuar también habilita Ver.</span></div>
                        <div className="roles-permissions-table">
                            <div className="roles-permissions-row roles-permissions-header"><span>Módulo</span><span>Ver</span><span>Interactuar</span></div>
                            {MODULOS_ROL.map(({ id, nombre: etiqueta }) => {
                                const permiso = permisosRol[id] ?? { ver: false, interactuar: false };
                                return <div className="roles-permissions-row" key={id}>
                                    <span>{etiqueta}</span>
                                    <label><input type="checkbox" checked={permiso.ver} onChange={(evento) => cambiarPermiso(id, "ver", evento.target.checked)} aria-label={`Ver ${etiqueta}`} /></label>
                                    <label><input type="checkbox" checked={permiso.interactuar} onChange={(evento) => cambiarPermiso(id, "interactuar", evento.target.checked)} aria-label={`Interactuar en ${etiqueta}`} /></label>
                                </div>;
                            })}
                        </div>
                        <div className="producto-form-actions">
                            <button className="primary-button" disabled={guardandoRol} onClick={() => void guardarRol()}>{guardandoRol ? "Guardando…" : rolEditando ? "Guardar cambios" : "Crear rol"}</button>
                            <button className="secondary-button" disabled={guardandoRol} onClick={cerrarModalRol}>Cancelar</button>
                        </div>
                    </section>
                </div>
            )}


            {/* ==========================
                TABLA DE EMPLEADOS
            ========================== */}

            <div className="productos-table empleados-table">

                <div className="producto-row producto-row-header">

                    <span>
                        Nombre
                    </span>

                    <span>
                        Email
                    </span>

                    <span>
                        Acceso
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
                                        readOnly={!esAdministrador}
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            setErrorFormulario("");
                                        }}
                                    />


                                    {esAdministrador && <div className="empleado-password-field" data-label="Nueva contraseña">
                                        <input
                                            type={mostrarPassword ? "text" : "password"}
                                            placeholder="Nueva contraseña (opcional)"
                                            value={password}
                                            autoComplete="new-password"
                                            aria-label="Nueva contraseña opcional"
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
                                            Dejala vacía para conservarla. Si la cambiás: mínimo 8 caracteres, una letra y un número.
                                        </small>
                                    </div>}


                                    <select
                                        value={rol}
                                        aria-label="Rol"
                                        disabled={!esAdministrador}
                                        onChange={(e) =>
                                            setRol(
                                                e.target.value as RolEmpleado
                                            )
                                        }
                                    >

                                        {roles.map((opcion) => <option key={opcion.nombre} value={opcion.nombre}>{obtenerNombreRol(opcion.nombre)}</option>)}

                                    </select>


                                    {usuario?.permisos.empleados?.interactuar && <button
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
                                    </button>}


                                    <div className="producto-edicion-actions">

                                        {errorFormulario && (
                                            <p className="form-field-error" role="alert">{errorFormulario}</p>
                                        )}

                                        {usuario?.permisos.empleados?.interactuar && <button
                                            className="primary-button"
                                            onClick={
                                                guardarEdicion
                                            }
                                        >
                                            Guardar
                                        </button>}


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


                                <span data-label="Acceso">
                                    Cuenta de Auth
                                </span>


                                <span data-label="Rol">
                                    {obtenerNombreRol(
                                        empleado.rol
                                    )}
                                </span>


                                <span data-label="Estado">

                                    {usuario?.permisos.empleados?.interactuar && <button
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
                                    </button>}

                                </span>


                                <span data-label="Acciones">

                                    {usuario?.permisos.empleados?.interactuar && <button
                                        className="editar-producto-button"
                                        onClick={() =>
                                            comenzarEdicion(
                                                empleado.id
                                            )
                                        }
                                    >
                                        <Pencil className="ui-icon" aria-hidden="true" />
                                        Editar
                                    </button>}

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
