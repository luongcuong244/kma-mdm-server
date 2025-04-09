const User = require("../../models/user.model");
const {
    generateAccessToken,
    generateRefreshToken,
} = require("../../middlewares/jwt");

exports.signIn = async (req, res) => {
    let reqUserName = req.body.userName;
    let reqPassword = req.body.password;
    if (!reqUserName || !reqPassword) {
        console.log("Please fill in all fields!");
        return res.status(400).send({
            message: "Please fill in all fields!",
        });
    }
    // Check if user exists
    let user = await User.findOne({ userName: reqUserName });
    if (!user) {
        console.log("User not found!");
        return res.status(400).send({
            message: "User not found!",
        });
    }
    // Check if password is correct
    const isMatch = user.isCorrectPassword(reqPassword);
    if (!isMatch) {
        console.log("Incorrect password!");
        return res.status(400).send({
            message: "Incorrect password!",
        });
    }
    // Check if user is blocked
    if (user.isBlocked) {
        console.log("User is blocked!");
        return res.status(400).send({
            message: "User is blocked!",
        });
    }
    // Create token
    const { password, refreshToken, ...userData } = user.toObject();
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    await User.findByIdAndUpdate(
        user._id,
        { refreshToken: newRefreshToken },
        { new: true }
    );
    // Lưu access token vào cookie
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
    });
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
    });
    // Trả về thông tin người dùng
    return res.status(200).json({
        userInfo: userData,
    });
};