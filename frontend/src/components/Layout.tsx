import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useCafeteria } from "../context/CafeteriaContext";

function Layout() {
    const { estadoDatos, errorDatos, recargarDatos } = useCafeteria();

    return (
        <div className="dashboard">

            <Sidebar />

            <main className="main-content">

                <Topbar />

                {estadoDatos === "cargando" ? (
                    <div className="estado-carga-inline" role="status" aria-live="polite">
                        Cargando los datos de la cafetería…
                    </div>
                ) : estadoDatos === "error" ? (
                    <section className="datos-error" role="alert">
                        <p>{errorDatos}</p>
                        <button type="button" className="primary-button" onClick={() => void recargarDatos()}>
                            Reintentar
                        </button>
                    </section>
                ) : (
                    <Outlet />
                )}

            </main>

        </div>
    );
}

export default Layout;
