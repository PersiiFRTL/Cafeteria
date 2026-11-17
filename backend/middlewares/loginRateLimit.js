const intentos = new Map();
const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS = 10;

module.exports = function limitarIntentosLogin(req, res, next) {
    const ahora = Date.now();
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "sin-email";
    const clave = `${req.ip || req.socket.remoteAddress || "desconocida"}\0${email}`;
    let registro = intentos.get(clave);
    if (!registro || ahora - registro.inicio >= VENTANA_MS) registro = { inicio: ahora, cantidad: 0 };
    if (registro.cantidad >= MAX_INTENTOS) {
        res.setHeader("Retry-After", String(Math.ceil((registro.inicio + VENTANA_MS - ahora) / 1000)));
        return res.status(429).json({ error: { code: "LOGIN_RATE_LIMIT", message: "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá nuevamente." } });
    }
    registro.cantidad += 1;
    intentos.set(clave, registro);
    if (intentos.size > 10000) {
        for (const [key, value] of intentos) if (ahora - value.inicio >= VENTANA_MS) intentos.delete(key);
    }
    return next();
};
