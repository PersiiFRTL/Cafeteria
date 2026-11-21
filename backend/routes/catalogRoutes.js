const express = require("express");
const controller = require("../controllers/catalogController");
const { autenticar, requierePermiso: permiso, requiereAlgunPermiso: alguno } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);

router.get("/productos", alguno(["productos","comandas","nueva-comanda","preparacion","stock","produccion","recetas","dashboard"]), asyncHandler(controller.listarProductos));
router.get("/productos/:id", alguno(["productos","comandas","nueva-comanda","preparacion","stock","produccion","recetas","dashboard"]), asyncHandler(controller.obtenerProducto));
router.post("/productos", permiso("productos","interactuar"), asyncHandler(controller.crearProducto));
router.patch("/productos/:id", permiso("productos","interactuar"), asyncHandler(controller.editarProducto));
router.patch("/productos/:id/stock-minimo", permiso("productos","interactuar"), asyncHandler(controller.editarMinimoProducto));
router.patch("/productos/:id/estado", permiso("productos","interactuar"), asyncHandler(controller.estadoProducto));
router.delete("/productos/:id", permiso("productos","interactuar"), asyncHandler(controller.eliminarProducto));

router.get("/materias-primas", alguno(["materias-primas","stock","produccion","recetas","dashboard"]), asyncHandler(controller.listarMateriasPrimas));
router.get("/materias-primas/:id", alguno(["materias-primas","stock","produccion","recetas","dashboard"]), asyncHandler(controller.obtenerMateriaPrima));
router.post("/materias-primas", permiso("materias-primas","interactuar"), asyncHandler(controller.crearMateriaPrima));
router.patch("/materias-primas/:id", permiso("materias-primas","interactuar"), asyncHandler(controller.editarMateriaPrima));
router.patch("/materias-primas/:id/estado", permiso("materias-primas","interactuar"), asyncHandler(controller.estadoMateriaPrima));

router.get("/mesas", alguno(["mesas","comandas","nueva-comanda","mapa","dashboard"]), asyncHandler(controller.listarMesas));
router.get("/mesas/:id", alguno(["mesas","comandas","nueva-comanda","mapa","dashboard"]), asyncHandler(controller.obtenerMesa));
router.patch("/mesas/:id/estado", permiso("mesas","interactuar"), asyncHandler(require("../controllers/businessController").estadoMesa));

router.get("/comandas", alguno(["comandas","nueva-comanda","preparacion","dashboard"]), asyncHandler(controller.listarComandas));
router.get("/comandas/:id", alguno(["comandas","nueva-comanda","preparacion","dashboard"]), asyncHandler(controller.obtenerComanda));
router.post("/comandas", permiso("nueva-comanda","interactuar"), asyncHandler(require("../controllers/businessController").crearComanda));
router.patch("/comandas/:id", permiso("comandas","interactuar"), asyncHandler(require("../controllers/businessController").editarComanda));
router.post("/comandas/:id/productos", permiso("comandas","interactuar"), asyncHandler(require("../controllers/businessController").agregarProductos));
router.post("/comandas/:id/procesar-stock", permiso("preparacion","interactuar"), asyncHandler(require("../controllers/businessController").procesarStockComanda));
router.patch("/comandas/:id/items/:productoId/estado", permiso("preparacion","interactuar"), asyncHandler(require("../controllers/businessController").estadoItemComanda));
router.post("/comandas/:id/finalizar", permiso("comandas","interactuar"), asyncHandler(require("../controllers/businessController").finalizarComanda));
router.post("/comandas/:id/cancelar", permiso("comandas","interactuar"), asyncHandler(require("../controllers/businessController").cancelarComanda));

router.get("/recetas", alguno(["recetas","produccion"]), asyncHandler(controller.listarRecetas));
router.get("/recetas/:productoId", alguno(["recetas","produccion"]), asyncHandler(controller.obtenerReceta));
router.put("/recetas/:productoId", permiso("recetas","interactuar"), asyncHandler(controller.guardarReceta));
router.patch("/recetas/:productoId/estado", permiso("recetas","interactuar"), asyncHandler(controller.estadoReceta));
router.get("/perfiles/nombres", alguno(["empleados","dashboard","comandas","nueva-comanda","preparacion","stock","produccion","informes"]), asyncHandler(controller.nombresPerfiles));
module.exports = router;
