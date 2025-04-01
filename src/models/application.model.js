const mongoose = require('mongoose');
const schema = mongoose.Schema;

const applicationSchema = new schema({
    name: {
        reuired: true,
        type: String
    },
    pkg: {
        requiered: true,
        type: String
    },
    versionName: {
        required: true,
        type: String
    },
    versionCode: {
        required: true,
        type: Number,
    },
    url: {
        type: String,
        default: null,
    },
    iconUrl: {
        type: String,
        default: null,
    },
    iconText: {
        type: String,
        default: null,
    },
    screenOrder: {
        type: Number,
        default: 0,
    },
    showIcon: {
        type: Boolean,
        default: true,
    },
    remove: {
        type: Boolean,
        default: false,
    },
    runAfterInstall: {
        type: Boolean,
        default: false,
    },
    runAtBoot: {
        type: Boolean,
        default: false,
    },
},
);

module.exports = mongoose.model('Application', applicationSchema);