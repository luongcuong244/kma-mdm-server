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
    version: {
        required: true,
        type: String
    },
    url: {
        type: String,
        default: null,
    },
    icon: {
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