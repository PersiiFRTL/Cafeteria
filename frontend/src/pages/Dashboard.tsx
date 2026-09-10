import Sidebar from "../components/Sidebar";

function Dashboard() {
    return (
        <div className="dashboard">
            <Sidebar />

            <main className="main-content">
                <h1>Dashboard</h1>

                <p>
                    Bienvenido al sistema de gestión de la cafetería.
                </p>
            </main>
        </div>
    );
}

export default Dashboard;