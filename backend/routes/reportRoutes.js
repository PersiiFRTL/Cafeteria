const express = require("express");
const controller = require("../controllers/reportsController");
const { autenticar, requiereRol } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar, requiereRol("ADMINISTRADOR"));
router.get("/ventas", asyncHandler(controller.ventas));
module.exports = router;
