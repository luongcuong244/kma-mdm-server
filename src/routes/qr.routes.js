const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/qr.controller");

router.get("/:configutationId", [verifyAccessToken], controller.generateQrCode);

module.exports = router;