const mongoose = require('mongoose');
const schema = mongoose.Schema;

const deviceInfoSchema = new schema({
    deviceName: {
        required: true,
        type: String
    },
    deviceModel: {
        required: true,
        type: String
    },
    deviceBrand: {
        required: true,
        type: String
    },
    deviceProduct: {
        required: true,
        type: String
    },
    deviceManufacturer: {
        required: true,
        type: String
    },
    deviceSerial: {
        required: true,
        type: String
    },
    deviceHardware: {
        required: true,
        type: String
    },
    deviceBuildId: {
        required: true,
        type: String
    },
    androidVersion: {
        required: true,
        type: String
    },
    androidSdkVersion: {
        required: true,
        type: String
    },
    androidId: {
        required: true,
        type: String
    },
    imei: {
        required: true,
        type: String
    },
    cpuArch: {
        required: true,
        type: String
    },
    cpuCores: {
        required: true,
        type: Number
    },
    totalRAM: {
        required: true,
        type: Number
    },
    totalStorage: {
        required: true,
        type: Number
    }
},
);

module.exports = mongoose.model('DeviceInfo', deviceInfoSchema);