checkUserName = (req, res, next) => {
    next();
};

const verifySignUp = {
    checkUserName: checkUserName,
};

module.exports = verifySignUp;