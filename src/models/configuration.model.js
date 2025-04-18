const mongoose = require('mongoose');
const applicationModel = require('./application.model');
const deviceInfoModel = require('./deviceInfo.model');
const applicationSettingModel = require('./application_setting.model');
const applicationConfig = require('./application_config.model');
const schema = mongoose.Schema;

const ICON_SIZES = {
    SMALL: 100,
    AVERAGE: 120,
    LARGE: 140,
};

const configurationSchema = new schema({
    name: {
        required: true,
        unique: true,
        type: mongoose.Schema.Types.String,
    },
    description: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    device: {
        required: true,
        unique: true,
        type: mongoose.Schema.Types.String,
        ref: deviceInfoModel,
    },
    applications: {
        type: mongoose.Schema.Types.Array,
        ref: applicationConfig,
        default: [],
    },
    applicationSettings: {
        type: mongoose.Schema.Types.Array,
        ref: applicationSettingModel,
        default: [],
    },
    backgroundColor: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    backgroundImageUrl: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    textColor: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    iconSize: {
        type: mongoose.Schema.Types.Number,
        enum: Object.values(ICON_SIZES),
        default: ICON_SIZES.SMALL,
    },
    orientation: {
        type: mongoose.Schema.Types.Number,
        enum: [0, 1, 2], // 1: portrait, 2: landscape
        default: 0,
    },
    runDefaultLauncher: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    restrictions: {
        type: mongoose.Schema.Types.String,
        default: null,
    },

    // kiosk mode
    kioskMode: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    kioskApps: {
        type: mongoose.Schema.Types.Array,
        default: [],
    },
},
);

module.exports = mongoose.model('Configuration', configurationSchema);