import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCafeteria } from "../context/CafeteriaContext";

interface Mesa {
    id: number;
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

function Mesas() {

    const navigate = useNavigate();

    const {
        mesas,
        obtenerComandaDeMesa,
        finalizarComanda
    } = useCafeteria();

    const [mesaSeleccionada, setMesaSeleccionada] =
        useState<Mesa | null>(null);

    const seleccionarMesa = (mesa: Mesa) => {
        setMesaSeleccionada(mesa);
    };

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

                </div>

            </div>

            <div className="mesas-container">

                {mesas.map((mesa) => (

                    <div
                        key={mesa.id}
                        className={`mesa-card ${mesa.estado}`}
                        onClick={() => seleccionarMesa(mesa)}
                    >

                        <div className="mesa-numero">
                            Mesa {mesa.numero}
                        </div>

                        <div className="mesa-capacidad">
                            👥 {mesa.capacidad} personas
                        </div>

                        <div className="mesa-estado">

                            {mesa.estado === "libre"
                                ? "🟢 Libre"
                                : "🔴 Ocupada"
                            }

                        </div>

                    </div>

                ))}

            </div>

            {mesaSeleccionada && (

                <div className="mesa-panel">

                    <div className="mesa-panel-content">

                        <div className="mesa-panel-header">

                            <div>

                                <h2>
                                    Mesa {mesaSeleccionada.numero}
                                </h2>

                                <p>
                                    👥 {mesaSeleccionada.capacidad} personas
                                </p>

                            </div>

                            <button
                                className="close-button"
                                onClick={cerrarPanel}
                            >
                                ✕
                            </button>

                        </div>

                        <div className="mesa-panel-body">

                            {mesaSeleccionada.estado === "libre" ? (

                                <>
                                    <div className="mesa-panel-status libre">
                                        🟢 Mesa libre
                                    </div>

                                    <p>
                                        Esta mesa no tiene una comanda activa.
                                    </p>

                                    <button
                                        className="primary-button"
                                        onClick={() =>
                                            navigate(
                                                `/nueva-comanda?mesa=${mesaSeleccionada.numero}`
                                            )
                                        }
                                    >
                                        📋 Generar comanda
                                    </button>
                                </>

                            ) : (

                                <>
                                    <div className="mesa-panel-status ocupada">
                                        🔴 Mesa ocupada
                                    </div>

                                    <p>
                                        Esta mesa tiene una comanda activa.
                                    </p>

                                    <div className="mesa-actions">

                                        <button
                                            className="primary-button"
                                            onClick={() => {
                                                const comanda = obtenerComandaDeMesa(
                                                    mesaSeleccionada.id
                                                );

                                                if (comanda) {
                                                    navigate(
                                                        `/comandas?comanda=${comanda.id}`
                                                    );
                                                }
                                            }}
                                        >
                                            📋 Ver comanda
                                        </button>

                                        <button
                                            className="secondary-button"
                                            onClick={() =>
                                                navigate(
                                                    `/nueva-comanda?mesa=${mesaSeleccionada.numero}&agregar=true`
                                                )
                                            }
                                        >
                                            ➕ Agregar productos
                                        </button>

                                        {(() => {
                                            const comanda =
                                                obtenerComandaDeMesa(
                                                    mesaSeleccionada.id
                                                );

                                            if (!comanda) {
                                                return null;
                                            }

                                            return (
                                                <button
                                                    className="secondary-button"
                                                    onClick={() => {
                                                        const confirmar = window.confirm(
                                                            `¿Dejar disponible la Mesa ${mesaSeleccionada.numero}?`
                                                        );

                                                        if (confirmar) {
                                                            finalizarComanda(
                                                                comanda.id
                                                            );
                                                            cerrarPanel();
                                                        }
                                                    }}
                                                >
                                                    ✓ Dejar mesa disponible
                                                </button>
                                            );
                                        })()}

                                    </div>

                                </>

                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}

export default Mesas;