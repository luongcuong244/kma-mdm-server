const express = require('express');
const router = express.Router();

const controller = require("../controllers/restful/auth.controllers");
const { verifyAccessToken } = require('../middlewares/verifyToken');

router.post("/sign-in", controller.signIn);
router.post("/sign-out", [verifyAccessToken], controller.signOut);

module.exports = router;