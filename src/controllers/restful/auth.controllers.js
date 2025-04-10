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
            message: "Vui lòng điền đầy đủ thông tin!",
        });
    }
    // Check if user exists
    let user = await User.findOne({ userName: reqUserName });
    if (!user) {
        console.log("User not found!");
        return res.status(400).send({
            message: "Nguời dùng không tồn tại!",
        });
    }
    // Check if password is correct
    const isMatch = await user.isCorrectPassword(reqPassword);
    if (!isMatch) {
        console.log("Incorrect password!");
        return res.status(400).send({
            message: "Mật khẩu không chính xác!",
        });
    }
    // Check if user is blocked
    if (user.isBlocked) {
        console.log("User is blocked!");
        return res.status(400).send({
            message: "Người dùng đã bị khóa!",
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

exports.signOut = async (req, res) => {
    const { _id } = req.user;
    // Xóa refresh token trong cơ sở dữ liệu
    await User.findByIdAndUpdate(
        _id,
        { refreshToken: null },
        { new: true }
    );
    // Xóa cookie
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    // Trả về thông báo thành công
    return res.status(200).json({
        message: "Đăng xuất thành công!",
    });
}