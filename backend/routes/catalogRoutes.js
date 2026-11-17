const express = require("express");
const controller = require("../controllers/catalogController");
const { autenticar } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);

router.get("/productos", asyncHandler(controller.listarProductos));
router.get("/productos/:id", asyncHandler(controller.obtenerProducto));
router.post("/productos", asyncHandler(controller.crearProducto));
router.patch("/productos/:id", asyncHandler(controller.editarProducto));
router.patch("/productos/:id/stock-minimo", asyncHandler(controller.editarMinimoProducto));
router.patch("/productos/:id/estado", asyncHandler(controller.estadoProducto));
router.delete("/productos/:id", asyncHandler(controller.eliminarProducto));

router.get("/materias-primas", asyncHandler(controller.listarMateriasPrimas));
router.get("/materias-primas/:id", asyncHandler(controller.obtenerMateriaPrima));
router.post("/materias-primas", asyncHandler(controller.crearMateriaPrima));
router.patch("/materias-primas/:id", asyncHandler(controller.editarMateriaPrima));
router.patch("/materias-primas/:id/estado", asyncHandler(controller.estadoMateriaPrima));

router.get("/mesas", asyncHandler(controller.listarMesas));
router.get("/mesas/:id", asyncHandler(controller.obtenerMesa));
router.patch("/mesas/:id/estado", asyncHandler(require("../controllers/businessController").estadoMesa));

router.get("/comandas", asyncHandler(controller.listarComandas));
router.get("/comandas/:id", asyncHandler(controller.obtenerComanda));
router.post("/comandas", asyncHandler(require("../controllers/businessController").crearComanda));
router.patch("/comandas/:id", asyncHandler(require("../controllers/businessController").editarComanda));
router.post("/comandas/:id/productos", asyncHandler(require("../controllers/businessController").agregarProductos));
router.post("/comandas/:id/procesar-stock", asyncHandler(require("../controllers/businessController").procesarStockComanda));
router.patch("/comandas/:id/items/:productoId/estado", asyncHandler(require("../controllers/businessController").estadoItemComanda));
router.post("/comandas/:id/finalizar", asyncHandler(require("../controllers/businessController").finalizarComanda));
router.post("/comandas/:id/cancelar", asyncHandler(require("../controllers/businessController").cancelarComanda));

router.get("/recetas", asyncHandler(controller.listarRecetas));
router.get("/recetas/:productoId", asyncHandler(controller.obtenerReceta));
router.put("/recetas/:productoId", asyncHandler(controller.guardarReceta));
router.patch("/recetas/:productoId/estado", asyncHandler(controller.estadoReceta));
router.get("/perfiles/nombres", asyncHandler(controller.nombresPerfiles));
module.exports = router;
