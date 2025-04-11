const application = require('./application.model');
const mongoose = require('mongoose');
const schema = mongoose.Schema;

const applicationConfigSchema = new schema({
    application: {
        required: true,
        type: mongoose.Schema.Types.ObjectId,
        ref: application,
    },
    version: {
        required: true,
        type: {
            versionName: { type: String, required: true },
            versionCode: { type: Number, required: true },
            url: { type: String, default: null },
        },
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

module.exports = mongoose.model('ApplicationConfig', applicationConfigSchema);