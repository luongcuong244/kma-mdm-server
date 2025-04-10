const User = require("../../models/user.model");

exports.getCurrentInfo = async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id);
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }
    const { password, refreshToken, ...userData } = user.toObject();
    return res.status(200).json({
        ...userData,
    });
}

exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        return res.status(400).json({
            message: "Thông tin không hợp lệ",
        });
    }
    const { _id } = req.user;
    const user = await User.findById(_id);
    if (!user) {
        return res.status(404).json({
            message: "Người dùng không tồn tại",
        });
    }
    const isMatch = await user.isCorrectPassword(oldPassword);
    if (!isMatch) {
        return res.status(400).json({
            message: "Mật khẩu cũ không chính xác",
        });
    }
    user.password = newPassword;
    user.refreshToken = null;
    await user.save();
    // clear jwt token from cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({
        message: "Password changed successfully",
    });
}