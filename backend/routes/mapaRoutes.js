const express = require("express");
const controller = require("../controllers/businessController");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/", requierePermiso("mapa"), asyncHandler(controller.obtenerMapa));
router.put("/", requierePermiso("mapa","interactuar"), asyncHandler(controller.guardarMapa));
module.exports = router;
