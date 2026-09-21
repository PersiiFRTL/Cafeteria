import { useNavigate } from "react-router-dom";
import { useCafeteria } from "../context/CafeteriaContext";

function PendingOrders() {
    const navigate = useNavigate();
    const { comandas, productos } = useCafeteria();

    const comandasPendientes = comandas.filter(
        (comanda) => comanda.estado !== "lista" && comanda.estado !== "finalizada"
    );

    return (
        <section className="pending-orders">
            <div className="section-header">
                <h2>Comandas pendientes</h2>
                <button onClick={() => navigate("/comandas")}>Ver todas</button>
            </div>

            <div className="orders-table">

                <div className="order-row order-header">
                    <span>Mesa</span>
                    <span>Pedido</span>
                    <span>Sector</span>
                    <span>Estado</span>
                </div>

                {comandasPendientes.map((comanda) => {
                    const productosComanda = comanda.productos.map((item) => {
                        const producto = productos.find(
                            (producto) => producto.id === item.productoId
                        );

                        return {
                            item,
                            producto
                        };
                    });

                    return productosComanda.map(({ item, producto }) => (
                        <div
                            className="order-row"
                            key={`${comanda.id}-${item.productoId}`}
                        >
                            <span>Mesa {comanda.mesaId}</span>
                            <span>
                                {item.cantidad} {producto?.nombre ?? "Producto"}
                            </span>
                            <span>{producto?.sector ?? "-"}</span>
                            <span
                                className={`status ${item.estado === "preparando" ? "preparing" : "pending"}`}
                            >
                                {item.estado === "preparando" ? "Preparando" : "Pendiente"}
                            </span>
                        </div>
                    ));
                })}

                {comandasPendientes.length === 0 && (
                    <div className="order-row">
                        <span>No hay comandas pendientes</span>
                    </div>
                )}

            </div>
        </section>
    );
}

export default PendingOrders;