const mongoose = require('mongoose');
const bcrypt = require("bcryptjs");
const schema = mongoose.Schema;

const userSchema = new schema({
    userName: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    role: {
        required: true,
        type: String,
        enum: ['admin', 'user'],
        default: 'user'
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    blockedReason: {
        type: String,
        default: null,
    },
    maxManagedDevices: {
        type: Number,
        default: 10,
    },
    maxProvidedStorage: {
        type: Number,
        default: 10, // Giới hạn dung lượng lưu trữ tối đa (tính bằng GB)
    },
    refreshToken: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
},
);

userSchema.pre("save", async function (next) {
    try {
        // Mã hóa mật khẩu nếu có thay đổi
        if (this.isModified("password")) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }
        next(); // Tiếp tục
    } catch (err) {
        next(err); // Truyền lỗi đến middleware xử lý lỗi
    }
});

userSchema.methods = {
    isCorrectPassword: async function (password) {
        if (!this.password) return false;
        return bcrypt.compare(password, this.password);
    },
    countManagedDevices: async function () {
        const Device = require('./device.model'); // Thay đổi đường dẫn nếu cần
        return await Device.countDocuments({ managedBy: this._id });
    },
};

module.exports = mongoose.model('User', userSchema);