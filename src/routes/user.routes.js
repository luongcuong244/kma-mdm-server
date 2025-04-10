const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/user.controllers");

router.get("/get-current-info", [verifyAccessToken], controller.getCurrentInfo);
router.post("/change-password", [verifyAccessToken], controller.changePassword);

module.exports = router;