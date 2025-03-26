var express = require("express");
var router = express.Router();

const {
    getServerConfig,
} = require("../controllers/restful/configuration.controllers");

router.get("/get-server-config", getServerConfig);

module.exports = router;