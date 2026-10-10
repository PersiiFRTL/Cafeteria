import StatCard from "../components/StatCard";
import PendingOrders from "../components/PendingOrders";
import { useDashboard } from "../context/useDashboard";
import { contarComandasFinalizadasDelDia } from "../domain/operacionesCafeteria";

function Dashboard() {
    const {
        mesas,
        comandas,
        productos,
        materiasPrimas
    } = useDashboard();

    const mesasOcupadas = mesas.filter(
        (mesa) => mesa.estado === "ocupada"
    ).length;

    const comandasPendientes = comandas.filter(
        (comanda) =>         
        comanda.estado === "pendiente" ||
        comanda.estado === "preparando"
    ).length;

    const comandasListasHoy = contarComandasFinalizadasDelDia(comandas, new Date());

    const productosStockBajo = productos.filter(
        (producto) =>
            producto.activo &&
            producto.tipoElaboracion !== "bajo_pedido" &&
            producto.stockActual <= producto.stockMinimo
    );

    const materiasPrimasStockBajo = materiasPrimas.filter(
        (materia) =>
            materia.activo &&
            materia.stockActual <= materia.stockMinimo
    );

    const cantidadStockBajo =
        productosStockBajo.length +
        materiasPrimasStockBajo.length;

    return (
        <div className="dashboard-content">

            <p>
                Bienvenido al sistema de gestión de la cafetería.
            </p>

            <div className="stats-container">

                <StatCard
                    titulo="Mesas ocupadas"
                    valor={String(mesasOcupadas)}
                    icono="🪑"
                />

                <StatCard
                    titulo="Comandas pendientes"
                    valor={String(comandasPendientes)}
                    icono="📋"
                />

                <StatCard
                    titulo="Comandas del día"
                    valor={String(comandasListasHoy)}
                    icono="✅"
                />

                <StatCard
                    titulo="Stock bajo"
                    valor={String(cantidadStockBajo)}
                    icono="📦"
                />

            </div>

            {cantidadStockBajo > 0 && (
                <section className="dashboard-stock-alerta">
                    <div className="section-header">
                        <h2>Elementos con stock bajo</h2>
                    </div>

                    <div className="dashboard-stock-lista">
                        {productosStockBajo.map((producto) => (
                            <div
                                className="dashboard-stock-item"
                                key={producto.id}
                            >
                                <strong>{producto.nombre}</strong>
                                <span>
                                    {producto.stockActual} {producto.unidadVenta}
                                    {" "}
                                    (mínimo: {producto.stockMinimo})
                                </span>
                            </div>
                        ))}

                        {materiasPrimasStockBajo.map((materia) => (
                            <div
                                className="dashboard-stock-item"
                                key={`materia-${materia.id}`}
                            >
                                <strong>{materia.nombre}</strong>
                                <span>
                                    {materia.stockActual} {materia.unidad}
                                    {" "}
                                    (mínimo: {materia.stockMinimo})
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <PendingOrders />

        </div>
    );
}

export default Dashboard;
