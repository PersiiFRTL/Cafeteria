import { useCafeteria } from "../context/CafeteriaContext";
import { useSearchParams } from "react-router-dom";

function Comandas() {
    const [searchParams] = useSearchParams();

    const {
        comandas,
        mesas,
        productos
    } = useCafeteria();

    const comandaSeleccionadaId = Number(
        searchParams.get("comanda")
    );

    const comandasVisibles = comandaSeleccionadaId
        ? comandas.filter(
            (comanda) => comanda.id === comandaSeleccionadaId
        )
        : comandas;

    const obtenerProducto = (productoId: number) => {
        return productos.find(
            (producto) =>
                producto.id === productoId
        );
    };

    const obtenerMesa = (mesaId: number) => {
        return mesas.find(
            (mesa) =>
                mesa.id === mesaId
        );
    };

    return (
        <div className="dashboard-content">

            <div className="comandas-header">
                <div>
                    <h1>Comandas</h1>

                    <p>
                        Historial y estado de las comandas.
                    </p>
                </div>
            </div>

            {comandasVisibles.length === 0 ? (

                <div className="comandas-empty">
                    <h2>No hay comandas</h2>

                    <p>
                        Todavía no se ha creado ninguna comanda.
                    </p>
                </div>

            ) : (

                <div className="comandas-container">

                    {comandasVisibles.map((comanda) => {

                        const mesa =
                            obtenerMesa(comanda.mesaId);

                        return (
                            <div
                                key={comanda.id}
                                className="comanda-card"
                            >

                                <div className="comanda-card-header">

                                    <div>
                                        <h2>
                                            Comanda #{comanda.id}
                                        </h2>

                                        <p>
                                            Mesa{" "}
                                            {mesa?.numero ?? "-"}
                                        </p>
                                    </div>

                                    <span
                                        className={`comanda-estado ${comanda.estado}`}
                                    >
                                        {comanda.estado === "pendiente" &&
                                            "Pendiente"}

                                        {comanda.estado === "preparando" &&
                                            "Preparando"}

                                        {comanda.estado === "lista" &&
                                            "Lista"}

                                        {comanda.estado === "finalizada" &&
                                            "Finalizada"}
                                    </span>

                                </div>

                                <div className="comanda-card-body">

                                    <h3>
                                        Productos
                                    </h3>

                                    {comanda.productos.map(
                                        (item) => {

                                            const producto =
                                                obtenerProducto(
                                                    item.productoId
                                                );

                                            if (!producto) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    key={
                                                        item.productoId
                                                    }
                                                    className="comanda-producto"
                                                >

                                                    <div>
                                                        <strong>
                                                            {item.cantidad} x{" "}
                                                            {producto.nombre}
                                                        </strong>

                                                        <p>
                                                            {producto.sector}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`producto-estado ${item.estado}`}
                                                    >
                                                        {item.estado ===
                                                            "pendiente" &&
                                                            "Pendiente"}

                                                        {item.estado ===
                                                            "preparando" &&
                                                            "Preparando"}

                                                        {item.estado ===
                                                            "listo" &&
                                                            "Listo"}
                                                    </span>

                                                </div>
                                            );
                                        }
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

        </div>
    );
}

export default Comandas;