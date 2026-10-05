import empleados from "../data/empleados.json";
import materiasPrimas from "../data/materiasPrimas.json";
import mesas from "../data/mesas.json";
import productos from "../data/productos.json";
import producciones from "../data/producciones.json";
import recetas from "../data/recetas.json";

/** Datos de demostración aislados de la UI y listos para reemplazarse por un repositorio remoto. */
export interface DatosInicialesCafeteria {
    mesas: typeof mesas;
    productos: typeof productos;
    materiasPrimas: typeof materiasPrimas;
    recetas: typeof recetas;
    producciones: typeof producciones;
    empleados: typeof empleados;
}

export interface CafeteriaRepository {
    cargarDatosIniciales(): Promise<DatosInicialesCafeteria>;
}

export const repositorioDemo: CafeteriaRepository = {
    cargarDatosIniciales: async () => ({
        mesas: structuredClone(mesas),
        productos: structuredClone(productos),
        materiasPrimas: structuredClone(materiasPrimas),
        recetas: structuredClone(recetas),
        producciones: structuredClone(producciones),
        empleados: structuredClone(empleados)
    })
};
