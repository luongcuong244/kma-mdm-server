const mongoose = require('mongoose');
const schema = mongoose.Schema;

const deviceInfoSchema = new schema({
    deviceId: {
        required: true,
        type: String
    },
    deviceName: {
        required: true,
        type: String
    },
},
);

module.exports = mongoose.model('DeviceInfo', deviceInfoSchema);