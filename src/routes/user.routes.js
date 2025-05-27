const express = require('express');
const router = express.Router();
const { verifyAccessToken, isAdmin } = require("../middlewares/verifyToken");

const controller = require("../controllers/restful/user.controllers");

router.get("/get-current-info", [verifyAccessToken], controller.getCurrentInfo);
router.post("/change-password", [verifyAccessToken], controller.changePassword);
router.get("/get-all-users", [verifyAccessToken, isAdmin], controller.getAllUsers);
router.post("/create-user", [verifyAccessToken, isAdmin], controller.createUser);
router.post("/update-user", [verifyAccessToken, isAdmin], controller.updateUser);
router.post("/change-user-password", [verifyAccessToken, isAdmin], controller.changeUserPassword);
router.post("/lock-user", [verifyAccessToken, isAdmin], controller.lockUser);
router.post("/unlock-user", [verifyAccessToken, isAdmin], controller.unlockUser);

module.exports = router;