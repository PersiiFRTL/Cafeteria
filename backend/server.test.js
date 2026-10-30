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
    assert.deepEqual(await response.json(), { mensaje: "Backend de Cafetería funcionando" });
});

test("GET /api/auth/session rechaza una petición sin token", async () => {
    const response = await fetch(`${baseUrl}/api/auth/session`);
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { mensaje: "Falta la sesión de usuario." });
});

test("GET /api/empleados requiere autenticación", async () => {
    const response = await fetch(`${baseUrl}/api/empleados`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { mensaje: "Falta la sesión de usuario." });
});

test("POST /api/comandas requiere autenticación", async () => {
    const response = await fetch(`${baseUrl}/api/comandas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesaId: 1, productos: [{ productoId: 1, cantidad: 1 }] })
    });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { mensaje: "Falta la sesión de usuario." });
});

test("POST /api/auth/login valida los datos antes de consultar Supabase", async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "no-es-un-email", password: "" })
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { mensaje: "Ingresá un email y una contraseña válidos." });
});
