const mongoose = require('mongoose');
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
    // Common Settings
    name: {
        required: true,
        unique: true,
        type: mongoose.Schema.Types.String,
    },
    description: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    adminPassword: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    gps: {
        type: mongoose.Schema.Types.String,
        enum: ['Any', 'Disabled', 'Enabled'],
        default: 'Any',
    },
    bluetooth: {
        type: mongoose.Schema.Types.String,
        enum: ['Any', 'Disabled', 'Enabled'],
        default: 'Any',
    },
    wifi: {
        type: mongoose.Schema.Types.String,
        enum: ['Any', 'Disabled', 'Enabled'],
        default: 'Any',
    },
    mobileData: {
        type: mongoose.Schema.Types.String,
        enum: ['Any', 'Disabled', 'Enabled'],
        default: 'Any',
    },
    blockUSBStorage: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    manageScreenTimeout: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    screenTimeout: {
        type: mongoose.Schema.Types.Number,
        default: 60,
    },
    lockVolume: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    manageVolume: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    volumeValue: {
        type: mongoose.Schema.Types.Number,
        default: 50,
    },
    disableScreenCapture: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    // Design Settings
    useDefaultDesign: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    backgroundColor: {
        type: mongoose.Schema.Types.String,
        default: "#FFFFFF",
    },
    textColor: {
        type: mongoose.Schema.Types.String,
        default: "#000000",
    },
    backgroundImageUrl: {
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
    displayTimeAndBatteryState: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    // Applications
    applications: {
        type: mongoose.Schema.Types.Array,
        // ref: applicationConfig,
        default: [],
    },
    // Mdm Settings
    kioskMode: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    mdmApp: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    mdmChecksum: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    adminReceiverClass: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
    kioskApps: {
        type: mongoose.Schema.Types.Array,
        default: [],
    },
    showKioskExitButton: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    lockThePowerButton: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
    wifiSSID: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    wifiPassword: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    restrictions: {
        type: mongoose.Schema.Types.String,
        default: null,
    },
    // Application Settings
    applicationSettings: {
        type: mongoose.Schema.Types.Array,
        ref: applicationSettingModel,
        default: [],
    },
    // Others
    // device: {
    //     required: true,
    //     unique: true,
    //     type: mongoose.Schema.Types.String,
    //     ref: deviceInfoModel,
    // },
    runDefaultLauncher: {
        type: mongoose.Schema.Types.Boolean,
        default: false,
    },
},
);

module.exports = mongoose.model('Configuration', configurationSchema);