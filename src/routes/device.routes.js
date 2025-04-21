var express = require("express");
var router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/device.controllers");

router.get("/get-device-list", [verifyAccessToken], controller.getDeviceList);
router.post("/add-new-device", [verifyAccessToken], controller.addNewDevice);

module.exports = router;