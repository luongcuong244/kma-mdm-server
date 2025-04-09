const express = require('express');
const router = express.Router();

const controller = require("../controllers/restful/auth.controllers");

router.post("/sign-in", controller.signIn);

module.exports = router;