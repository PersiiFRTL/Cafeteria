import { useEffect, useState, useRef } from "react";
import { useComandas } from "../context/useComandas";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
import ModalConfirmacion from "../components/ModalConfirmacion";
import { useToast } from "../context/useToast";

const COMANDAS_FILTRO_KEY = "cafeteria-comandas-filtro";
const COMANDAS_VISTA_KEY = "cafeteria-comandas-vista";

type FiltroComanda =
    | "todas"
    | "pendiente"
    | "preparando"
    | "lista"
    | "finalizada"
    | "cancelada";

type VistaComandas = "grilla" | "lista";

interface ConfirmacionComanda {
    titulo: string;
    mensaje: string;
    accion: () => void;
    textoConfirmar: string;
    destructivo?: boolean;
}

const filtrosComandas: { valor: FiltroComanda; etiqueta: string }[] = [
    { valor: "todas", etiqueta: "Todas" },
    { valor: "pendiente", etiqueta: "Pendientes" },
    { valor: "preparando", etiqueta: "En preparación" },
    { valor: "lista", etiqueta: "Listas" },
    { valor: "finalizada", etiqueta: "Finalizadas" },
    { valor: "cancelada", etiqueta: "Canceladas" }
];

function Comandas() {
    const { mostrarToast } = useToast();
    const bloqueoAccion = useRef(false);

    const ejecutarAccionConBloqueo = (accion: () => void) => {
        if (bloqueoAccion.current) {
            return;
        }

        bloqueoAccion.current = true;
        accion();

        window.setTimeout(() => {
            bloqueoAccion.current = false;
        }, 100);
    };

    const [searchParams] = useSearchParams();
    const [filtroComanda, setFiltroComanda] =
        useState<FiltroComanda>(() => {
            const valorGuardado = localStorage.getItem(COMANDAS_FILTRO_KEY) as FiltroComanda | null;
            return filtrosComandas.some((filtro) => filtro.valor === valorGuardado)
                ? valorGuardado ?? "todas"
                : "todas";
        });
    const [vista, setVista] = useState<VistaComandas>(() => {
        const valorGuardado = localStorage.getItem(COMANDAS_VISTA_KEY);
        return valorGuardado === "lista" || valorGuardado === "grilla"
            ? valorGuardado
            : "grilla";
    });

    useEffect(() => {
        localStorage.setItem(COMANDAS_FILTRO_KEY, filtroComanda);
    }, [filtroComanda]);

    useEffect(() => {
        localStorage.setItem(COMANDAS_VISTA_KEY, vista);
    }, [vista]);

    const {
        comandas,
        mesas,
        productos,
        finalizarComanda,
        cancelarComanda,
        procesarStockComanda
    } = useComandas();

    const [mensajeError, setMensajeError] =
        useState<string | null>(null);
    const [confirmacion, setConfirmacion] =
        useState<ConfirmacionComanda | null>(null);

    const comandaSeleccionadaId = Number(
        searchParams.get("comanda")
    );

    const comandasSeleccionadas =
        comandaSeleccionadaId
            ? comandas.filter(
                (comanda) =>
                    comanda.id ===
                    comandaSeleccionadaId
            )
            : comandas;

    const comandasVisibles = comandasSeleccionadas.filter(
        (comanda) =>
            filtroComanda === "todas" ||
            comanda.estado === filtroComanda
    );


    const prioridadComanda: Record<string, number> = {
        pendiente: 0,
        preparando: 1,
        lista: 1,
        finalizada: 2,
        cancelada: 3
    };

    const comandasOrdenadas = [
        ...comandasVisibles
    ].sort((comandaA, comandaB) => {
        const diferenciaPrioridad =
            prioridadComanda[comandaA.estado] -
            prioridadComanda[comandaB.estado];

        if (diferenciaPrioridad !== 0) {
            return diferenciaPrioridad;
        }

        return new Date(comandaA.fechaCreacion).getTime() -
            new Date(comandaB.fechaCreacion).getTime();
    });

    const obtenerProducto = (
        productoId: number
    ) => {

        return productos.find(
            (producto) =>
                producto.id === productoId
        );
    };


    const obtenerMesa = (
        mesaId: number
    ) => {

        return mesas.find(
            (mesa) =>
                mesa.id === mesaId
        );
    };


    // ==========================
    // ENVIAR A PREPARACIÓN
    // ==========================

    const enviarAPreparacion = (
        comandaId: number
    ) => {

        setMensajeError(null);

        const resultado =
            procesarStockComanda(
                comandaId
            );

        if (!resultado) {

            setMensajeError(
                "No hay suficiente stock para procesar esta comanda."
            );

            return;
        }

        setMensajeError(null);
        mostrarToast("Comanda enviada a preparación.");
    };


    return (
        <div className="dashboard-content">

            <div className="comandas-header">

                <div>

                    <h1>
                        Comandas
                    </h1>

                    <p>
                        Historial y estado de las comandas.
                    </p>

                </div>

            </div>

            <div className="comandas-toolbar">
                <div className="comandas-filtros" role="group" aria-label="Filtrar comandas por estado">
                    {filtrosComandas.map((filtro) => (
                        <button
                            key={filtro.valor}
                            type="button"
                            className={`comandas-filtro ${filtroComanda === filtro.valor ? "activo" : ""}`}
                            data-estado={filtro.valor}
                            aria-pressed={filtroComanda === filtro.valor}
                            onClick={() => setFiltroComanda(filtro.valor)}
                        >
                            {filtro.etiqueta}
                        </button>
                    ))}
                </div>

                <div className="comandas-vistas" role="group" aria-label="Vista de comandas">
                    <button
                        type="button"
                        aria-label="Vista de grilla"
                        aria-pressed={vista === "grilla"}
                        title="Vista de grilla"
                        className={vista === "grilla" ? "activo" : ""}
                        onClick={() => setVista("grilla")}
                    >
                        <LayoutGrid size={18} aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        aria-label="Vista de lista"
                        aria-pressed={vista === "lista"}
                        title="Vista de lista"
                        className={vista === "lista" ? "activo" : ""}
                        onClick={() => setVista("lista")}
                    >
                        <List size={18} aria-hidden="true" />
                    </button>
                </div>
            </div>


            {/* ========================== */}
            {/* MENSAJE DE ERROR */}
            {/* ========================== */}

            {mensajeError && (

                <div className="comandas-error" role="alert">

                    {mensajeError}

                </div>

            )}


            {comandasVisibles.length === 0 ? (

                <div className="comandas-empty" role="status" aria-live="polite">

                    <h2>
                        {comandasSeleccionadas.length === 0
                            ? "No hay comandas"
                            : "No hay comandas en este filtro"
                        }
                    </h2>

                    <p>
                        {comandasSeleccionadas.length === 0
                            ? "Todavía no se ha creado ninguna comanda."
                            : "Prueba con otro estado para ver más comandas."
                        }
                    </p>

                </div>

            ) : (

                <div className={`comandas-container ${vista}`}>

                    {comandasOrdenadas.map(
                        (comanda) => {

                            const mesa =
                                obtenerMesa(
                                    comanda.mesaId
                                );


                            return (

                                <div
                                    key={
                                        comanda.id
                                    }
                                    className={`comanda-card estado-${comanda.estado}`}
                                >

                                    {/* ========================== */}
                                    {/* CABECERA */}
                                    {/* ========================== */}

                                    <div className="comanda-card-header">

                                        <div>

                                            <h2>
                                                Comanda #
                                                {
                                                    comanda.id
                                                }
                                            </h2>

                                            <p>
                                                Mesa{" "}
                                                {
                                                    mesa?.numero ??
                                                    "-"
                                                }
                                            </p>

                                        </div>


                                        <span
                                            className={`comanda-estado ${comanda.estado}`}
                                        >

                                            {comanda.estado ===
                                                "pendiente" &&
                                                "Pendiente"}

                                            {comanda.estado ===
                                                "preparando" &&
                                                "Preparando"}

                                            {comanda.estado ===
                                                "lista" &&
                                                "Lista"}

                                            {comanda.estado ===
                                                "finalizada" &&
                                                "Finalizada"}

                                            {comanda.estado ===
                                                "cancelada" &&
                                                "Cancelada"}

                                        </span>

                                    </div>


                                    {/* ========================== */}
                                    {/* PRODUCTOS */}
                                    {/* ========================== */}

                                    <div className="comanda-card-body">

                                        <h3>
                                            Productos
                                        </h3>


                                        {comanda.productos.map(
                                            (item) => {

                                                const producto =
                                                    obtenerProducto(
                                                        item.productoId
                                                    );


                                                if (!producto) {
                                                    return null;
                                                }


                                                return (

                                                    <div
                                                        key={
                                                            item.productoId
                                                        }
                                                        className="comanda-producto"
                                                    >

                                                        <div>

                                                            <strong>
                                                                {
                                                                    item.cantidad
                                                                }{" "}
                                                                x{" "}
                                                                {
                                                                    producto.nombre
                                                                }
                                                            </strong>

                                                            <p>
                                                                {
                                                                    producto.sector
                                                                }
                                                            </p>

                                                        </div>


                                                        <span
                                                            className={`producto-estado ${item.estado}`}
                                                        >

                                                            {item.estado ===
                                                                "pendiente" &&
                                                                "Pendiente"}

                                                            {item.estado ===
                                                                "preparando" &&
                                                                "Preparando"}

                                                            {item.estado ===
                                                                "listo" &&
                                                                "Listo"}

                                                        </span>

                                                    </div>

                                                );
                                            }
                                        )}

                                    </div>


                                    {/* ========================== */}
                                    {/* ACCIONES */}
                                    {/* ========================== */}

                                    <div className="comanda-acciones">


                                        {/* ========================== */}
                                        {/* ENVIAR A PREPARACIÓN */}
                                        {/* ========================== */}

                                        {comanda.estado ===
                                            "pendiente" && (

                                            <button
                                                className="primary-button"
                                                disabled={bloqueoAccion.current}
                                                onClick={() =>
                                                    ejecutarAccionConBloqueo(() =>
                                                        enviarAPreparacion(
                                                            comanda.id
                                                        )
                                                    )
                                                }
                                            >
                                                👨‍🍳 Enviar a preparación
                                            </button>

                                        )}


                                        {/* ========================== */}
                                        {/* FINALIZAR */}
                                        {/* ========================== */}

                                        {comanda.estado ===
                                            "lista" && (

                                            <div className="comanda-finalizar">

                                                <button
                                                    className="primary-button"
                                                    onClick={() => setConfirmacion({
                                                        titulo: "Dejar mesa disponible",
                                                        mensaje: `¿Confirmás dejar disponible la Mesa ${mesa?.numero}?`,
                                                        textoConfirmar: "Dejar disponible",
                                                        accion: () => {
                                                            finalizarComanda(comanda.id);
                                                            mostrarToast(`Mesa ${mesa?.numero ?? ""} disponible.`);
                                                        }
                                                    })}
                                                >
                                                    ✓ Dejar mesa disponible
                                                </button>

                                            </div>

                                        )}

                                        {comanda.estado !== "finalizada" &&
                                            comanda.estado !== "cancelada" && (

                                            <button
                                                className="secondary-button cancelar-comanda-button"
                                                onClick={() => setConfirmacion({
                                                    titulo: "Cancelar comanda",
                                                    mensaje: `¿Cancelar la Comanda #${comanda.id}? El stock procesado será devuelto.`,
                                                    textoConfirmar: "Cancelar comanda",
                                                    accion: () => {
                                                        cancelarComanda(comanda.id);
                                                        mostrarToast("Comanda cancelada y stock devuelto.");
                                                    },
                                                    destructivo: true
                                                })}
                                            >
                                                Cancelar comanda
                                            </button>

                                        )}

                                    </div>

                                </div>

                            );

                        }
                    )}

                </div>

            )}

            {confirmacion && (
                <ModalConfirmacion
                    titulo={confirmacion.titulo}
                    mensaje={confirmacion.mensaje}
                    textoConfirmar={confirmacion.textoConfirmar}
                    destructivo={confirmacion.destructivo}
                    cerrar={() => setConfirmacion(null)}
                    confirmar={() => {
                        confirmacion.accion();
                        setConfirmacion(null);
                    }}
                    cancelar={() => setConfirmacion(null)}
                />
            )}

        </div>
    );
}

export default Comandas;
