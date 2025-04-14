var express = require("express");
var router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/configuration.controllers");

// app
router.get("/get-server-config", controller.getServerConfig);

// web
router.get("/get-all", [verifyAccessToken], controller.getAll);
router.get("/get-configuration", [verifyAccessToken], controller.getConfiguration);

module.exports = router;