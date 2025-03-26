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
    }
},
);

module.exports = mongoose.model('Application', applicationSchema);