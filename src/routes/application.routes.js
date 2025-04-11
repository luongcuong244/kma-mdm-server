var express = require("express");
var router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/application.controllers");

router.get("/get-all", [verifyAccessToken], controller.getAll);
router.post("/add", [verifyAccessToken], controller.addApplication);

module.exports = router;