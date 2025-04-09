var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
    return res.status(200).send({
        message: "User registered successfully!",
    });
};

exports.signin = (req, res) => {
    return res.status(200).send({
        message: "User signed in successfully!",
    });
};