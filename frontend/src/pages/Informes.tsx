import { useEffect, useState } from "react";
import {
    ChartNoAxesColumnIncreasing,
    CircleCheck,
    CircleX,
    ClipboardList,
    Clock3,
    History,
    Package,
    RotateCcw,
    ShoppingBag,
    TriangleAlert,
    TrendingUp,
    UsersRound,
    Utensils,
} from "lucide-react";
import { useInformes } from "../context/useInformes";

const INFORMES_PERIODO_KEY = "cafeteria-informes-periodo";
const INFORMES_RANGO_KEY = "cafeteria-informes-rango";

interface RangoFechas {
    desde: string;
    hasta: string;
}

const leerRangoGuardado = (): RangoFechas | null => {
    try {
        const valor = localStorage.getItem(INFORMES_RANGO_KEY);
        if (!valor) return null;
        const rango = JSON.parse(valor) as RangoFechas;
        return /^\d{4}-\d{2}-\d{2}$/.test(rango.desde) &&
            /^\d{4}-\d{2}-\d{2}$/.test(rango.hasta)
            && rango.desde <= rango.hasta
            && rango.hasta <= fechaLocalISO(new Date())
            ? rango
            : null;
    } catch {
        return null;
    }
};

const fechaLocalISO = (fecha: Date) => {
    const local = new Date(fecha);
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toISOString().slice(0, 10);
};

function Informes() {

    const {
        comandas,
        productos,
        materiasPrimas,
        movimientosStock,
        actividad,
        auditoriaDisponible,
        empleados,
        operacionesStock
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
        return valorGuardado === "rango" && !leerRangoGuardado()
            ? "todo"
            : valorGuardado === "hoy" || valorGuardado === "7dias" || valorGuardado === "30dias" || valorGuardado === "rango" || valorGuardado === "todo"
            ? valorGuardado
            : "todo";
    });
    const [rangoAplicado, setRangoAplicado] = useState<RangoFechas | null>(leerRangoGuardado);
    const [fechaDesde, setFechaDesde] = useState(() => leerRangoGuardado()?.desde ?? "");
    const [fechaHasta, setFechaHasta] = useState(() => leerRangoGuardado()?.hasta ?? "");
    const [editandoRango, setEditandoRango] = useState(false);
    const [errorRango, setErrorRango] = useState("");

    useEffect(() => {
        localStorage.setItem(INFORMES_PERIODO_KEY, periodo);
    }, [periodo]);

    useEffect(() => {
        if (periodo === "rango" && rangoAplicado) {
            localStorage.setItem(INFORMES_RANGO_KEY, JSON.stringify(rangoAplicado));
        }
    }, [periodo, rangoAplicado]);

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

const fechaInicioRango = rangoAplicado ? new Date(`${rangoAplicado.desde}T00:00:00`) : null;
const fechaFinRango = rangoAplicado ? new Date(`${rangoAplicado.hasta}T23:59:59.999`) : null;
const dentroDelPeriodo = (valor: string) => {
    const fecha = new Date(valor);
    if (periodo === "todo") return true;
    if (periodo === "rango") {
        return Boolean(fechaInicioRango && fechaFinRango && fecha >= fechaInicioRango && fecha <= fechaFinRango);
    }
    return fecha >= inicioPeriodo;
};

const comandasFiltradas = comandas.filter((comanda) => dentroDelPeriodo(comanda.fechaCreacion));
const comandasNoCanceladas = comandasFiltradas.filter((comanda) => comanda.estado !== "cancelada");
const comandasCanceladas = comandasFiltradas.filter((comanda) => comanda.estado === "cancelada").length;
const unidadesSolicitadas = comandasNoCanceladas.reduce(
    (total, comanda) => total + comanda.productos.reduce((subtotal, item) => subtotal + item.cantidad, 0),
    0
);
const promedioUnidadesPorComanda = comandasNoCanceladas.length
    ? unidadesSolicitadas / comandasNoCanceladas.length
    : 0;
const porcentajeCanceladas = comandasFiltradas.length
    ? (comandasCanceladas / comandasFiltradas.length) * 100
    : 0;
const comandasMesa = comandasFiltradas.filter((comanda) => comanda.tipoAtencion === "mesa").length;
const comandasTakeAway = comandasFiltradas.filter((comanda) => comanda.tipoAtencion === "take-away").length;
const operacionesStockFiltradas = operacionesStock.filter((operacion) => dentroDelPeriodo(operacion.fecha));
const actividadFiltrada = actividad.filter((evento) => dentroDelPeriodo(evento.fecha));
const resumenEmpleados = new Map<string, {
    nombre: string;
    rol: string;
    activo: boolean;
    comandas: number;
    operacionesStock: number;
    eventos: number;
}>();
const obtenerResumenEmpleado = (nombre: string) => {
    const nombreNormalizado = nombre.trim() || "Usuario desconocido";
    const clave = nombreNormalizado.toLocaleLowerCase("es-AR");
    let resumen = resumenEmpleados.get(clave);
    if (!resumen) {
        const empleado = empleados.find((item) => item.nombre.trim().toLocaleLowerCase("es-AR") === clave);
        resumen = {
            nombre: empleado?.nombre ?? nombreNormalizado,
            rol: empleado?.rol ?? "Histórico",
            activo: empleado?.activo ?? false,
            comandas: 0,
            operacionesStock: 0,
            eventos: 0
        };
        resumenEmpleados.set(clave, resumen);
    }
    return resumen;
};
empleados.forEach((empleado) => { obtenerResumenEmpleado(empleado.nombre); });
comandasFiltradas.forEach((comanda) => {
    if (comanda.responsableNombre) obtenerResumenEmpleado(comanda.responsableNombre).comandas += 1;
});
operacionesStockFiltradas.forEach((operacion) => {
    if (operacion.responsableNombre) obtenerResumenEmpleado(operacion.responsableNombre).operacionesStock += 1;
});
actividadFiltrada.forEach((evento) => {
    obtenerResumenEmpleado(evento.usuarioNombre).eventos += 1;
});
const empleadosOrdenados = Array.from(resumenEmpleados.values()).sort((a, b) =>
    (b.comandas + b.operacionesStock + b.eventos) - (a.comandas + a.operacionesStock + a.eventos)
    || a.nombre.localeCompare(b.nombre, "es-AR")
);
const franjasHorarias = [
    { nombre: "Mañana · 06 a 11", desde: 6, hasta: 11, cantidad: 0 },
    { nombre: "Mediodía · 12 a 15", desde: 12, hasta: 15, cantidad: 0 },
    { nombre: "Tarde · 16 a 19", desde: 16, hasta: 19, cantidad: 0 },
    { nombre: "Noche · 20 a 05", desde: 20, hasta: 5, cantidad: 0 }
];
comandasNoCanceladas.forEach((comanda) => {
    const hora = new Date(comanda.fechaCreacion).getHours();
    const franja = franjasHorarias.find((item) => item.desde <= item.hasta
        ? hora >= item.desde && hora <= item.hasta
        : hora >= item.desde || hora <= item.hasta);
    if (franja) franja.cantidad += 1;
});
const maxComandasPorFranja = Math.max(1, ...franjasHorarias.map((franja) => franja.cantidad));

const aplicarRangoFechas = () => {
    const fechaHoy = fechaLocalISO(new Date());
    if (!fechaDesde || !fechaHasta) {
        setErrorRango("Elegí una fecha de inicio y una fecha de fin.");
        return;
    }
    if (fechaDesde > fechaHoy || fechaHasta > fechaHoy) {
        setErrorRango("Las fechas no pueden ser posteriores a hoy.");
        return;
    }
    if (fechaHasta < fechaDesde) {
        setErrorRango("La fecha Hasta no puede ser anterior a Desde.");
        return;
    }

    setRangoAplicado({ desde: fechaDesde, hasta: fechaHasta });
    setPeriodo("rango");
    setEditandoRango(false);
    setErrorRango("");
};

const imprimirInforme = () => {
    const hoy = fechaLocalISO(new Date());
    let rangoNombre: RangoFechas | null = null;
    if (periodo === "rango") {
        rangoNombre = rangoAplicado;
    } else if (periodo === "hoy") {
        rangoNombre = { desde: hoy, hasta: hoy };
    } else if (periodo === "7dias" || periodo === "30dias") {
        rangoNombre = { desde: fechaLocalISO(inicioPeriodo), hasta: hoy };
    }

    const nombreInforme = rangoNombre
        ? `Informe_${rangoNombre.desde}_${rangoNombre.hasta}`
        : "Informe_Todo";
    const tituloAnterior = document.title;
    const restaurarTitulo = () => {
        document.title = tituloAnterior;
        window.removeEventListener("afterprint", restaurarTitulo);
    };

    document.title = nombreInforme;
    window.addEventListener("afterprint", restaurarTitulo, { once: true });
    window.print();
};

    const comandasFinalizadas =
    comandasFiltradas.filter(
        (comanda) =>
            comanda.estado === "finalizada"
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

    comandasNoCanceladas.forEach((comanda) => {

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
                        onClick={() => { setPeriodo("hoy"); setEditandoRango(false); }}
                    >
                        Hoy
                    </button>

                    <button
                        className={
                            periodo === "7dias"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() => { setPeriodo("7dias"); setEditandoRango(false); }}
                    >
                        Últimos 7 días
                    </button>

                    <button
                        className={
                            periodo === "30dias"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() => { setPeriodo("30dias"); setEditandoRango(false); }}
                    >
                        Últimos 30 días
                    </button>

                    <button
                        className={
                            periodo === "todo"
                                ? "filtro-activo"
                                : ""
                        }
                        onClick={() => { setPeriodo("todo"); setEditandoRango(false); }}
                    >
                        Todo
                    </button>
                    <button
                        type="button"
                        className={periodo === "rango" || editandoRango ? "filtro-activo" : ""}
                        onClick={() => {
                            setFechaDesde(rangoAplicado?.desde ?? "");
                            setFechaHasta(rangoAplicado?.hasta ?? "");
                            setErrorRango("");
                            setEditandoRango(true);
                        }}
                    >
                        Rango específico
                    </button>
                </div>

                {(periodo === "rango" || editandoRango) && (
                    <div className="informes-rango-panel">
                    <div className="informes-rango">
                        <label>
                            Desde
                            <input
                                type="date"
                                value={fechaDesde}
                                max={fechaLocalISO(new Date())}
                                aria-invalid={Boolean(errorRango)}
                                aria-describedby={errorRango ? "error-rango-fechas" : undefined}
                                onChange={(event) => { setFechaDesde(event.target.value); setErrorRango(""); }}
                            />
                        </label>
                        <label>
                            Hasta
                            <input
                                type="date"
                                value={fechaHasta}
                                min={fechaDesde || undefined}
                                max={fechaLocalISO(new Date())}
                                aria-invalid={Boolean(errorRango)}
                                aria-describedby={errorRango ? "error-rango-fechas" : undefined}
                                onChange={(event) => { setFechaHasta(event.target.value); setErrorRango(""); }}
                            />
                        </label>
                    </div>
                    {errorRango && <p id="error-rango-fechas" className="form-field-error" role="alert">{errorRango}</p>}
                    <div className="informes-rango-acciones">
                        <button
                            type="button"
                            className="primary-button informes-aplicar-rango"
                            onClick={aplicarRangoFechas}
                        >
                            Aplicar rango
                        </button>
                    </div>
                    {periodo === "rango" && rangoAplicado && (
                        <p className="informes-rango-aplicado">
                            Rango aplicado: {rangoAplicado.desde} al {rangoAplicado.hasta}
                        </p>
                    )}
                    </div>
                )}

                <button type="button" className="primary-button informes-no-print" onClick={imprimirInforme}>
                    Imprimir / guardar como PDF
                </button>

            </div>

            {/* ==========================
                RESUMEN
            ========================== */}

            <section className="informes-seccion">

                <h2><ChartNoAxesColumnIncreasing className="ui-icon" aria-hidden="true" /> Resumen general</h2>

                <div className="informes-tarjetas">

                    <div className="informe-card">
                        <span><ClipboardList className="ui-icon" aria-hidden="true" /></span>
                        <strong>
                            {comandasFiltradas.length}
                        </strong>
                        <p>Comandas</p>
                    </div>

                    <div className="informe-card">
                        <span><CircleCheck className="ui-icon" aria-hidden="true" /></span>
                        <strong>
                            {comandasFinalizadas}
                        </strong>
                        <p>Entregadas</p>
                    </div>

                    <div className="informe-card">
                        <span><CircleX className="ui-icon" aria-hidden="true" /></span>
                        <strong>
                            {comandasCanceladas}
                        </strong>
                        <p>Canceladas</p>
                    </div>

                    <div className="informe-card">
                        <span><Package className="ui-icon" aria-hidden="true" /></span>
                        <strong>{unidadesSolicitadas}</strong>
                        <p>Unidades solicitadas</p>
                    </div>

                    <div className="informe-card">
                        <span><TrendingUp className="ui-icon" aria-hidden="true" /></span>
                        <strong>{promedioUnidadesPorComanda.toLocaleString("es-AR", { maximumFractionDigits: 1 })}</strong>
                        <p>Unidades por comanda</p>
                    </div>

                    <div className="informe-card">
                        <span><RotateCcw className="ui-icon" aria-hidden="true" /></span>
                        <strong>{porcentajeCanceladas.toLocaleString("es-AR", { maximumFractionDigits: 1 })}%</strong>
                        <p>Comandas canceladas</p>
                    </div>

                </div>

            </section>

            <section className="informes-seccion">
                <h2><Utensils className="ui-icon" aria-hidden="true" /> Tipo de atención</h2>
                <p className="informe-actividad-ayuda">Distribución de las comandas del período seleccionado.</p>
                <div className="informe-lista">
                    <div><span>En mesa</span><strong>{comandasMesa}</strong></div>
                    <div><span>Take away</span><strong>{comandasTakeAway}</strong></div>
                </div>
            </section>

            <section className="informes-seccion">
                <h2><Clock3 className="ui-icon" aria-hidden="true" /> Comandas por franja horaria</h2>
                <p className="informe-actividad-ayuda">Se excluyen las comandas canceladas.</p>
                <div className="informe-franjas">
                    {franjasHorarias.map((franja) => (
                        <div className="informe-franja" key={franja.nombre}>
                            <div className="informe-franja-etiqueta"><span>{franja.nombre}</span><strong>{franja.cantidad}</strong></div>
                            <div className="informe-franja-fondo" aria-hidden="true">
                                <div className="informe-franja-barra" style={{ width: `${(franja.cantidad / maxComandasPorFranja) * 100}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="informes-seccion">
                <h2><UsersRound className="ui-icon" aria-hidden="true" /> Actividad por empleado</h2>
                <p className="informe-actividad-ayuda">
                    Comandas creadas y operaciones de stock en el período seleccionado.
                </p>
                {empleadosOrdenados.length === 0 ? (
                    <p className="informe-vacio">No hay empleados ni actividad registrada para mostrar.</p>
                ) : (
                    <div className="informe-empleados-tabla" role="table" aria-label="Actividad por empleado">
                        <div className="informe-empleados-fila informe-empleados-encabezado" role="row">
                            <strong role="columnheader">Empleado</strong>
                            <strong role="columnheader">Estado</strong>
                            <strong role="columnheader">Comandas</strong>
                            <strong role="columnheader">Operaciones de stock</strong>
                        </div>
                        {empleadosOrdenados.map((empleado) => {
                            const estadoTexto = empleado.rol === "Histórico" ? "Registro histórico" : empleado.activo ? "Activo" : "Inactivo";
                            const estadoClass = empleado.rol === "Histórico" ? "historico" : empleado.activo ? "activo" : "inactivo";

                            return (
                                <div className="informe-empleados-fila" role="row" key={empleado.nombre}>
                                    <span role="cell">
                                        <strong>{empleado.nombre}</strong>
                                        <small>{empleado.rol}</small>
                                    </span>
                                    <span role="cell">
                                        <span className={`informe-empleado-estado informe-empleado-estado--${estadoClass}`}>{estadoTexto}</span>
                                    </span>
                                    <span role="cell">{empleado.comandas}</span>
                                    <span role="cell">{empleado.operacionesStock}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ==========================
                ESTADO COMANDAS
            ========================== */}

            <section className="informes-seccion">

                <h2><ClipboardList className="ui-icon" aria-hidden="true" /> Estado de comandas</h2>

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
                        <span>Entregadas</span>
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

                <h2><ShoppingBag className="ui-icon" aria-hidden="true" /> Productos más solicitados</h2>

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

                <h2><Package className="ui-icon" aria-hidden="true" /> Movimientos de stock</h2>

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

            <section className="informes-seccion">
                <h2><History className="ui-icon" aria-hidden="true" /> Actividad reciente</h2>
                <p className="informe-actividad-ayuda">Últimos 100 registros, del más nuevo al más antiguo.</p>
                {!auditoriaDisponible ? (
                    <p className="informe-actividad-ayuda">
                        El historial se habilita al aplicar la migración de auditoría en Supabase.
                    </p>
                ) : actividadFiltrada.length === 0 ? (
                    <p className="informe-ok">No hay cambios registrados en el período seleccionado.</p>
                ) : (
                    <div className="informe-actividad-lista" role="list" aria-label="Actividad reciente del sistema">
                        {actividadFiltrada.map((evento) => (
                            <article className="informe-actividad-item" role="listitem" key={evento.id}>
                                <div className="informe-actividad-detalle">
                                    <strong>{evento.accion}</strong>
                                    <p>{evento.detalle}</p>
                                </div>
                                <div className="informe-actividad-meta">
                                    <strong>{evento.usuarioNombre}</strong>
                                    <time dateTime={evento.fecha}>{new Date(evento.fecha).toLocaleString("es-AR")}</time>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* ==========================
                STOCK BAJO
            ========================== */}

            <section className="informes-seccion">

                <h2><TriangleAlert className="ui-icon" aria-hidden="true" /> Materias primas con stock bajo</h2>

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
