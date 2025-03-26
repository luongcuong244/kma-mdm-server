const mongoose = require('mongoose');
const applicationModel = require('./application.model');
const deviceInfoModel = require('./deviceInfo.model');
const schema = mongoose.Schema;

const configurationSchema = new schema({
    device: {
        required: true,
        unique: true,
        type: mongoose.Schema.Types.String,
        ref: deviceInfoModel,
    },
    allowedApplications: {
        type: mongoose.Schema.Types.Array,
        ref: applicationModel,
        default: [],
    },
},
);

module.exports = mongoose.model('Configuration', configurationSchema);