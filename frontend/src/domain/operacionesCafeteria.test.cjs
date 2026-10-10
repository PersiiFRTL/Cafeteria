// Pruebas pequeñas de la lógica del frontend con datos y respuestas simuladas.
const {
    contarComandasFinalizadasDelDia,
    crearComandaEnMemoria,
    descontarStockMateriaPrima
} = require("./operacionesCafeteria.ts");
const { solicitarInicioSesion } = require("../services/autenticacion.ts");

describe("operaciones principales de la cafetería", () => {
    test("1. acepta el login cuando la respuesta simulada es correcta", async () => {
        const usuario = { id: 1, nombre: "Ana", email: "ana@cafeteria.com", rol: "admin" };
        const solicitar = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ usuario })
        });

        const resultado = await solicitarInicioSesion("ana@cafeteria.com", "clave", solicitar);

        expect(resultado).toEqual({ correcto: true, usuario });
        expect(solicitar).toHaveBeenCalledWith("/api/login", expect.objectContaining({ method: "POST" }));
    });

    test("2. al crear una comanda, la mesa seleccionada queda ocupada", () => {
        const resultado = crearComandaEnMemoria(
            [],
            [{ id: 1, estado: "libre" }, { id: 2, estado: "libre" }],
            1,
            [{ productoId: 10, cantidad: 1, estado: "pendiente", cantidadStockProcesada: 0 }],
            "2026-01-01T12:00:00.000Z"
        );

        expect(resultado.mesas).toEqual([
            { id: 1, estado: "ocupada" },
            { id: 2, estado: "libre" }
        ]);
    });

    test("3. descuenta del stock la cantidad registrada", () => {
        const materiasPrimas = [{ id: 1, nombre: "Leche", stockActual: 10 }];

        expect(descontarStockMateriaPrima(materiasPrimas, 1, 3)).toEqual([
            { id: 1, nombre: "Leche", stockActual: 7 }
        ]);
        expect(materiasPrimas[0].stockActual).toBe(10);
    });

    test("4. el dashboard cuenta las comandas finalizadas del día", () => {
        const hoy = new Date(2026, 0, 10, 12);
        const fechaHoy = new Date(2026, 0, 10, 9).toISOString();
        const fechaAyer = new Date(2026, 0, 9, 9).toISOString();
        const comandas = [
            { estado: "finalizada", fechaCreacion: fechaHoy },
            { estado: "pendiente", fechaCreacion: fechaHoy },
            { estado: "finalizada", fechaCreacion: fechaAyer }
        ];

        expect(contarComandasFinalizadasDelDia(comandas, hoy)).toBe(1);
    });
});

// Para comprobar estas pruebas: abre una terminal y ejecuta `npm test`.
// Jest debe informar que pasó 1 suite y 4 pruebas.
