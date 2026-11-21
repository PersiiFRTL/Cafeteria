const express = require("express");
const controller = require("../controllers/reportsController");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/ventas", requierePermiso("informes"), asyncHandler(controller.ventas));
module.exports = router;
