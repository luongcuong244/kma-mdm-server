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
    isSystemApp: {
        type: Boolean,
        default: false,
    },
    versions: {
        type: [
            {
                versionName: { type: String, required: true },
                versionCode: { type: Number, required: true },
                url: { type: String, default: null },
            }
        ],
        default: [],
    },
    showIcon: {
        type: Boolean,
        default: false,
    },
    iconUrl: {
        type: String,
        default: null,
    },
    iconText: {
        type: String,
        default: null,
    },
},
);

module.exports = mongoose.model('Application', applicationSchema);