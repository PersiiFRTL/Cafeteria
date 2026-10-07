import { useEffect, useState } from "react";
import { useInformes } from "../context/useInformes";

const INFORMES_PERIODO_KEY = "cafeteria-informes-periodo";

function Informes() {

    const {
        comandas,
        productos,
        materiasPrimas,
        movimientosStock
    } = useInformes();

    const [periodo, setPeriodo] = useState<
    "hoy" | "7dias" | "30dias" | "todo" | "rango"
    >(() => {
        const valorGuardado = localStorage.getItem(INFORMES_PERIODO_KEY) as
            | "hoy"
            | "7dias"
            | "30dias"
            | "todo"
            | "rango"
            | null;
        return valorGuardado === "hoy" || valorGuardado === "7dias" || valorGuardado === "30dias" || valorGuardado === "rango" || valorGuardado === "todo"
            ? valorGuardado
            : "todo";
    });
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    useEffect(() => {
        localStorage.setItem(INFORMES_PERIODO_KEY, periodo);
    }, [periodo]);

    const ahora = new Date();

const inicioPeriodo = new Date(ahora);

if (periodo === "hoy") {
    inicioPeriodo.setHours(0, 0, 0, 0);
}

if (periodo === "7dias") {
    inicioPeriodo.setDate(
        ahora.getDate() - 7
    );
}

if (periodo === "30dias") {
    inicioPeriodo.setDate(
        ahora.getDate() - 30
    );
}

const fechaInicioRango = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
const fechaFinRango = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`) : null;
const dentroDelPeriodo = (valor: string) => {
    const fecha = new Date(valor);
    if (periodo === "todo") return true;
    if (periodo === "rango") {
        return (!fechaInicioRango || fecha >= fechaInicioRango) &&
            (!fechaFinRango || fecha <= fechaFinRango);
    }
    return fecha >= inicioPeriodo;
};

const comandasFiltradas = comandas.filter((comanda) => dentroDelPeriodo(comanda.fechaCreacion));

    const comandasFinalizadas =
    comandasFiltradas.filter(
        (comanda) =>
            comanda.estado === "finalizada"
    ).length;

    const comandasCanceladas =
        comandasFiltradas.filter(
            (comanda) =>
                comanda.estado === "cancelada"
        ).length;

    const comandasPendientes =
        comandasFiltradas.filter(
            (comanda) =>
                comanda.estado === "pendiente"
        ).length;

    const comandasPreparando =
        comandasFiltradas.filter(
            (comanda) =>
                comanda.estado === "preparando"
        ).length;

    const comandasListas =
        comandasFiltradas.filter(
            (comanda) =>
                comanda.estado === "lista"
        ).length;

    const productosSolicitados = new Map<
        number,
        number
    >();

    comandasFiltradas.forEach((comanda) => {

        comanda.productos.forEach((item) => {

            const cantidadActual =
                productosSolicitados.get(
                    item.productoId
                ) ?? 0;

            productosSolicitados.set(
                item.productoId,
                cantidadActual + item.cantidad
            );

        });

    });

    const productosMasSolicitados = Array.from(
        productosSolicitados.entries()
    )
        .map(([productoId, cantidad]) => {

            const producto =
                productos.find(
                    (item) =>
                        item.id === productoId
                );

            return {
                nombre:
                    producto?.nombre ??
                    "Producto desconocido",
                cantidad
            };

        })
        .sort(
            (a, b) =>
                b.cantidad - a.cantidad
        );

const movimientosFiltrados = movimientosStock.filter((movimiento) => dentroDelPeriodo(movimiento.fecha));

    const movimientosPorTipo = {
        entrada: movimientosFiltrados.filter(
            (movimiento) =>
                movimiento.tipo === "entrada"
        ).length,

        salida: movimientosFiltrados.filter(
            (movimiento) =>
                movimiento.tipo === "salida"
        ).length,

        consumo: movimientosFiltrados.filter(
            (movimiento) =>
                movimiento.tipo === "consumo"
        ).length,

        produccion: movimientosFiltrados.filter(
            (movimiento) =>
                movimiento.tipo === "produccion"
        ).length,

        ajuste: movimientosFiltrados.filter(
            (movimiento) =>
                movimiento.tipo === "ajuste"
        ).length
    };

    const materiasPrimasConStockBajo =
        materiasPrimas.filter(
            (materia) =>
                materia.activo &&
                materia.stockActual <=
                    materia.stockMinimo
        );

    return (
        <div className="dashboard-content informes-printable">

            <div className="informes-header">

                <h1>Informes</h1>

                <p>
                    Resumen de la actividad actual
                    de la cafetería.
                </p>

                <div className="informes-filtros">
                    <button
                        className={
                            periodo === "hoy"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() =>
                            setPeriodo("hoy")
                        }
                    >
                        Hoy
                    </button>

                    <button
                        className={
                            periodo === "7dias"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() =>
                            setPeriodo("7dias")
                        }
                    >
                        Últimos 7 días
                    </button>

                    <button
                        className={
                            periodo === "30dias"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() =>
                            setPeriodo("30dias")
                        }
                    >
                        Últimos 30 días
                    </button>

                    <button
                        className={
                            periodo === "todo"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() =>
                            setPeriodo("todo")
                        }
                    >
                        Todo
                    </button>
                    <button
                        type="button"
                        className={periodo === "rango" ? "filtro-activo" : ""}
                        onClick={() => setPeriodo("rango")}
                    >
                        Rango específico
                    </button>
                </div>

                {periodo === "rango" && (
                    <div className="informes-rango">
                        <label>Desde <input type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} /></label>
                        <label>Hasta <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(event) => setFechaHasta(event.target.value)} /></label>
                    </div>
                )}

                <button type="button" className="primary-button informes-no-print" onClick={() => window.print()}>
                    Imprimir / guardar como PDF
                </button>

            </div>

            {/* ==========================
                RESUMEN
            ========================== */}

            <section className="informes-seccion">

                <h2>📊 Resumen general</h2>

                <div className="informes-tarjetas">

                    <div className="informe-card">
                        <span>📋</span>
                        <strong>
                            {comandasFiltradas.length}
                        </strong>
                        <p>Comandas</p>
                    </div>

                    <div className="informe-card">
                        <span>✅</span>
                        <strong>
                            {comandasFinalizadas}
                        </strong>
                        <p>Finalizadas</p>
                    </div>

                    <div className="informe-card">
                        <span>❌</span>
                        <strong>
                            {comandasCanceladas}
                        </strong>
                        <p>Canceladas</p>
                    </div>

                </div>

            </section>

            {/* ==========================
                ESTADO COMANDAS
            ========================== */}

            <section className="informes-seccion">

                <h2>📋 Estado de comandas</h2>

                <div className="informe-lista">

                    <div>
                        <span>Pendientes</span>
                        <strong>
                            {comandasPendientes}
                        </strong>
                    </div>

                    <div>
                        <span>En preparación</span>
                        <strong>
                            {comandasPreparando}
                        </strong>
                    </div>

                    <div>
                        <span>Listas</span>
                        <strong>
                            {comandasListas}
                        </strong>
                    </div>

                    <div>
                        <span>Finalizadas</span>
                        <strong>
                            {comandasFinalizadas}
                        </strong>
                    </div>

                    <div>
                        <span>Canceladas</span>
                        <strong>
                            {comandasCanceladas}
                        </strong>
                    </div>

                </div>

            </section>

            {/* ==========================
                PRODUCTOS
            ========================== */}

            <section className="informes-seccion">

                <h2>🛍 Productos más solicitados</h2>

                {productosMasSolicitados.length === 0 ? (

                    <p className="informe-vacio">
                        Todavía no hay productos
                        registrados en comandas.
                    </p>

                ) : (

                    <div className="informe-lista">

                        {productosMasSolicitados
                            .slice(0, 10)
                            .map((producto, index) => (

                                <div
                                    key={producto.nombre}
                                >

                                    <span>
                                        {index + 1}.{" "}
                                        {producto.nombre}
                                    </span>

                                    <strong>
                                        {producto.cantidad}
                                    </strong>

                                </div>

                            ))}

                    </div>

                )}

            </section>

            {/* ==========================
                STOCK
            ========================== */}

            <section className="informes-seccion">

                <h2>📦 Movimientos de stock</h2>

                <div className="informe-lista">

                    <div>
                        <span>Entradas</span>
                        <strong>
                            {movimientosPorTipo.entrada}
                        </strong>
                    </div>

                    <div>
                        <span>Salidas</span>
                        <strong>
                            {movimientosPorTipo.salida}
                        </strong>
                    </div>

                    <div>
                        <span>Consumos</span>
                        <strong>
                            {movimientosPorTipo.consumo}
                        </strong>
                    </div>

                    <div>
                        <span>Producciones</span>
                        <strong>
                            {movimientosPorTipo.produccion}
                        </strong>
                    </div>

                    <div>
                        <span>Ajustes</span>
                        <strong>
                            {movimientosPorTipo.ajuste}
                        </strong>
                    </div>

                </div>

            </section>

            {/* ==========================
                STOCK BAJO
            ========================== */}

            <section className="informes-seccion">

                <h2>⚠️ Materias primas con stock bajo</h2>

                {materiasPrimasConStockBajo.length === 0 ? (

                    <p className="informe-ok">
                        No hay materias primas
                        con stock bajo.
                    </p>

                ) : (

                    <div className="informe-stock-bajo-table" role="table" aria-label="Materias primas con stock bajo">
                        <div className="informe-stock-bajo-row encabezado" role="row">
                            <strong role="columnheader">Insumo</strong>
                            <strong role="columnheader">Stock disponible</strong>
                            <strong role="columnheader">Mínimo de alerta</strong>
                        </div>
                        {materiasPrimasConStockBajo.map((materia) => (
                            <div className="informe-stock-bajo-row" role="row" key={materia.id}>
                                <span role="cell">{materia.nombre}</span>
                                <span role="cell">{materia.stockActual} {materia.unidad}</span>
                                <span role="cell">{materia.stockMinimo} {materia.unidad}</span>
                            </div>
                        ))}
                    </div>

                )}

            </section>

        </div>
    );
}

export default Informes;
