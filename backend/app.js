const express = require("express");
const config = require("./config");
const { verificarConexionSupabase } = require("./config/supabase");
const { enviarDatos, enviarError, errorHandler } = require("./middlewares/responses");

const app = express();
if (config.trustProxy) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
app.use((req, res, next) => {
    if (config.performanceLogs && req.path.startsWith("/api/")) {
        const started = process.hrtime.bigint();
        res.once("finish", () => {
            const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
            console.info(JSON.stringify({ type: "http_performance", method: req.method, path: req.path, status: res.statusCode, durationMs: Number(durationMs.toFixed(1)), ...(Number.isFinite(req.authDurationMs) ? { authMs: Number(req.authDurationMs.toFixed(1)) } : {}) }));
        });
    }
    next();
});
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && config.frontendOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
});

app.get("/", (_req, res) => enviarDatos(res, { mensaje: "Backend de Cafetería funcionando" }));
app.get("/api/health/supabase", async (_req, res) => {
    const health = await verificarConexionSupabase();
    return res.status(health.conectado ? 200 : health.configurado ? 502 : 503).json({ data: { servicio: "supabase", ...health } });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/empleados", require("./routes/employeeRoutes"));
app.get("/api/datos-iniciales", (_req, res) => enviarError(res, 404, "ROUTE_NOT_FOUND", "No existe la ruta GET /api/datos-iniciales."));
app.use("/api", require("./routes/catalogRoutes"));
app.use("/api/stock", require("./routes/stockRoutes"));
app.use("/api/producciones", require("./routes/produccionRoutes"));
app.use("/api/mapa", require("./routes/mapaRoutes"));
app.use("/api/informes", require("./routes/reportRoutes"));
app.use("/api/auditoria", require("./routes/auditRoutes"));

app.use((req, res) => enviarError(res, 404, "ROUTE_NOT_FOUND", `No existe la ruta ${req.method} ${req.originalUrl}.`));
app.use(errorHandler);

module.exports = app;
