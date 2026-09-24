import StatCard from "../components/StatCard";
import PendingOrders from "../components/PendingOrders";
import { useCafeteria } from "../context/CafeteriaContext";

function Dashboard() {
    const {
        mesas,
        comandas,
        productos,
        materiasPrimas
    } = useCafeteria();

    const mesasOcupadas = mesas.filter(
        (mesa) => mesa.estado === "ocupada"
    ).length;

    const comandasPendientes = comandas.filter(
        (comanda) => comanda.estado !== "lista" && comanda.estado !== "finalizada"
    ).length;

    const hoy = new Date();
    const comandasListasHoy = comandas.filter((comanda) => {
        const fechaComanda = new Date(comanda.fechaCreacion);

        return (
            comanda.estado === "finalizada" &&
            fechaComanda.getFullYear() === hoy.getFullYear() &&
            fechaComanda.getMonth() === hoy.getMonth() &&
            fechaComanda.getDate() === hoy.getDate()
        );
    }).length;

    const productosStockBajo = productos.filter(
        (producto) =>
            producto.activo &&
            producto.tipoElaboracion === "preelaborado" &&
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