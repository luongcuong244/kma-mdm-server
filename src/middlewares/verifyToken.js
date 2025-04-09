const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
require("dotenv").config();

const verifyAccessToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies.accessToken;
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
        if (err)
            return res.status(403).json({
                message: " Invalid access token",
            });
        console.log(decode);
        req.user = decode;
        next();
    });
});

const isAdmin = asyncHandler(async (req, res, next) => {
    const { role } = req.user;
    if (role !== "admin")
        return res.status(401).json({
            message: "REQUIRE ADMIN ROLE",
        });
    next();
});

module.exports = {
    verifyAccessToken,
    isAdmin,
};