import { useState } from "react";
import { useCafeteria } from "../context/CafeteriaContext";
import { useSearchParams } from "react-router-dom";

function Comandas() {

    const [searchParams] = useSearchParams();

    const {
        comandas,
        mesas,
        productos,
        finalizarComanda,
        cancelarComanda,
        procesarStockComanda
    } = useCafeteria();

    const [mensajeError, setMensajeError] =
        useState<string | null>(null);

    const comandaSeleccionadaId = Number(
        searchParams.get("comanda")
    );

    const comandasVisibles =
        comandaSeleccionadaId
            ? comandas.filter(
                (comanda) =>
                    comanda.id ===
                    comandaSeleccionadaId
            )
            : comandas;


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


            {/* ========================== */}
            {/* MENSAJE DE ERROR */}
            {/* ========================== */}

            {mensajeError && (

                <div className="comandas-error">

                    {mensajeError}

                </div>

            )}


            {comandasVisibles.length === 0 ? (

                <div className="comandas-empty">

                    <h2>
                        No hay comandas
                    </h2>

                    <p>
                        Todavía no se ha creado
                        ninguna comanda.
                    </p>

                </div>

            ) : (

                <div className="comandas-container">

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
                                    className="comanda-card"
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
                                                onClick={() =>
                                                    enviarAPreparacion(
                                                        comanda.id
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
                                                    onClick={() => {

                                                        const confirmar =
                                                            window.confirm(
                                                                `¿Dejar disponible la Mesa ${mesa?.numero}?`
                                                            );


                                                        if (
                                                            confirmar
                                                        ) {

                                                            finalizarComanda(
                                                                comanda.id
                                                            );

                                                        }

                                                    }}
                                                >
                                                    ✓ Dejar mesa disponible
                                                </button>

                                            </div>

                                        )}

                                        {comanda.estado !== "finalizada" &&
                                            comanda.estado !== "cancelada" && (

                                            <button
                                                className="secondary-button cancelar-comanda-button"
                                                onClick={() => {
                                                    const confirmar = window.confirm(
                                                        `¿Cancelar la Comanda #${comanda.id}? El stock procesado será devuelto.`
                                                    );

                                                    if (confirmar) {
                                                        cancelarComanda(
                                                            comanda.id
                                                        );
                                                    }
                                                }}
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

        </div>
    );
}

export default Comandas;