import StatCard from "../components/StatCard";
import PendingOrders from "../components/PendingOrders";

function Dashboard() {
    return (
        <div className="dashboard-content">

            <p>
                Bienvenido al sistema de gestión de la cafetería.
            </p>

            <div className="stats-container">

                <StatCard
                    titulo="Mesas ocupadas"
                    valor="5"
                    icono="🪑"
                />

                <StatCard
                    titulo="Comandas pendientes"
                    valor="8"
                    icono="📋"
                />

                <StatCard
                    titulo="Ventas del día"
                    valor="$125.000"
                    icono="💰"
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