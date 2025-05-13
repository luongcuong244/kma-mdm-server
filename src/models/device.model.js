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
    factoryReset: {
        type: Boolean,
        default: false,
    },
    factoryResetRequested: {
        type: Date,
        default: null,
    },
    factoryResetConfirmed: {
        type: Date,
        default: null,
    },
    reboot: {
        type: Boolean,
        default: false,
    },
    rebootRequested: {
        type: Date,
        default: null,
    },
    rebootConfirmed: {
        type: Date,
        default: null,
    },
    lock: {
        type: Boolean,
        default: false,
    },
    lockMessage: {
        type: String,
        default: null,
    },
    passwordReset: {
        type: mongoose.Schema.Types.String,
        default: null,
    }
},
);

module.exports = mongoose.model('Device', deviceSchema);