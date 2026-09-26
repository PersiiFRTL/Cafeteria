const express = require("express");
const empleados = require("../frontend/src/data/empleados.json");

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend de Cafetería funcionando"
    });
});

app.post("/api/login", (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!email || !password) {
        return res.status(400).json({
            mensaje: "Email y contraseña son obligatorios"
        });
    }

    const empleado = empleados.find(
        (empleadoActual) =>
            empleadoActual.email.trim().toLowerCase() === email &&
            empleadoActual.password === password &&
            empleadoActual.activo
    );

    if (!empleado) {
        return res.status(401).json({
            mensaje: "Email o contraseña incorrectos"
        });
    }

    const usuario = {
        id: empleado.id,
        nombre: empleado.nombre,
        email: empleado.email,
        rol: empleado.rol
    };

    return res.json({
        success: true,
        mensaje: "Login correcto",
        usuario
    });
});

app.listen(PORT, () => {
    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );
});