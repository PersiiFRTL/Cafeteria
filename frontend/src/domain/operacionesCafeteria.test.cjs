// Pruebas pequeñas de la lógica del frontend con datos y respuestas simuladas.
const {
    contarComandasFinalizadasDelDia,
    calcularConsumoStockComanda,
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

    test("5. no crea otra comanda en una mesa que ya está ocupada", () => {
        const mesas = [{ id: 1, estado: "ocupada" }];
        const resultado = crearComandaEnMemoria(
            [],
            mesas,
            1,
            [{ productoId: 10, cantidad: 1, estado: "pendiente", cantidadStockProcesada: 0 }],
            "2026-01-01T12:00:00.000Z"
        );

        expect(resultado).toBeNull();
        expect(mesas[0].estado).toBe("ocupada");
    });

    test("6. rechaza cantidades cero o negativas al crear una comanda", () => {
        const mesaLibre = [{ id: 1, estado: "libre" }];

        for (const cantidad of [0, -2]) {
            const resultado = crearComandaEnMemoria(
                [],
                mesaLibre,
                1,
                [{ productoId: 10, cantidad, estado: "pendiente", cantidadStockProcesada: 0 }],
                "2026-01-01T12:00:00.000Z"
            );
            expect(resultado).toBeNull();
        }
        expect(mesaLibre[0].estado).toBe("libre");
    });

    test("3. descuenta del stock la cantidad registrada", () => {
        const materiasPrimas = [{ id: 1, nombre: "Leche", stockActual: 10 }];

        expect(descontarStockMateriaPrima(materiasPrimas, 1, 3)).toEqual([
            { id: 1, nombre: "Leche", stockActual: 7 }
        ]);
        expect(materiasPrimas[0].stockActual).toBe(10);
    });

    test("7. no procesa una comanda si falta materia prima ni deja stock negativo", () => {
        const materiasPrimas = [{ id: 1, nombre: "Leche", stockActual: 5 }];
        const plan = calcularConsumoStockComanda(
            [{ productoId: 20, cantidad: 3, cantidadStockProcesada: 0 }],
            [{ id: 20, tipoElaboracion: "bajo_pedido", stockActual: 0 }],
            [{ productoId: 20, ingredientes: [{ materiaPrimaId: 1, cantidad: 2 }] }],
            materiasPrimas
        );

        expect(plan).toBeNull();
        expect(materiasPrimas[0].stockActual).toBe(5);
        expect(descontarStockMateriaPrima(materiasPrimas, 1, 6)).toBeNull();

        for (const cantidad of [0, -1]) {
            expect(calcularConsumoStockComanda(
                [{ productoId: 20, cantidad, cantidadStockProcesada: 0 }],
                [{ id: 20, tipoElaboracion: "bajo_pedido", stockActual: 0 }],
                [{ productoId: 20, ingredientes: [{ materiaPrimaId: 1, cantidad: 2 }] }],
                materiasPrimas
            )).toBeNull();
        }
    });

    test("8. rechaza el login con credenciales incorrectas", async () => {
        const solicitar = jest.fn().mockResolvedValue({ ok: false, status: 401 });

        await expect(solicitarInicioSesion("ana@cafeteria.com", "incorrecta", solicitar))
            .resolves.toEqual({ correcto: false, mensaje: "Email o contraseña incorrectos." });
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
// Jest debe informar que pasó 1 suite y 8 pruebas.
// Ejecuta `npm run test:coverage` para ver el resumen por archivo en la terminal
// y abrir `coverage/index.html` para consultar líneas, funciones, ramas y sentencias.
