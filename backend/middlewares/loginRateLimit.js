const { createHash } = require("node:crypto");

const intentos = new Map();
const VENTANA_MS = 15 * 60 * 1000;
const MAX_INTENTOS_CUENTA = 10;
const MAX_INTENTOS_IP = 120;
const MAX_REGISTROS = 10000;

function claveBucket(valor) {
    return createHash("sha256").update(valor).digest("hex");
}

function registrarIntento(clave, ahora, maximo) {
    const anterior = intentos.get(clave);
    const registro = !anterior || ahora - anterior.inicio >= VENTANA_MS
        ? { inicio: ahora, cantidad: 0 }
        : anterior;
    if (registro.cantidad >= maximo) return Math.max(1, Math.ceil((registro.inicio + VENTANA_MS - ahora) / 1000));
    registro.cantidad += 1;
    // Reinsertar actualiza el orden para retirar primero los buckets menos recientes.
    intentos.delete(clave);
    intentos.set(clave, registro);
    return 0;
}

module.exports = function limitarIntentosLogin(req, res, next) {
    const ahora = Date.now();
    const email = typeof req.body?.email === "string" ? req.body.email.trim().slice(0, 254).toLowerCase() : "sin-email";
    const ip = String(req.ip || req.socket.remoteAddress || "desconocida").slice(0, 80);
    const esperaCuenta = registrarIntento(claveBucket(`cuenta\0${ip}\0${email}`), ahora, MAX_INTENTOS_CUENTA);
    const esperaIp = registrarIntento(claveBucket(`ip\0${ip}`), ahora, MAX_INTENTOS_IP);

    if (intentos.size > MAX_REGISTROS) {
        for (const [key, registro] of intentos) {
            if (ahora - registro.inicio >= VENTANA_MS || intentos.size > MAX_REGISTROS) intentos.delete(key);
        }
    }
    if (esperaCuenta || esperaIp) {
        res.setHeader("Retry-After", String(Math.max(esperaCuenta, esperaIp)));
        return res.status(429).json({ error: { code: "LOGIN_RATE_LIMIT", message: "Demasiados intentos de inicio de sesión. Esperá unos minutos e intentá nuevamente." } });
    }
    return next();
};
