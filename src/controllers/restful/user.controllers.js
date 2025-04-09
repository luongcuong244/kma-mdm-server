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