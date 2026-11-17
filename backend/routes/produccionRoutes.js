const express = require("express");
const controller = require("../controllers/businessController");
const { autenticar } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/", asyncHandler(controller.producciones));
router.post("/", asyncHandler(controller.registrarProduccion));
module.exports = router;
