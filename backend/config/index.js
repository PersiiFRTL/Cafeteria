const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

module.exports = {
    port: Number(process.env.PORT || 3000),
    frontendOrigins: new Set((process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
        .split(",").map((origin) => origin.trim()).filter(Boolean)),
    trustProxy: process.env.TRUST_PROXY === "1",
    performanceLogs: process.env.PERF_LOG === "1"
};
