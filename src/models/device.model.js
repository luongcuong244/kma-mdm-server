const mongoose = require('mongoose');
const schema = mongoose.Schema;
const configurationModel = require('./configuration.model');

const deviceSchema = new schema({
    deviceId: {
        required: true,
        type: String
    },
    description: {
        type: String,
        default: null,
    },
    configuration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: configurationModel,
        required: true,
    },
    phoneNumber: {
        type: String,
        default: null,
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive',
    },
    deviceInfo: {
        type: Object,
        default: null,
    },
    enrollDate: {
        type: Date,
        default: null,
    },
    qrCode: {
        type: String,
        default: null,
    },
},
);

module.exports = mongoose.model('Device', deviceSchema);