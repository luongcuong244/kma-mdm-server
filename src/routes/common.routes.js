const express = require('express');
const router = express.Router();

router.get("/ping", (_, res) => {
    console.log("Ping received");
    return res.sendStatus(204);
})

router.get("/nonce", (_, res) => {
    console.log("Get nonce received");
    return res.send("nonce");
})

module.exports = router;