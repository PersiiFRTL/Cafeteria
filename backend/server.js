const express = require("express");
const { verificarConexionSupabase } = require("./supabaseClient");

const app = express();
const PORT = Number(process.env.PORT || process.env.port || 3000);
const allowedFrontendOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]);

app.use(express.json());

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedFrontendOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

app.get("/", (req, res) => {
    res.json({
        mensaje: "Backend de Cafetería funcionando"
    });
});

app.get("/api/health/supabase", async (req, res) => {
    const estado = await verificarConexionSupabase();
    const status = estado.conectado ? 200 : estado.configurado ? 502 : 503;

    return res.status(status).json({
        servicio: "supabase",
        ...estado
    });
});

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`Supabase: ${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? "configurado" : "sin configurar"}`);
});
