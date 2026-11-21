const express = require("express");
const controller = require("../controllers/businessController");
const { autenticar, requierePermiso, requiereAlgunPermiso } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/movimientos", requiereAlgunPermiso(["stock", "produccion", "preparacion", "dashboard"]), asyncHandler(controller.movimientosStock));
router.post("/movimientos", requierePermiso("stock","interactuar"), asyncHandler(controller.registrarMovimiento));
module.exports = router;
