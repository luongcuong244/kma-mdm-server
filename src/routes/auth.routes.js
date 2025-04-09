const express = require('express');
const router = express.Router();

const verifySignUp = require("../middlewares/verify_signup.middleware");
const controller = require("../controllers/restful/auth.controllers");

router.post("/signin", controller.signin);
router.post("/signup", [verifySignUp.checkUserName], controller.signup);

module.exports = router;