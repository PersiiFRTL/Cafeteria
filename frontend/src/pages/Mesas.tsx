import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    CircleCheck,
    CircleX,
    Map,
    Pencil,
    ShoppingBag,
    UsersRound,
    X,
} from "lucide-react";
import { tienePermiso } from "../config/permisos";
import { useAuth } from "../context/AuthContext";
import { useComandas } from "../context/useComandas";
import ModalConfirmacion from "../components/ModalConfirmacion";
import { useToast } from "../context/useToast";
import { obtenerDimensionesElementoMapa } from "../domain/mapa";

interface Mesa {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

function Mesas() {
    const { mostrarToast } = useToast();

    const navigate = useNavigate();
    const { usuario } = useAuth();

    const {
        mesas,
        elementosMapa,
        obtenerComandaDeMesa,
        cancelarComanda,
        cambiarEstadoMesa,
        errorDatos
    } = useComandas();

    const puedeEditarMapa = usuario
        ? tienePermiso(usuario.rol, "mapa")
        : false;
    const puedeCrearComanda = usuario
        ? tienePermiso(usuario.rol, "nueva-comanda")
        : false;

    const [mesaSeleccionada, setMesaSeleccionada] =
        useState<Mesa | null>(null);
    const [confirmarCancelarComanda, setConfirmarCancelarComanda] =
        useState<(() => void | Promise<void>) | null>(null);
    const seleccionarMesa = (mesa: Mesa) => {
        setMesaSeleccionada(mesa);
    };

    const mesaSeleccionadaActual = mesaSeleccionada
        ? mesas.find((mesa) => mesa.id === mesaSeleccionada.id) ?? mesaSeleccionada
        : null;
    const comandaMesaSeleccionada = mesaSeleccionadaActual
        ? obtenerComandaDeMesa(mesaSeleccionadaActual.id)
        : undefined;

    const cerrarPanel = () => {
        setMesaSeleccionada(null);
    };

    return (
        <div className="dashboard-content">

            <div className="mesas-header">

                <div>

                    <h1>Mesas</h1>

                    <p>
                        Estado actual de las mesas de la cafetería.
                    </p>
                    <p className="atajo-teclado-ayuda">
                        Teclado: <kbd>Enter</kbd> seleccionar una mesa · <kbd>Esc</kbd> cerrar el panel
                    </p>

                </div>

                {puedeCrearComanda && (
                    <button
                        className="primary-button mesas-take-away-button"
                        onClick={() => navigate("/nueva-comanda?tipo=take-away")}
                        style={{ width: "auto", minWidth: "180px" }}
                    >
                        <ShoppingBag className="ui-icon" aria-hidden="true" />
                        Nuevo take away
                    </button>
                )}

                {puedeEditarMapa && (
                    <button
                        className="primary-button"
                        onClick={() => navigate("/mapa")}
                        style={{ width: "auto", minWidth: "180px" }}
                    >
                        <Map className="ui-icon" aria-hidden="true" />
                        Mapa del local
                    </button>
                )}

            </div>

            {elementosMapa.length === 0 ? (

                <div className="mesas-sin-mapa" role="status">

                    <h2>
                        <Map className="ui-icon" aria-hidden="true" />
                        El mapa todavía no está configurado
                    </h2>

                    <p>
                        El administrador debe diseñar el mapa del local
                        antes de utilizar esta vista.
                    </p>

                </div>

            ) : (

                <div className="mesas-mapa-container">

                    <div className="mesas-mapa">

                        {elementosMapa.map((elemento) => {

                            if (elemento.tipo === "linea") {

                                return (
                                    <div
                                        key={elemento.id}
                                        className="mesas-mapa-linea"
                                        aria-hidden="true"
                                        style={{
                                            left: elemento.x,
                                            top: elemento.y,
                                            width: obtenerDimensionesElementoMapa(elemento).ancho,
                                            height: obtenerDimensionesElementoMapa(elemento).alto
                                        }}
                                    />
                                );
                            }

                            const mesa = mesas.find(
                                (item) =>
                                    item.id === elemento.mesaId
                            );

                            if (!mesa) {
                                return (
                                    <div
                                        key={elemento.id}
                                        className="mesas-mapa-mesa sin-asignar"
                                        style={{
                                            left: elemento.x,
                                            top: elemento.y,
                                            width: obtenerDimensionesElementoMapa(elemento).ancho,
                                            height: obtenerDimensionesElementoMapa(elemento).alto,
                                            transform:
                                                `rotate(${elemento.rotacion}deg)`
                                        }}
                                    >
                                        <strong>
                                            Mesa sin asignar
                                        </strong>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={elemento.id}
                                    className={`mesas-mapa-mesa ${mesa.estado}`}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Mesa ${mesa.numero}, ${mesa.estado === "libre" ? "libre" : "ocupada"}, capacidad ${mesa.capacidad}`}
                                    style={{
                                        left: elemento.x,
                                        top: elemento.y,
                                        width: obtenerDimensionesElementoMapa(elemento).ancho,
                                        height: obtenerDimensionesElementoMapa(elemento).alto,
                                        transform:
                                            `rotate(${elemento.rotacion}deg)`
                                    }}
                                    onClick={() =>
                                        seleccionarMesa(mesa)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            seleccionarMesa(mesa);
                                        }
                                    }}
                                >

                                    <strong>
                                        Mesa {mesa.numero}
                                    </strong>

                                    <span>
                                        {mesa.capacidad} personas
                                    </span>

                                    <small>
                                        {mesa.estado === "libre" ? (
                                            <><CircleCheck className="ui-icon mesa-estado-icon" aria-hidden="true" /> Libre</>
                                        ) : (
                                            <><CircleX className="ui-icon mesa-estado-icon" aria-hidden="true" /> Ocupada</>
                                        )}
                                    </small>

                                </div>
                            );

                        })}

                    </div>

                </div>

            )}

            {mesaSeleccionadaActual && (

                <div className="mesa-panel">

                    <div className="mesa-panel-content">

                        <div className="mesa-panel-header">

                            <div>

                                <h2>
                                    Mesa {mesaSeleccionadaActual.numero}
                                </h2>

                                <p>
                                    <UsersRound className="ui-icon mesa-capacidad-icon" aria-hidden="true" />
                                    {mesaSeleccionadaActual.capacidad} personas
                                </p>

                            </div>

                            <button
                                className="close-button"
                                data-shortcut-close
                                type="button"
                                onClick={cerrarPanel}
                            >
                                <X className="ui-icon" aria-hidden="true" />
                            </button>

                        </div>

                        <div className="mesa-panel-body">

                            {!comandaMesaSeleccionada && mesaSeleccionadaActual.estado === "libre" ? (

                                <>
                                    <div className="mesa-panel-status libre">
                                        <CircleCheck className="ui-icon" aria-hidden="true" />
                                        Mesa libre
                                    </div>

                                    <p>
                                        Esta mesa está libre y disponible para iniciar una comanda.
                                    </p>

                                    <button
                                        className="primary-button"
                                        onClick={() =>
                                            navigate(
                                                `/nueva-comanda?mesaId=${mesaSeleccionadaActual.id}`
                                            )
                                        }
                                    >
                                        <ShoppingBag className="ui-icon" aria-hidden="true" />
                                        Generar comanda
                                    </button>
                                    
                                    {puedeCrearComanda && (
                                        <button
                                            className="secondary-button"
                                            onClick={async () => {
                                                const actualizado = await cambiarEstadoMesa(mesaSeleccionadaActual.id, "ocupada");
                                                if (!actualizado) {
                                                    mostrarToast(errorDatos || "No se pudo marcar la mesa como ocupada.");
                                                    return;
                                                }
                                                mostrarToast("Mesa marcada como ocupada.");
                                            }}
                                        >
                                            <CircleX className="ui-icon" aria-hidden="true" />
                                            Marcar como ocupada
                                        </button>
                                    )}
                                </>

                            ) : !comandaMesaSeleccionada ? (

                                <>
                                    <div className="mesa-panel-status ocupada">
                                        <CircleX className="ui-icon" aria-hidden="true" />
                                        Mesa ocupada
                                    </div>

                                    <p>
                                        Está ocupada sin una comanda asociada. Podés usarla como extensión de otra mesa.
                                    </p>

                                    {puedeCrearComanda && (
                                        <button
                                            className="secondary-button"
                                            onClick={async () => {
                                                const actualizado = await cambiarEstadoMesa(mesaSeleccionadaActual.id, "libre");
                                                if (!actualizado) {
                                                    mostrarToast(errorDatos || "No se pudo liberar la mesa.");
                                                    return;
                                                }
                                                mostrarToast("Mesa marcada como libre.");
                                            }}
                                        >
                                            <CircleCheck className="ui-icon" aria-hidden="true" />
                                            Marcar como libre
                                        </button>
                                    )}
                                </>

                            ) : (

                                <>
                                    <div className="mesa-panel-status ocupada">
                                        <CircleX className="ui-icon" aria-hidden="true" />
                                        Mesa ocupada
                                    </div>

                                    <p>
                                        Esta mesa tiene una comanda activa.
                                    </p>

                                    <div className="mesa-actions">

                                        <button
                                            className="primary-button"
                                            onClick={() => {
                                                navigate(`/comandas?comanda=${comandaMesaSeleccionada.id}`);
                                            }}
                                        >
                                            <ShoppingBag className="ui-icon" aria-hidden="true" />
                                            Ver comanda
                                        </button>

                                            {comandaMesaSeleccionada.estado === "pendiente" && (
                                                    <button
                                                        className="secondary-button"
                                                        onClick={() =>
                                                            navigate(
                                                                `/nueva-comanda?mesaId=${mesaSeleccionadaActual.id}&editar=${comandaMesaSeleccionada.id}`
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="ui-icon" aria-hidden="true" />
                                                        Editar comanda
                                                    </button>
                                            )}

                                                <button
                                                    className="secondary-button"
                                                    onClick={() => setConfirmarCancelarComanda(() => async () => {
                                                        const cancelada = await cancelarComanda(comandaMesaSeleccionada.id);
                                                        if (!cancelada) {
                                                            mostrarToast("No se pudo cancelar la comanda. Intentá nuevamente.");
                                                            return;
                                                        }
                                                        cerrarPanel();
                                                        mostrarToast("Comanda cancelada y mesa liberada.");
                                                    })}
                                                >
                                                    <X className="ui-icon" aria-hidden="true" />
                                                    Cancelar comanda y liberar mesa
                                                </button>

                                    </div>

                                </>

                            )}

                        </div>

                    </div>

                </div>

            )}

            {confirmarCancelarComanda && (
                <ModalConfirmacion
                    titulo="Cancelar comanda y liberar mesa"
                    mensaje={`¿Cancelar la comanda y liberar la Mesa ${mesaSeleccionada?.numero}? El stock procesado será devuelto.`}
                    textoConfirmar="Cancelar comanda"
                    destructivo
                    cerrar={() => setConfirmarCancelarComanda(null)}
                    confirmar={() => {
                        void Promise.resolve(confirmarCancelarComanda()).finally(() => {
                            setConfirmarCancelarComanda(null);
                        });
                    }}
                    cancelar={() => setConfirmarCancelarComanda(null)}
                />
            )}

        </div>
    );
}

export default Mesas;
