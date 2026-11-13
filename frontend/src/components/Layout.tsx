import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useCafeteria } from "../context/CafeteriaContext";
import SkeletonPagina from "./SkeletonPagina";

function Layout() {
    const { estadoDatos, errorDatos, recargarDatos } = useCafeteria();
    const location = useLocation();

    useEffect(() => {
        const manejarAtajo = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                const elemento = event.target;
                if (elemento instanceof Element && elemento.closest(".sistema-modal")) return;

                const cierre = document.querySelector<HTMLButtonElement>("[data-shortcut-close]");
                if (cierre) {
                    event.preventDefault();
                    cierre.click();
                    return;
                }

                if (location.pathname === "/nueva-comanda") {
                    const cancelar = document.querySelector<HTMLButtonElement>(".cancelar-button");
                    if (cancelar) {
                        event.preventDefault();
                        cancelar.click();
                    }
                }
                return;
            }

            if (event.key === "Enter" && !event.repeat) {
                const objetivo = event.target;
                if (objetivo instanceof Element && objetivo.closest(".sistema-modal")) {
                    const botonConfirmar = document.querySelector<HTMLButtonElement>(
                        ".sistema-modal [data-shortcut-enter]:not([disabled])"
                    );
                    if (botonConfirmar && !(objetivo instanceof HTMLButtonElement)) {
                        event.preventDefault();
                        botonConfirmar.click();
                    }
                    return;
                }

                if (location.pathname === "/nueva-comanda" ||
                    (objetivo instanceof Element && objetivo.closest("button, a, textarea, select, [contenteditable='true']"))) return;

                const formulario = objetivo instanceof Element
                    ? objetivo.closest<HTMLElement>("[data-shortcut-form]")
                    : null;
                const botonFormulario = formulario?.querySelector<HTMLButtonElement>("[data-shortcut-enter]:not([disabled])");
                if (botonFormulario) {
                    event.preventDefault();
                    botonFormulario.click();
                }
                return;
            }

        };

        window.addEventListener("keydown", manejarAtajo);
        return () => window.removeEventListener("keydown", manejarAtajo);
    }, [location.pathname]);

    return (
        <div className="dashboard">

            <Sidebar />

            <main className="main-content">

                <Topbar />

                {estadoDatos === "cargando" ? (
                    <SkeletonPagina ruta={location.pathname} />
                ) : estadoDatos === "error" ? (
                    <section className="datos-error" role="alert">
                        <p>{errorDatos}</p>
                        <button type="button" className="primary-button" onClick={() => void recargarDatos()}>
                            Reintentar
                        </button>
                    </section>
                ) : (
                    <Suspense fallback={<div className="estado-carga-inline" role="status" aria-live="polite">Abriendo la pestaña…</div>}>
                        <Outlet />
                    </Suspense>
                )}

            </main>

        </div>
    );
}

export default Layout;
