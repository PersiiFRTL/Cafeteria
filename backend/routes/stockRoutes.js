const express = require("express");
const controller = require("../controllers/businessController");
const { autenticar } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/movimientos", asyncHandler(controller.movimientosStock));
router.post("/movimientos", asyncHandler(controller.registrarMovimiento));
module.exports = router;
