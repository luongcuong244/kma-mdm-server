var express = require("express");
var router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/application.controllers");

router.get("/get-all", [verifyAccessToken], controller.getAll);
router.get("/get-app-icon", [verifyAccessToken], controller.getAppIcon);
router.post("/add-app-icon", [verifyAccessToken], controller.addAppIcon);
router.post("/add-application", [verifyAccessToken], controller.addApplication);
router.post("/edit-application", [verifyAccessToken], controller.editApplication);
router.get("/get-application", [verifyAccessToken], controller.getApplicationByPackageName);
router.post("/add-apk-version", [verifyAccessToken], controller.addApkVersion);
router.post("/delete-apk-version", [verifyAccessToken], controller.deleteApkVersion);

module.exports = router;