const mongoose = require('mongoose');
const schema = mongoose.Schema;

const appIconSchema = new schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    url: {
        type: String,
        required: true,
    },
},
);

module.exports = mongoose.model('AppIcon', appIconSchema);