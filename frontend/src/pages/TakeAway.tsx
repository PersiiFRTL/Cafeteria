import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useComandas } from "../context/useComandas";
import { useToast } from "../context/useToast";
import ModalConfirmacion from "../components/ModalConfirmacion";

const etiquetaEstado = {
    pendiente: "Pendiente",
    preparando: "En preparación",
    lista: "Lista para retirar",
    finalizada: "Retirada",
    cancelada: "Cancelada"
} as const;

const fechaLegible = (fecha?: string) => {
    if (!fecha) return "Sin horario acordado";
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime())
        ? "Horario inválido"
        : new Intl.DateTimeFormat("es-AR", {
              dateStyle: "medium",
              timeStyle: "short"
          }).format(valor);
};

function TakeAway() {
    const navigate = useNavigate();
    const { mostrarToast } = useToast();
    const { comandas, productos, finalizarComanda, cancelarComanda } = useComandas();
    const [confirmacion, setConfirmacion] = useState<{
        id: number;
        accion: "retirar" | "cancelar";
    } | null>(null);

    const pedidos = useMemo(
        () => comandas
            .filter((comanda) => comanda.tipoAtencion === "take-away")
            .sort((a, b) =>
                (a.horaRetiro ?? a.fechaCreacion).localeCompare(
                    b.horaRetiro ?? b.fechaCreacion
                )
            ),
        [comandas]
    );

    const ejecutarConfirmacion = () => {
        if (!confirmacion) return;
        const { id, accion } = confirmacion;
        setConfirmacion(null);
        if (accion === "retirar") {
            finalizarComanda(id);
            mostrarToast("Pedido marcado como retirado.");
        } else {
            cancelarComanda(id);
            mostrarToast("Pedido take away cancelado.");
            navigate("/mesas");
        }
    };

    const pedidoConfirmado = confirmacion
        ? pedidos.find((pedido) => pedido.id === confirmacion.id)
        : undefined;

    return (
        <div className="dashboard-content take-away-page">
            <div className="take-away-header">
                <div>
                    <h1>Take away</h1>
                    <p>Pedidos para retirar en la cafetería.</p>
                </div>
                <button
                    type="button"
                    className="primary-button"
                    onClick={() => navigate("/nueva-comanda?tipo=take-away")}
                >
                    + Nuevo pedido take away
                </button>
            </div>

            {pedidos.length === 0 ? (
                <div className="take-away-empty" role="status" aria-live="polite">
                    <h2>Todavía no hay pedidos take away</h2>
                    <p>Los nuevos pedidos para retirar aparecerán aquí.</p>
                </div>
            ) : (
                <div className="take-away-list">
                    {pedidos.map((pedido) => {
                        const total = pedido.productos.reduce((suma, linea) => {
                            const producto = productos.find((item) => item.id === linea.productoId);
                            return suma + (producto?.precio ?? 0) * linea.cantidad;
                        }, 0);

                        return (
                            <article key={pedido.id} className={`take-away-card estado-${pedido.estado}`}>
                                <header className="take-away-card-header">
                                    <div>
                                        <h2>Pedido #{pedido.id} · {pedido.clienteTakeAway?.nombre || "Cliente"}</h2>
                                        <p>{pedido.clienteTakeAway?.telefono || "Sin teléfono"}</p>
                                    </div>
                                    <span className={`comanda-estado ${pedido.estado}`}>
                                        {etiquetaEstado[pedido.estado]}
                                    </span>
                                </header>

                                <p className="take-away-hora">
                                    <strong>Retiro:</strong> {fechaLegible(pedido.horaRetiro)}
                                </p>

                                <ul className="take-away-productos">
                                    {pedido.productos.map((linea) => {
                                        const producto = productos.find((item) => item.id === linea.productoId);
                                        return (
                                            <li key={linea.productoId}>
                                                <span>{linea.cantidad} × {producto?.nombre ?? "Producto"}</span>
                                                <span>{producto?.sector ?? ""}</span>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <footer className="take-away-card-footer">
                                    <strong>Total del pedido: ${total.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</strong>
                                    <div>
                                        {pedido.estado === "lista" && (
                                            <button type="button" className="primary-button" onClick={() => setConfirmacion({ id: pedido.id, accion: "retirar" })}>
                                                Marcar retirado
                                            </button>
                                        )}
                                        {pedido.estado !== "finalizada" && pedido.estado !== "cancelada" && (
                                            <button type="button" className="secondary-button" onClick={() => setConfirmacion({ id: pedido.id, accion: "cancelar" })}>
                                                Cancelar pedido
                                            </button>
                                        )}
                                    </div>
                                </footer>
                            </article>
                        );
                    })}
                </div>
            )}

            {confirmacion && pedidoConfirmado && (
                <ModalConfirmacion
                    titulo={confirmacion.accion === "retirar" ? "Confirmar retiro" : "Cancelar pedido"}
                    mensaje={confirmacion.accion === "retirar"
                        ? `¿Confirmás que se retiró el pedido #${pedidoConfirmado.id}?`
                        : `¿Cancelar el pedido #${pedidoConfirmado.id}? Si ya se procesó stock, se devolverá.`}
                    textoConfirmar={confirmacion.accion === "retirar" ? "Marcar retirado" : "Cancelar pedido"}
                    textoCancelar="Volver"
                    destructivo={confirmacion.accion === "cancelar"}
                    cerrar={() => setConfirmacion(null)}
                    cancelar={() => setConfirmacion(null)}
                    confirmar={ejecutarConfirmacion}
                />
            )}
        </div>
    );
}

export default TakeAway;
