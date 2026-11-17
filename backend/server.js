const app = require("./app");
const config = require("./config");

if (require.main === module) {
    const server = app.listen(config.port, () => {
        console.log(`Backend de Cafetería escuchando en el puerto ${config.port}`);
    });
    const cerrar = () => server.close(() => process.exit(0));
    process.on("SIGINT", cerrar);
    process.on("SIGTERM", cerrar);
}

module.exports = app;
