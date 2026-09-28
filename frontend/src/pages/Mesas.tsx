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
        elementosMapa,
        obtenerComandaDeMesa,
        cancelarComanda
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

            {elementosMapa.length === 0 ? (

                <div className="mesas-sin-mapa">

                    <h2>
                        🗺️ El mapa todavía no está configurado
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
                                        style={{
                                            left: elemento.x,
                                            top: elemento.y,
                                            width: elemento.ancho * 40,
                                            height: elemento.grosor ?? 4,
                                            transform:
                                                `rotate(${elemento.rotacion}deg)`
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
                                            width: elemento.ancho * 40,
                                            height: elemento.alto * 40,
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
                                    style={{
                                        left: elemento.x,
                                        top: elemento.y,
                                        width: elemento.ancho * 40,
                                        height: elemento.alto * 40,
                                        transform:
                                            `rotate(${elemento.rotacion}deg)`
                                    }}
                                    onClick={() =>
                                        seleccionarMesa(mesa)
                                    }
                                >

                                    <strong>
                                        Mesa {mesa.numero}
                                    </strong>

                                    <span>
                                        👥 {mesa.capacidad}
                                    </span>

                                    <small>
                                        {mesa.estado === "libre"
                                            ? "🟢 Libre"
                                            : "🔴 Ocupada"
                                        }
                                    </small>

                                </div>
                            );

                        })}

                    </div>

                </div>

            )}

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

                                                const comanda =
                                                    obtenerComandaDeMesa(
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

                                                        const confirmar =
                                                            window.confirm(
                                                                `¿Cancelar la comanda y liberar la Mesa ${mesaSeleccionada.numero}? El stock procesado será devuelto.`
                                                            );

                                                        if (confirmar) {

                                                            cancelarComanda(
                                                                comanda.id
                                                            );

                                                            cerrarPanel();

                                                        }

                                                    }}
                                                >
                                                    ✕ Cancelar comanda y liberar mesa
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