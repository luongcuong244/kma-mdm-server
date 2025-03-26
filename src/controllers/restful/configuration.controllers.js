const asyncHandler = require("express-async-handler");
const configurationModel = require("../../models/configuration.model");

const getServerConfig = asyncHandler(async (req, res) => {
    let config = await configurationModel.findOne();
    if (config) {
        res.status(200).json({
            message: "Get server config successfully",
            data: config,
        });
    }
    res.status(404);
});

module.exports = {
    getServerConfig,
};