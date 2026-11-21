// Jest no ejecuta el entorno de compilación de Vite; las pruebas usan rutas relativas.
module.exports.urlApi = (ruta) => ruta.startsWith("/") ? ruta : `/${ruta}`;
