interface SkeletonPaginaProps {
    ruta: string;
}

function Bloque({ className = "" }: { className?: string }) {
    return <span className={`skeleton-bloque ${className}`} aria-hidden="true" />;
}

function SkeletonPagina({ ruta }: SkeletonPaginaProps) {
    const mesas = ruta === "/mesas" || ruta === "/mapa";
    const comandas = ruta === "/comandas";
    const preparacion = ruta === "/preparacion";
    const dashboard = ruta === "/";

    return (
        <section className={`skeleton-pagina ${mesas ? "skeleton-pagina-mesas" : ""}`} role="status" aria-label="Cargando los datos de la cafetería">
            <div className="skeleton-pagina-cabecera">
                <div>
                    <Bloque className="skeleton-titulo" />
                    <Bloque className="skeleton-subtitulo" />
                </div>
                {!mesas && <Bloque className="skeleton-accion" />}
            </div>

            {mesas ? (
                <div className="skeleton-mapa">
                    {Array.from({ length: 8 }, (_, indice) => (
                        <Bloque key={indice} className={`skeleton-mesa skeleton-mesa-${indice + 1}`} />
                    ))}
                </div>
            ) : (
                <>
                    {(comandas || preparacion) && (
                        <div className="skeleton-filtros">
                            {Array.from({ length: preparacion ? 3 : 5 }, (_, indice) => (
                                <Bloque key={indice} className="skeleton-filtro" />
                            ))}
                        </div>
                    )}

                    {dashboard && (
                        <div className="skeleton-estadisticas">
                            {Array.from({ length: 4 }, (_, indice) => (
                                <Bloque key={indice} className="skeleton-estadistica" />
                            ))}
                        </div>
                    )}

                    <div className={`skeleton-contenido ${preparacion ? "skeleton-contenido-preparacion" : ""}`}>
                        {Array.from({ length: dashboard ? 2 : 6 }, (_, indice) => (
                            <article className="skeleton-tarjeta" key={indice}>
                                <Bloque className="skeleton-linea-ancha" />
                                <Bloque className="skeleton-linea-media" />
                                <Bloque className="skeleton-linea-corta" />
                                {!preparacion && <Bloque className="skeleton-boton" />}
                            </article>
                        ))}
                    </div>
                </>
            )}
            <span className="visually-hidden">Cargando los datos de la cafetería…</span>
        </section>
    );
}

export default SkeletonPagina;
