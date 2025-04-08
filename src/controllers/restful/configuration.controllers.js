const asyncHandler = require("express-async-handler");
const configurationModel = require("../../models/configuration.model");

const getServerConfig = asyncHandler(async (req, res) => {
    let config = await configurationModel.findOne()
    .populate("allowedApplications")
    .populate({
        path: "applicationSettings",
        populate: {
            path: "application", // chính là field bên trong applicationSetting
            model: "Application"
        }
    })
    .exec()
    
    if (config) {
        return res.status(200).json({
            message: "Get server config successfully",
            data: config,
        });
    }
    return res.status(404);
});

module.exports = {
    getServerConfig,
};