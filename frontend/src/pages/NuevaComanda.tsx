import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ModalConfirmacion from "../components/ModalConfirmacion";
import { useComandas } from "../context/useComandas";
import { useCatalogo } from "../context/useCatalogo";
import { formatearPrecio } from "../validaciones";
import { useToast } from "../context/useToast";

interface DialogoComanda {
    titulo: string;
    mensaje: string;
    textoConfirmar: string;
    confirmar: () => void;
    cancelar?: () => void;
    textoCancelar?: string;
    destructivo?: boolean;
}

function NuevaComanda() {
    const { mostrarToast } = useToast();
    const [cantidades, setCantidades] =
        useState<Record<number, number>>({});
    const [cantidadesIniciales, setCantidadesIniciales] =
        useState<Record<number, number>>({});
    const [dialogo, setDialogo] = useState<DialogoComanda | null>(null);

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const mesaId = Number(
        searchParams.get("mesaId") ?? searchParams.get("mesa")
    );
    const esTakeAway = searchParams.get("tipo") === "take-away";
    const rutaVolver = "/mesas";
    const [nombreCliente, setNombreCliente] = useState("");
    const [telefonoCliente, setTelefonoCliente] = useState("");
    const [horaRetiro, setHoraRetiro] = useState(() => {
        const fecha = new Date(Date.now() + 30 * 60 * 1000);
        fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
        return fecha.toISOString().slice(0, 16);
    });
    const [fechaMinimaRetiro] = useState(() => {
        const fecha = new Date();
        fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset());
        return fecha.toISOString().slice(0, 16);
    });
    const [errorTakeAway, setErrorTakeAway] = useState("");
    const idComandaEditar = searchParams.get("editar");
    const modoEditar = idComandaEditar !== null;

    const {
        crearComanda,
        editarComanda,
        comandas,
        mesas,
        productos
    } = useComandas();
    const { recetas, materiasPrimas } = useCatalogo();

    useEffect(() => {
        if (!modoEditar || !idComandaEditar) {
            return;
        }

        const comanda = comandas.find(
            (item) => item.id === Number(idComandaEditar)
        );

        if (!comanda) {
            return;
        }

        const cantidadesIniciales: Record<number, number> = {};

        comanda.productos.forEach((producto) => {
            cantidadesIniciales[producto.productoId] = producto.cantidad;
        });

        setCantidades(cantidadesIniciales);
        setCantidadesIniciales(cantidadesIniciales);
    }, [modoEditar, idComandaEditar, comandas]);

    const hayCambiosSinGuardar = Array.from(new Set([
        ...Object.keys(cantidades),
        ...Object.keys(cantidadesIniciales)
    ])).some((productoId) =>
        (cantidades[Number(productoId)] || 0) !==
        (cantidadesIniciales[Number(productoId)] || 0)
    );

    const solicitarSalida = (destino: string) => {
        if (hayCambiosSinGuardar || esTakeAway) {
            setDialogo({
                titulo: esTakeAway ? "¿Cancelar pedido take away?" : "¿Salir sin guardar?",
                mensaje: esTakeAway
                    ? "Se perderán los datos y productos cargados para este pedido."
                    : "Los productos seleccionados se perderán si sales de esta página.",
                textoConfirmar: esTakeAway ? "Sí, cancelar pedido" : "Salir y descartar",
                textoCancelar: esTakeAway ? "Seguir con el pedido" : "Seguir en la comanda",
                destructivo: true,
                confirmar: () => navigate(destino),
                cancelar: () => setDialogo(null)
            });
            return;
        }

        navigate(destino);
    };

    useEffect(() => {
        if (!hayCambiosSinGuardar) {
            return;
        }

        const interceptarEnlace = (event: MouseEvent) => {
            if (
                event.defaultPrevented ||
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
            ) {
                return;
            }

            const elemento = event.target;
            if (!(elemento instanceof Element)) {
                return;
            }

            const enlace = elemento.closest<HTMLAnchorElement>("a[href]");
            if (!enlace || enlace.target || enlace.hasAttribute("download")) {
                return;
            }

            const destino = new URL(enlace.href, window.location.href);
            if (destino.origin !== window.location.origin) {
                return;
            }

            const ruta = `${destino.pathname}${destino.search}${destino.hash}`;
            const rutaActual = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            if (ruta === rutaActual) {
                return;
            }

            event.preventDefault();
            event.stopImmediatePropagation();
            setDialogo({
                titulo: "¿Salir sin guardar?",
                mensaje: "Los productos seleccionados se perderán si sales de esta página.",
                textoConfirmar: "Salir y descartar",
                textoCancelar: "Seguir en la comanda",
                destructivo: true,
                confirmar: () => navigate(ruta),
                cancelar: () => setDialogo(null)
            });
        };

        document.addEventListener("click", interceptarEnlace, true);
        return () => document.removeEventListener("click", interceptarEnlace, true);
    }, [hayCambiosSinGuardar, navigate]);

    useEffect(() => {
        if (!hayCambiosSinGuardar) {
            return;
        }

        const confirmarSalida = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };

        window.addEventListener("beforeunload", confirmarSalida);
        return () => window.removeEventListener("beforeunload", confirmarSalida);
    }, [hayCambiosSinGuardar]);

    const numeroMesa = mesas.find(
        (mesa) => mesa.id === mesaId
    )?.numero ?? mesaId;

    const agregarProducto = (productoId: number) => {
        setCantidades((actuales) => ({
            ...actuales,
            [productoId]: (actuales[productoId] || 0) + 1
        }));
    };

    const quitarProducto = (productoId: number) => {
        setCantidades((actuales) => {
            const nuevaCantidad =
                (actuales[productoId] || 0) - 1;

            if (nuevaCantidad <= 0) {
                const copia = { ...actuales };

                delete copia[productoId];

                return copia;
            }

            return {
                ...actuales,
                [productoId]: nuevaCantidad
            };
        });
    };

    const obtenerTotal = () => {
        return productos.reduce((total, producto) => {
            const cantidad =
                cantidades[producto.id] || 0;

            return total + producto.precio * cantidad;
        }, 0);
    };

    const puedeAgregarProducto = (
        productoId: number,
        cantidadSeleccionada: number
    ) => {
        const producto = productos.find(
            (item) => item.id === productoId
        );

        if (!producto) {
            return false;
        }

        const cantidadSolicitada = cantidadSeleccionada + 1;

        if (producto.tipoElaboracion !== "bajo_pedido") {
            return cantidadSolicitada <= producto.stockActual;
        }

        const cantidadesConProducto = {
            ...cantidades,
            [productoId]: cantidadSolicitada
        };

        const consumoPorMateriaPrima = new Map<number, number>();

        for (const [idProducto, cantidad] of Object.entries(
            cantidadesConProducto
        )) {
            const productoSeleccionado = productos.find(
                (item) => item.id === Number(idProducto)
            );

            if (!productoSeleccionado || cantidad <= 0) {
                continue;
            }

            if (productoSeleccionado.tipoElaboracion !== "bajo_pedido") {
                if (cantidad > productoSeleccionado.stockActual) {
                    return false;
                }
                continue;
            }

            const receta = recetas.find(
                (item) => item.productoId === Number(idProducto)
            );

            // Sin receta todavía no hay consumos que puedan validarse aquí.
            if (!receta || receta.ingredientes.length === 0) {
                return false;
            }

            for (const ingrediente of receta.ingredientes) {
                const cantidadActual =
                    consumoPorMateriaPrima.get(
                        ingrediente.materiaPrimaId
                    ) ?? 0;

                consumoPorMateriaPrima.set(
                    ingrediente.materiaPrimaId,
                    cantidadActual + ingrediente.cantidad * cantidad
                );
            }
        }

        return Array.from(consumoPorMateriaPrima.entries()).every(
            ([materiaPrimaId, cantidadNecesaria]) => {
                const materiaPrima = materiasPrimas.find(
                    (materia) => materia.id === materiaPrimaId
                );

                return Boolean(
                    materiaPrima?.activo &&
                    materiaPrima.stockActual >= cantidadNecesaria
                );
            }
        );
    };

    const obtenerMotivoProductoNoDisponible = (productoId: number) => {
        const producto = productos.find((item) => item.id === productoId);
        if (!producto) return "Producto no disponible.";

        if (producto.tipoElaboracion !== "bajo_pedido") {
            return `Stock insuficiente. Disponible: ${producto.stockActual} ${producto.unidadVenta}.`;
        }

        const receta = recetas.find((item) => item.productoId === productoId);
        if (!receta || receta.ingredientes.length === 0) {
            return "Falta una receta con ingredientes; no se puede agregar a la comanda.";
        }

        return "No alcanza el stock de ingredientes para preparar este producto.";
    };
    const guardarComanda = () => {
        if (!esTakeAway && !Number.isInteger(mesaId)) {
            return;
        }

        const productosComanda =
            Object.entries(cantidades).map(
                ([productoId, cantidad]) => ({
                    productoId: Number(productoId),
                    cantidad: cantidad,
                    estado: "pendiente" as const,
                    cantidadStockProcesada: 0
                })
            );

        if (modoEditar && idComandaEditar) {

            const resultado = editarComanda(
                Number(idComandaEditar),
                productosComanda
            );

            if (!resultado) {
                setDialogo({
                    titulo: "No se pudo editar la comanda",
                    mensaje: "Es posible que ya haya sido enviada a preparación.",
                    textoConfirmar: "Cerrar",
                    confirmar: () => setDialogo(null)
                });

                return;
            }

        } else {

            crearComanda(
                esTakeAway ? undefined : mesaId,
                productosComanda,
                esTakeAway
                    ? {
                          nombre: nombreCliente,
                          telefono: telefonoCliente,
                          horaRetiro: new Date(horaRetiro).toISOString()
                      }
                    : undefined
            );
        }

        mostrarToast(modoEditar
            ? "Comanda actualizada."
            : esTakeAway
                ? "Pedido take away creado correctamente."
                : "Comanda creada correctamente.");
        navigate(esTakeAway ? "/comandas" : "/mesas");
    };

    const confirmarComanda = () => {
        if (!esTakeAway && !Number.isInteger(mesaId)) {
            return;
        }

        if (esTakeAway && !nombreCliente.trim()) {
            setErrorTakeAway("Ingresá el nombre del cliente.");
            return;
        }
        if (esTakeAway && (!horaRetiro || new Date(horaRetiro).getTime() < Date.now())) {
            setErrorTakeAway("Elegí un horario de retiro actual o futuro.");
            return;
        }
        setErrorTakeAway("");

        setDialogo({
            titulo: modoEditar ? "Editar comanda" : esTakeAway ? "Crear pedido take away" : "Crear comanda",
            mensaje: modoEditar
                ? `¿Confirmás los cambios de la comanda para la Mesa ${numeroMesa}?`
                : esTakeAway
                    ? `¿Crear el pedido de ${nombreCliente.trim()} para retirar el ${new Date(horaRetiro).toLocaleString("es-AR")}?`
                    : `¿Crear la comanda para la Mesa ${numeroMesa}?`,
            textoConfirmar: modoEditar ? "Guardar cambios" : "Crear comanda",
            confirmar: guardarComanda,
            cancelar: () => setDialogo(null)
        });
    };

    return (
        <div className="dashboard-content">

            <div className="comanda-header">
                <div>
                    <h1>{esTakeAway ? "Nuevo pedido take away" : "Nueva comanda"}</h1>

                    <p>
                        {esTakeAway ? "Pedido para retirar en la cafetería" : `Mesa ${numeroMesa}`}
                    </p>
                </div>
            </div>

            {esTakeAway && (
                <section className="take-away-form" aria-labelledby="take-away-datos-titulo">
                    <h2 id="take-away-datos-titulo">Datos del retiro</h2>
                    <div className="take-away-form-fields">
                        <label>
                            Nombre del cliente
                            <input
                                type="text"
                                autoComplete="name"
                                value={nombreCliente}
                                onChange={(event) => setNombreCliente(event.target.value)}
                                required
                            />
                        </label>
                        <label>
                            Teléfono <span>(opcional)</span>
                            <input
                                type="tel"
                                autoComplete="tel"
                                value={telefonoCliente}
                                onChange={(event) => setTelefonoCliente(event.target.value)}
                            />
                        </label>
                        <label>
                            Fecha y hora de retiro
                            <input
                                type="datetime-local"
                                value={horaRetiro}
                                min={fechaMinimaRetiro}
                                onChange={(event) => setHoraRetiro(event.target.value)}
                                required
                            />
                        </label>
                    </div>
                    {errorTakeAway && <p className="take-away-error" role="alert">{errorTakeAway}</p>}
                </section>
            )}

            <div className="comanda-layout">

                <div className="productos-section">

                    <h2>Productos</h2>

                    <div className="productos-container">

                        {productos
                            .filter(
                                (producto) =>
                                    producto.activo
                            )
                            .map((producto) => {

                                const cantidad =
                                    cantidades[producto.id] || 0;

                                const puedeAgregar =
                                    puedeAgregarProducto(
                                        producto.id,
                                        cantidad
                                    );

                                return (
                                    <div
                                        key={producto.id}
                                        className="producto-card"
                                    >

                                        <div>

                                            <h3>
                                                {producto.nombre}
                                            </h3>

                                            <p>
                                                {producto.sector}
                                            </p>

                                            <strong>
                                                $
                                                {formatearPrecio(producto.precio)}
                                            </strong>

                                            {!puedeAgregar && (
                                                <small className="producto-no-disponible" role="status">
                                                    {obtenerMotivoProductoNoDisponible(producto.id)}
                                                </small>
                                            )}

                                        </div>

                                        <div className="producto-controls">

                                            {cantidad > 0 && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            quitarProducto(
                                                                producto.id
                                                            )
                                                        }
                                                    >
                                                        −
                                                    </button>

                                                    <span>
                                                        {cantidad}
                                                    </span>
                                                </>
                                            )}

                                            {puedeAgregar && (
                                                <button
                                                    onClick={() =>
                                                        agregarProducto(
                                                            producto.id
                                                        )
                                                    }
                                                >
                                                    +
                                                </button>
                                            )}

                                        </div>

                                    </div>
                                );
                            })}

                    </div>

                </div>

                <div className="comanda-resumen">

                    <h2>Resumen</h2>

                    {Object.keys(cantidades).length === 0 ? (

                        <p>
                            No hay productos seleccionados.
                        </p>

                    ) : (

                        productos.map((producto) => {

                            const cantidad =
                                cantidades[producto.id];

                            if (!cantidad) {
                                return null;
                            }

                            return (
                                <div
                                    key={producto.id}
                                    className="resumen-producto"
                                >

                                    <span>
                                        {cantidad} x{" "}
                                        {producto.nombre}
                                    </span>

                                    <strong>
                                        $
                                        {formatearPrecio(
                                            producto.precio * cantidad
                                        )}
                                    </strong>

                                </div>
                            );
                        })
                    )}

                    <div className="comanda-total">

                        <span>
                            Total
                        </span>

                        <strong>
                            $
                            {formatearPrecio(obtenerTotal())}
                        </strong>

                    </div>

                    <div className="comanda-actions">

                        <button
                            className="secondary-button cancelar-button"
                            onClick={() => solicitarSalida(rutaVolver)}
                        >
                            Cancelar
                        </button>

                        <button
                            className="primary-button confirmar-button"
                            disabled={
                                Object.keys(cantidades)
                                    .length === 0
                            }
                            onClick={confirmarComanda}
                        >
                            ✓ Confirmar comanda
                        </button>

                    </div>

                </div>

            </div>

            {dialogo && (
                <ModalConfirmacion
                    titulo={dialogo.titulo}
                    mensaje={dialogo.mensaje}
                    textoConfirmar={dialogo.textoConfirmar}
                    textoCancelar={dialogo.textoCancelar}
                    destructivo={dialogo.destructivo}
                    cerrar={() => setDialogo(null)}
                    cancelar={dialogo.cancelar}
                    confirmar={() => {
                        const accion = dialogo.confirmar;
                        setDialogo(null);
                        accion();
                    }}
                />
            )}

        </div>
    );
}

export default NuevaComanda;
