function PendingOrders() {
    return (
        <section className="pending-orders">
            <div className="section-header">
                <h2>Comandas pendientes</h2>
                <button>Ver todas</button>
            </div>

            <div className="orders-table">

                <div className="order-row order-header">
                    <span>Mesa</span>
                    <span>Pedido</span>
                    <span>Sector</span>
                    <span>Estado</span>
                </div>

                <div className="order-row">
                    <span>Mesa 3</span>
                    <span>1 tostado</span>
                    <span>Cocina</span>
                    <span className="status preparing">
                        Preparando
                    </span>
                </div>

                <div className="order-row">
                    <span>Mesa 3</span>
                    <span>2 café con leche</span>
                    <span>Cafetería</span>
                    <span className="status pending">
                        Pendiente
                    </span>
                </div>

                <div className="order-row">
                    <span>Mesa 7</span>
                    <span>2 medialunas</span>
                    <span>Cocina</span>
                    <span className="status pending">
                        Pendiente
                    </span>
                </div>

            </div>
        </section>
    );
}

export default PendingOrders;