const application = require('./application.model');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const applicationSettingSchema = new schema({
    application: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: application,
    },
    attribute: {
        requiered: true,
        type: String
    },
    value: {
        required: true,
        type: String
    },
    comment: {
        type: String,
        default: null,
    },
},
);

module.exports = mongoose.model('ApplicationSetting', applicationSettingSchema);