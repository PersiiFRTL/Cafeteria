const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const app = require("./server");

let server;
let baseUrl;

before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
        server.once("listening", resolve);
        server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
    if (!server) return;
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("GET / responde que el backend está activo", async () => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { mensaje: "Backend de Cafetería funcionando" } });
});

test("GET /api/auth/session rechaza una petición sin token", async () => {
    const response = await fetch(`${baseUrl}/api/auth/session`);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: { code: "AUTH_REQUIRED", message: "Falta la sesión de usuario." } });
});

test("GET /api/empleados requiere autenticación", async () => {
    const response = await fetch(`${baseUrl}/api/empleados`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: { code: "AUTH_REQUIRED", message: "Falta la sesión de usuario." } });
});

test("POST /api/comandas requiere autenticación", async () => {
    const response = await fetch(`${baseUrl}/api/comandas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaId: 1, productos: [{ productoId: 1, cantidad: 1 }] })
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: { code: "AUTH_REQUIRED", message: "Falta la sesión de usuario." } });
});

test("Las rutas de datos y catálogo requieren una sesión autenticada", async (t) => {
    const rutas = [
        ["GET", "/api/productos"],
        ["GET", "/api/productos/1"],
        ["GET", "/api/materias-primas"],
        ["GET", "/api/materias-primas/1"],
        ["GET", "/api/mesas"],
        ["GET", "/api/mesas/1"],
        ["GET", "/api/comandas?estado=pendiente&page=1&limit=20"],
        ["GET", "/api/comandas/1"],
        ["GET", "/api/recetas/1"],
        ["PATCH", "/api/recetas/1/estado"],
        ["GET", "/api/stock/movimientos"],
        ["GET", "/api/producciones"],
        ["POST", "/api/productos"],
        ["PATCH", "/api/productos/1"],
        ["PATCH", "/api/productos/1/stock-minimo"],
        ["PATCH", "/api/productos/1/estado"],
        ["DELETE", "/api/productos/1"],
        ["POST", "/api/materias-primas"],
        ["PATCH", "/api/materias-primas/1"],
        ["PATCH", "/api/materias-primas/1/estado"],
        ["PUT", "/api/recetas/1"]
    ];

    for (const [method, path] of rutas) {
        await t.test(`${method} ${path}`, async () => {
            const response = await fetch(`${baseUrl}${path}`, {
                method,
                headers: { "Content-Type": "application/json" },
                body: method === "GET" ? undefined : JSON.stringify({})
            });
            assert.equal(response.status, 401);
            assert.deepEqual(await response.json(), { error: { code: "AUTH_REQUIRED", message: "Falta la sesión de usuario." } });
        });
    }
});

test("POST /api/auth/login valida los datos antes de consultar Supabase", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "no-es-un-email", password: "" })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: { code: "INVALID_LOGIN", message: "Ingresá un email y una contraseña válidos." } });
});

test("GET /api/datos-iniciales fue retirado", async () => {
    const response = await fetch(`${baseUrl}/api/datos-iniciales`);
    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), { error: { code: "ROUTE_NOT_FOUND", message: "No existe la ruta GET /api/datos-iniciales." } });
});

test("Cambiar el estado de un ítem sin estado responde 400 con un mensaje claro", () => {
    const controller = require("./controllers/businessController");
    let status;
    let body;
    const response = {
        status(value) { status = value; return this; },
        json(value) { body = value; return this; }
    };
    controller.estadoItemComanda({ params: { id: "1", productoId: "2" }, body: {} }, response);
    assert.equal(status, 400);
    assert.deepEqual(body, {
        error: {
            code: "INVALID_ITEM_STATE",
            message: "El estado es obligatorio y debe ser 'preparando' o 'listo'."
        }
    });
});

test("Deshabilitar receta valida un booleano activo explícito", () => {
    const controller = require("./controllers/catalogController");
    let status;
    let body;
    const response = {
        status(value) { status = value; return this; },
        json(value) { body = value; return this; }
    };
    controller.estadoReceta({ params: { productoId: "7" }, body: {} }, response);
    assert.equal(status, 400);
    assert.deepEqual(body, {
        error: {
            code: "INVALID_RECIPE_STATE",
            message: "El ID del producto y el estado activo (true o false) son obligatorios."
        }
    });
});
