import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DragEvent, PointerEvent as ReactPointerEvent } from "react";

import {
    useCafeteria
} from "../context/CafeteriaContext";

import type {
    ElementoMapa
} from "../types/mapa";
import { useToast } from "../context/useToast";

type TipoHerramienta =
    | "mesa-2"
    | "mesa-4"
    | "mesa-6"
    | "mesa-8"
    | "linea";

type OrientacionLinea = "horizontal" | "vertical";

interface ArrastreMapa {
    elementoId: string;
    pointerId: number;
    offsetX: number;
    offsetY: number;
    x: number;
    y: number;
}

function MapaEditor() {
    const { mostrarToast } = useToast();

    const navigate = useNavigate();

    const {
        mesas,
        elementosMapa,
        agregarElementoMapa,
        editarElementoMapa,
        eliminarElementoMapa
    } = useCafeteria();

    const canvasRef = useRef<HTMLDivElement>(null);
    const [herramientaSeleccionada, setHerramientaSeleccionada] =
        useState<TipoHerramienta | null>(null);
    const [largoLinea, setLargoLinea] = useState(6);
    const [grosorLinea, setGrosorLinea] = useState(4);
    const [orientacionLinea, setOrientacionLinea] =
        useState<OrientacionLinea>("horizontal");
    const [arrastre, setArrastre] = useState<ArrastreMapa | null>(null);

    const obtenerMesaDisponible = (
        capacidad: number
    ) => {

        return mesas.find(
            (mesa) =>
                mesa.capacidad === capacidad &&
                !elementosMapa.some(
                    (elemento) =>
                        elemento.tipo === "mesa" &&
                        elemento.mesaId === mesa.id
                )
        );
    };

    const crearElemento = (
        herramienta: TipoHerramienta,
        x: number,
        y: number
    ) => {

        if (herramienta.startsWith("mesa-")) {

            const capacidad =
                Number(
                    herramienta.replace(
                        "mesa-",
                        ""
                    )
                );

            const mesaDisponible =
                obtenerMesaDisponible(
                    capacidad
                );

            const nuevoElemento: ElementoMapa = {
                id:
                    `mapa-${Date.now()}`,

                tipo: "mesa",

                x,
                y,

                ancho:
                    capacidad >= 6
                        ? 3
                        : 2,

                alto:
                    capacidad >= 6
                        ? 2
                        : 2,

                rotacion: 0,

                mesaId:
                    mesaDisponible?.id
            };

            agregarElementoMapa(
                nuevoElemento
            );
            mostrarToast(mesaDisponible
                ? "Mesa agregada al mapa."
                : "Mesa agregada sin asignar.");

            return;
        }

        agregarElementoMapa({
            id: `mapa-${Date.now()}`,
            tipo: "linea",
            x,
            y,
            ancho: largoLinea,
            alto: 1,
            rotacion: orientacionLinea === "vertical" ? 90 : 0,
            grosor: grosorLinea
        });
        mostrarToast("Línea agregada al mapa.");
    };

    const obtenerDimensionesHerramienta = (herramienta: TipoHerramienta) => {
        if (herramienta === "linea") {
            return orientacionLinea === "vertical"
                ? { ancho: grosorLinea, alto: largoLinea * 40 }
                : { ancho: largoLinea * 40, alto: grosorLinea };
        }

        const capacidad = Number(herramienta.replace("mesa-", ""));
        return {
            ancho: (capacidad >= 6 ? 3 : 2) * 40,
            alto: 2 * 40
        };
    };

    const obtenerPosicionEnCuadricula = (
        clientX: number,
        clientY: number,
        rect: DOMRect,
        ancho: number,
        alto: number
    ) => {
        const maxX = Math.max(0, rect.width - ancho);
        const maxY = Math.max(0, rect.height - alto);

        return {
            x: Math.min(
                Math.max(0, Math.round((clientX - rect.left) / 40) * 40),
                Math.floor(maxX / 40) * 40
            ),
            y: Math.min(
                Math.max(0, Math.round((clientY - rect.top) / 40) * 40),
                Math.floor(maxY / 40) * 40
            )
        };
    };

    const manejarInicioArrastreElemento = (
        e: ReactPointerEvent<HTMLDivElement>,
        elemento: ElementoMapa
    ) => {
        if ((e.target as HTMLElement).closest("button, input")) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = elemento.x;
        const y = elemento.y;

        canvas.setPointerCapture(e.pointerId);
        setArrastre({
            elementoId: elemento.id,
            pointerId: e.pointerId,
            offsetX: e.clientX - rect.left - x,
            offsetY: e.clientY - rect.top - y,
            x,
            y
        });
    };

    const obtenerDimensionesElemento = (elemento: ElementoMapa) => ({
        ancho: elemento.tipo === "linea" && elemento.rotacion === 90
            ? elemento.grosor ?? 4
            : elemento.ancho * 40,
        alto: elemento.tipo === "linea"
            ? elemento.rotacion === 90
                ? elemento.ancho * 40
                : elemento.grosor ?? 4
            : elemento.alto * 40
    });

    const ajustarCoordenada = (
        valor: number,
        maximo: number
    ) => Math.min(
        Math.max(0, Math.round(valor / 40) * 40),
        Math.floor(maximo / 40) * 40
    );

    const manejarMovimientoArrastre = (
        e: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (!arrastre || arrastre.pointerId !== e.pointerId) return;

        const canvas = canvasRef.current;
        const elemento = elementosMapa.find(
            (item) => item.id === arrastre.elementoId
        );
        if (!canvas || !elemento) return;

        const rect = canvas.getBoundingClientRect();
        const dimensiones = obtenerDimensionesElemento(elemento);
        const maxX = Math.max(0, rect.width - dimensiones.ancho);
        const maxY = Math.max(0, rect.height - dimensiones.alto);

        setArrastre({
            ...arrastre,
            x: ajustarCoordenada(
                e.clientX - rect.left - arrastre.offsetX,
                maxX
            ),
            y: ajustarCoordenada(
                e.clientY - rect.top - arrastre.offsetY,
                maxY
            )
        });
    };

    const terminarArrastre = (
        e: ReactPointerEvent<HTMLDivElement>
    ) => {
        if (!arrastre || arrastre.pointerId !== e.pointerId) return;

        const elemento = elementosMapa.find(
            (item) => item.id === arrastre.elementoId
        );
        if (elemento) {
            const canvas = canvasRef.current;
            const rect = canvas?.getBoundingClientRect();
            const dimensiones = obtenerDimensionesElemento(elemento);
            const maxX = Math.max(0, (rect?.width ?? 0) - dimensiones.ancho);
            const maxY = Math.max(0, (rect?.height ?? 0) - dimensiones.alto);
            const x = rect
                ? ajustarCoordenada(e.clientX - rect.left - arrastre.offsetX, maxX)
                : arrastre.x;
            const y = rect
                ? ajustarCoordenada(e.clientY - rect.top - arrastre.offsetY, maxY)
                : arrastre.y;

            editarElementoMapa({
                ...elemento,
                x,
                y
            });
            mostrarToast("Elemento reubicado.");
        }

        setArrastre(null);
    };

    const manejarDrop = (
        e: DragEvent<HTMLDivElement>
    ) => {

        e.preventDefault();

        const rect =
            e.currentTarget.getBoundingClientRect();

        const herramienta =
            e.dataTransfer.getData(
                "herramienta"
            ) as TipoHerramienta;

        if (!herramienta) {
            return;
        }

        const dimensiones = obtenerDimensionesHerramienta(herramienta);
        const posicion = obtenerPosicionEnCuadricula(
            e.clientX,
            e.clientY,
            rect,
            dimensiones.ancho,
            dimensiones.alto
        );

        crearElemento(
            herramienta,
            posicion.x,
            posicion.y
        );
    };

    const manejarDragOver = (
        e: DragEvent<HTMLDivElement>
    ) => {

        e.preventDefault();

        e.dataTransfer.dropEffect =
            e.dataTransfer.types.includes("herramienta")
                ? "copy"
                : "move";
    };

    const iniciarHerramienta = (
        e: DragEvent<HTMLButtonElement>,
        herramienta: TipoHerramienta
    ) => {

        e.dataTransfer.setData(
            "herramienta",
            herramienta
        );

        e.dataTransfer.effectAllowed =
            "copy";
    };

    const colocarHerramientaSeleccionada = (
        clientX: number,
        clientY: number,
        rect: DOMRect
    ) => {
        if (!herramientaSeleccionada) {
            return;
        }

        const dimensiones = obtenerDimensionesHerramienta(herramientaSeleccionada);
        const posicion = obtenerPosicionEnCuadricula(
            clientX,
            clientY,
            rect,
            dimensiones.ancho,
            dimensiones.alto
        );

        crearElemento(
            herramientaSeleccionada,
            posicion.x,
            posicion.y
        );
    };

    const obtenerNombreMesa = (
        elemento: ElementoMapa
    ) => {

        if (!elemento.mesaId) {
            return "Mesa sin asignar";
        }

        const mesa =
            mesas.find(
                (item) =>
                    item.id ===
                    elemento.mesaId
            );

        if (!mesa) {
            return "Mesa sin asignar";
        }

        return `Mesa ${mesa.numero}`;
    };

    return (
        <div className="mapa-editor">

            <div className="mapa-toolbar">

                <div className="mapa-toolbar-header">
                    <h2>
                        🗺️ Diseño del local
                    </h2>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => navigate("/mesas")}
                    >
                        ← Volver a Mesas
                    </button>
                </div>

                <p className="mapa-toolbar-text">
                    Arrastrá los elementos
                    al área de diseño.
                </p>

                <div className="mapa-herramientas">

                    <button
                        draggable
                        aria-pressed={herramientaSeleccionada === "mesa-2"}
                        onClick={() => setHerramientaSeleccionada(
                            herramientaSeleccionada === "mesa-2" ? null : "mesa-2"
                        )}
                        onDragStart={(e) =>
                            iniciarHerramienta(
                                e,
                                "mesa-2"
                            )
                        }
                        className={`mapa-tool mesa-tool ${herramientaSeleccionada === "mesa-2" ? "selected" : ""}`}
                    >
                        🪑 Mesa 2
                    </button>

                    <button
                        draggable
                        aria-pressed={herramientaSeleccionada === "mesa-4"}
                        onClick={() => setHerramientaSeleccionada(
                            herramientaSeleccionada === "mesa-4" ? null : "mesa-4"
                        )}
                        onDragStart={(e) =>
                            iniciarHerramienta(
                                e,
                                "mesa-4"
                            )
                        }
                        className={`mapa-tool mesa-tool ${herramientaSeleccionada === "mesa-4" ? "selected" : ""}`}
                    >
                        🪑 Mesa 4
                    </button>

                    <button
                        draggable
                        aria-pressed={herramientaSeleccionada === "mesa-6"}
                        onClick={() => setHerramientaSeleccionada(
                            herramientaSeleccionada === "mesa-6" ? null : "mesa-6"
                        )}
                        onDragStart={(e) =>
                            iniciarHerramienta(
                                e,
                                "mesa-6"
                            )
                        }
                        className={`mapa-tool mesa-tool ${herramientaSeleccionada === "mesa-6" ? "selected" : ""}`}
                    >
                        🪑 Mesa 6
                    </button>

                    <button
                        draggable
                        aria-pressed={herramientaSeleccionada === "mesa-8"}
                        onClick={() => setHerramientaSeleccionada(
                            herramientaSeleccionada === "mesa-8" ? null : "mesa-8"
                        )}
                        onDragStart={(e) =>
                            iniciarHerramienta(
                                e,
                                "mesa-8"
                            )
                        }
                        className={`mapa-tool mesa-tool ${herramientaSeleccionada === "mesa-8" ? "selected" : ""}`}
                    >
                        🪑 Mesa 8
                    </button>

                    <button
                        draggable
                        aria-pressed={herramientaSeleccionada === "linea"}
                        onClick={() => setHerramientaSeleccionada(
                            herramientaSeleccionada === "linea" ? null : "linea"
                        )}
                        onDragStart={(e) =>
                            iniciarHerramienta(
                                e,
                                "linea"
                            )
                        }
                        className={`mapa-tool linea-tool ${herramientaSeleccionada === "linea" ? "selected" : ""}`}
                    >
                        {orientacionLinea === "vertical" ? "┃" : "━"} Línea
                    </button>

                </div>

                <div className="mapa-ajustes">
                    <div className="mapa-orientacion" role="group" aria-label="Orientación de línea">
                        <span>Orientación</span>
                        <div>
                            <button
                                type="button"
                                aria-pressed={orientacionLinea === "horizontal"}
                                className={orientacionLinea === "horizontal" ? "selected" : ""}
                                onClick={() => setOrientacionLinea("horizontal")}
                            >
                                Horizontal
                            </button>
                            <button
                                type="button"
                                aria-pressed={orientacionLinea === "vertical"}
                                className={orientacionLinea === "vertical" ? "selected" : ""}
                                onClick={() => setOrientacionLinea("vertical")}
                            >
                                Vertical
                            </button>
                        </div>
                    </div>
                    <label className="mapa-ajuste">
                        Largo de línea (cuadrículas)
                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={largoLinea}
                            onChange={(e) => setLargoLinea(
                                Math.min(30, Math.max(1, Number(e.target.value) || 1))
                            )}
                        />
                    </label>
                    <label className="mapa-ajuste">
                        Grosor (px)
                        <input
                            type="number"
                            min="2"
                            max="16"
                            value={grosorLinea}
                            onChange={(e) => setGrosorLinea(
                                Math.min(16, Math.max(2, Number(e.target.value) || 2))
                            )}
                        />
                    </label>
                </div>

            </div>


            <div
                ref={canvasRef}
                className={`mapa-canvas ${herramientaSeleccionada ? "placing" : ""}`}
                onDragOver={manejarDragOver}
                onDrop={manejarDrop}
                onPointerMove={manejarMovimientoArrastre}
                onPointerUp={terminarArrastre}
                onPointerCancel={() => setArrastre(null)}
                onClick={(e) => {
                    if (e.target !== e.currentTarget) {
                        return;
                    }

                    colocarHerramientaSeleccionada(
                        e.clientX,
                        e.clientY,
                        e.currentTarget.getBoundingClientRect()
                    );
                }}
            >

                {elementosMapa.map(
                    (elemento) => {

                        const mesa =
                            elemento.mesaId
                                ? mesas.find(
                                    (item) =>
                                        item.id ===
                                        elemento.mesaId
                                )
                                : undefined;

                        const capacidad =
                            mesa?.capacidad;
                        const posicion = arrastre?.elementoId === elemento.id
                            ? arrastre
                            : elemento;
                        const esLinea = elemento.tipo === "linea";

                        return (
                            <div
                                key={
                                    elemento.id
                                }
                                onPointerDown={(e) => manejarInicioArrastreElemento(e, elemento)}
                                onClick={(e) => e.stopPropagation()}
                                className={
                                    elemento.tipo ===
                                    "mesa"
                                        ? "mapa-elemento mapa-mesa"
                                        : `mapa-elemento mapa-linea ${arrastre?.elementoId === elemento.id ? "dragging" : ""}`
                                }
                                aria-label={elemento.tipo === "linea"
                                    ? `Línea ${elemento.rotacion === 90 ? "vertical" : "horizontal"} de ${elemento.ancho} cuadrículas y ${elemento.grosor ?? 4} píxeles de grosor`
                                    : obtenerNombreMesa(elemento)}
                                style={{
                                    left:
                                        posicion.x,
                                    top:
                                        posicion.y,
                                    width:
                                        esLinea && elemento.rotacion === 90
                                            ? elemento.grosor ?? 4
                                            : elemento.ancho * 40,
                                    height:
                                        esLinea
                                            ? elemento.rotacion === 90
                                                ? elemento.ancho * 40
                                                : elemento.grosor ?? 4
                                            : elemento.alto * 40,
                                    transform:
                                        esLinea
                                            ? "none"
                                            : `rotate(${elemento.rotacion}deg)`
                                }}
                            >

                                {elemento.tipo ===
                                "mesa" ? (
                                    <>
                                        <strong>
                                            {elemento.mesaId
                                                ? obtenerNombreMesa(
                                                    elemento
                                                )
                                                : `Mesa ${capacidad ?? "8"}`}
                                        </strong>

                                        <span>
                                            {capacidad
                                                ? `${capacidad} personas`
                                                : "8 personas"}
                                        </span>
                                    </>
                                ) : null}

                                <button
                                    className="mapa-eliminar"
                                    aria-label="Eliminar elemento"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();

                                        eliminarElementoMapa(
                                            elemento.id
                                        );
                                        mostrarToast("Elemento eliminado del mapa.");
                                    }}
                                >
                                    ×
                                </button>

                            </div>
                        );
                    }
                )}

            </div>

        </div>
    );
}

export default MapaEditor;