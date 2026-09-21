import StatCard from "../components/StatCard";
import PendingOrders from "../components/PendingOrders";
import { useCafeteria } from "../context/CafeteriaContext";

function Dashboard() {
    const { mesas, comandas } = useCafeteria();

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
            comanda.estado === "lista" &&
            fechaComanda.getFullYear() === hoy.getFullYear() &&
            fechaComanda.getMonth() === hoy.getMonth() &&
            fechaComanda.getDate() === hoy.getDate()
        );
    }).length;

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
                    titulo="Ventas del día"
                    valor={String(comandasListasHoy)}
                    icono="✅"
                />

                <StatCard
                    titulo="Stock bajo"
                    valor="3"
                    icono="📦"
                />

            </div>

            <PendingOrders />

        </div>
    );
}

export default Dashboard;