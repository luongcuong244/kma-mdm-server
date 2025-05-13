const mongoose = require('mongoose');
const schema = mongoose.Schema;

const pushMessageSchema = new schema({
    deviceId: {
        type: String,
        required: true,
    },
    messageType: {
        type: String,
        required: true,
    },
    payload: {
        type: Object,
        default: {},
    },
    status: {
        type: String,
        enum: ['pending', 'sent'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
},
);

module.exports = mongoose.model('PushMessage', pushMessageSchema);