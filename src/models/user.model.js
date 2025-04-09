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
    refreshToken: {
        type: String,
        default: null,
    }
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
        return await bcrypt.compare(password, this.password);
    },
};

module.exports = mongoose.model('User', userSchema);