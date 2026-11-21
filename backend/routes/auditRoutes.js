const express = require("express");
const controller = require("../controllers/reportsController");
const { autenticar, requierePermiso } = require("../middlewares/auth");
const { asyncHandler } = require("../middlewares/responses");
const router = express.Router();
router.use(autenticar);
router.get("/", requierePermiso("informes"), asyncHandler(controller.auditoria));
module.exports = router;
