import { useCafeteria } from "../context/CafeteriaContext";
import productosData from "../data/productos.json";

interface Producto {
    id: number;
    nombre: string;
    precio: number;
    sector: string;
}

const productos: Producto[] = productosData;

function Comandas() {

    const { comandas } = useCafeteria();

    const comandasOrdenadas = [...comandas].sort((comandaA, comandaB) => {
        const prioridad = {
            preparando: 0,
            pendiente: 1,
            lista: 2,
            finalizada: 3
        };

        return prioridad[comandaA.estado] - prioridad[comandaB.estado];
    });

    const obtenerProducto = (productoId: number) => {

        return productos.find(
            (producto) => producto.id === productoId
        );

    };

    return (
        <div className="dashboard-content">

            <div className="comandas-header">

                <h1>Comandas</h1>

                <p>
                    Comandas activas de la cafetería.
                </p>

            </div>

            {comandas.length === 0 ? (

                <div className="comandas-vacio">

                    <h2>No hay comandas activas</h2>

                    <p>
                        Las comandas creadas desde una mesa
                        aparecerán aquí.
                    </p>

                </div>

            ) : (

                <div className="comandas-container">

                    {comandasOrdenadas.map((comanda) => {

                        // La sectorización separa una comanda y la muestra agrupada por sector correspondiente.
                        // Esto permite que cada sector pueda ver únicamente los productos que le corresponden.
                        const productosPorSector: {
                            [sector: string]: Producto[]
                        } = {};

                        comanda.productos.forEach((item) => {

                            const producto =
                                obtenerProducto(item.productoId);

                            if (!producto) {
                                return;
                            }

                            if (!productosPorSector[producto.sector]) {
                                productosPorSector[producto.sector] = [];
                            }

                            productosPorSector[producto.sector].push(
                                producto
                            );

                        });

                        return (

                            <div
                                className="comanda-card"
                                key={comanda.id}
                            >

                                <div className="comanda-card-header">

                                    <div>

                                        <h2>
                                            Comanda #{comanda.id}
                                        </h2>

                                        <p>
                                            Mesa {comanda.mesaId}
                                        </p>

                                    </div>

                                    <span
                                        className={`comanda-estado ${comanda.estado}`}
                                    >
                                        {comanda.estado}
                                    </span>

                                </div>


                                {Object.entries(
                                    productosPorSector
                                ).map(
                                    ([sector, productosSector]) => (

                                        <div
                                            className="sector-comanda"
                                            key={sector}
                                        >

                                            <h3>
                                                {sector}
                                            </h3>

                                            {productosSector.map(
                                                (producto) => {

                                                    const item =
                                                        comanda.productos.find(
                                                            (item) =>
                                                                item.productoId ===
                                                                producto.id
                                                        );

                                                    return (

                                                        <div
                                                            className="comanda-item"
                                                            key={producto.id}
                                                        >

                                                            <span>
                                                                {producto.nombre}
                                                            </span>

                                                            <div className="comanda-item-meta">
                                                                <strong>
                                                                    x{item?.cantidad}
                                                                </strong>
                                                                <small>
                                                                    {item?.estado}
                                                                </small>
                                                            </div>

                                                        </div>

                                                    );

                                                }
                                            )}

                                        </div>

                                    )
                                )}

                                <button className="secondary-button">
                                    Ver comanda
                                </button>

                            </div>

                        );

                    })}

                </div>

            )}

        </div>
    );
}

export default Comandas;