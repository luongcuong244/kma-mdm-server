const User = require("../../models/user.model");
const Device = require("../../models/device.model");

exports.getCurrentInfo = async (req, res) => {
    const { _id } = req.user;
    const user = await User.findById(_id);
    if (!user) {
        return res.status(404).json({
            message: "User not found",
        });
    }

    // get current managed devices count
    const managedDevicesCount = await user.countManagedDevices();

    const { password, refreshToken, ...userData } = user.toObject();
    return res.status(200).json({
        ...userData,
        managedDevicesCount: managedDevicesCount,
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

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({
            role: "user",
        }, "-password -refreshToken");

        const usersWithDeviceCount = await Promise.all(
            users.map(async user => {
                return {
                    ...user.toObject(),
                    countUsedDevice: await user.countManagedDevices(),
                };
            })
        );

        return res.status(200).json({
            message: "Users retrieved successfully",
            data: usersWithDeviceCount,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving users",
            error: error.message,
        });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { userName, password, maxManagedDevices, maxProvidedStorage } = req.body;
        if (!userName || !password) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }
        const existingUser = await User.findOne({ userName });
        if (existingUser) {
            return res.status(400).json({
                message: "Người dùng đã tồn tại",
            });
        }
        const newUser = new User({
            userName,
            password,
            maxManagedDevices: maxManagedDevices || 5, // Giới hạn thiết bị quản lý tối đa
            maxProvidedStorage: maxProvidedStorage || 10, // Giới hạn dung lượng lưu trữ tối đa (tính bằng GB)
        });
        await newUser.save();
        return res.status(201).json({
            message: "User created successfully",
            data: {
                _id: newUser._id,
                username: newUser.userName,
                role: newUser.role,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi khi tạo người dùng (500)",
            error: error.message,
        });
    }
}

exports.updateUser = async (req, res) => {
    try {
        const { userId, userName, maxManagedDevices, maxProvidedStorage } = req.body;

        if (!userId || !userName) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        const user = await User.findById({
            _id: userId,
        });

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        if (user.role !== "user") {
            return res.status(403).json({
                message: "Không thể cập nhật người dùng này",
            });
        }

        user.userName = userName;
        
        if (maxManagedDevices && maxManagedDevices > 0) {
            // get current managed devices count
            const currentManagedDevicesCount = await user.countManagedDevices();
            if (currentManagedDevicesCount > maxManagedDevices) {
                return res.status(400).json({
                    message: "Số lượng thiết bị quản lý hiện tại vượt quá giới hạn mới",
                });
            }
            user.maxManagedDevices = maxManagedDevices;
        }

        if (maxProvidedStorage && maxProvidedStorage > 0) {
            user.maxProvidedStorage = maxProvidedStorage;
        }

        await user.save();
        return res.status(200).json({
            message: "User updated successfully",
            data: user,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi khi cập nhật người dùng (500)",
            error: error.message,
        });
    }
}

exports.changeUserPassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;

        if (!userId || !newPassword) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        user.password = newPassword;
        user.refreshToken = null; // Clear refresh token
        await user.save();

        return res.status(200).json({
            message: "Mật khẩu người dùng đã được thay đổi thành công",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi khi thay đổi mật khẩu người dùng (500)",
            error: error.message,
        });
    }
}

exports.lockUser = async (req, res) => {
    try {
        const { userId, reason } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        user.isBlocked = true;
        user.blockedReason = reason || "Bị khóa bởi quản trị viên";
        user.refreshToken = null; // Clear refresh token
        await user.save();

        return res.status(200).json({
            message: "Người dùng đã bị khóa thành công",
        });
    } catch (error) {
        console.error("Error locking user:", error);
        return res.status(500).json({
            message: "Lỗi khi khóa người dùng (500)",
            error: error.message,
        });
    }
}

exports.unlockUser = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "Người dùng không tồn tại",
            });
        }

        user.isBlocked = false;
        user.blockedReason = null;
        await user.save();

        return res.status(200).json({
            message: "Người dùng đã được mở khóa thành công",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Lỗi khi mở khóa người dùng (500)",
            error: error.message,
        });
    }
}