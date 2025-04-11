var express = require("express");
var router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/configuration.controllers");

router.get("/get-all", [verifyAccessToken], controller.getAll);
router.get("/get-server-config", controller.getServerConfig);

module.exports = router;