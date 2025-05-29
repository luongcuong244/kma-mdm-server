var express = require("express");
var router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/device.controllers");

router.get("/get-device-list", [verifyAccessToken], controller.getDeviceList);
router.post("/add-new-device", [verifyAccessToken], controller.addNewDevice);
router.get("/get-device-by-id", [verifyAccessToken], controller.getDeviceById);
router.get("/get-device-by-id-for-remote-control", [verifyAccessToken], controller.getDeviceIdForRemoteControl);
router.post("/delete-device-by-id", [verifyAccessToken], controller.deleteDeviceById);
router.post("/update-device-by-id", [verifyAccessToken], controller.updateDeviceById);

module.exports = router;