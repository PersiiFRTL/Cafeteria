import { useState } from "react";

interface Mesa {
    numero: number;
    capacidad: number;
    estado: "libre" | "ocupada";
}

const mesas: Mesa[] = [    // provisorio 
    { numero: 1, capacidad: 4, estado: "libre" },
    { numero: 2, capacidad: 2, estado: "libre" },
    { numero: 3, capacidad: 4, estado: "ocupada" },
    { numero: 4, capacidad: 2, estado: "libre" },
    { numero: 5, capacidad: 4, estado: "libre" },
    { numero: 6, capacidad: 6, estado: "ocupada" },
    { numero: 7, capacidad: 4, estado: "libre" },
    { numero: 8, capacidad: 2, estado: "libre" },
];

function Mesas() {

    const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);

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
                        key={mesa.numero}
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

                                    <button className="primary-button">
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

                                        <button className="primary-button">
                                            📋 Ver comanda
                                        </button>

                                        <button className="secondary-button">
                                            ➕ Agregar productos
                                        </button>

                                        <button className="secondary-button">
                                            💰 Cobrar
                                        </button>

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