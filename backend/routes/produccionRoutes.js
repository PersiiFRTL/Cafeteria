const express = require("express");
const controller = require("../controllers/businessController");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/", requierePermiso("produccion"), asyncHandler(controller.producciones));
router.post("/", requierePermiso("produccion","interactuar"), asyncHandler(controller.registrarProduccion));
module.exports = router;
