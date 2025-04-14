const Configuration = require("../../models/configuration.model");
const mongoose = require("mongoose");

exports.getAll = async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm || "";

        // Tạo điều kiện tìm kiếm nếu có searchTerm
        const filter = searchTerm
            ? {
                $or: [
                    { name: { $regex: searchTerm, $options: "i" } },
                    { description: { $regex: searchTerm, $options: "i" } },
                ],
            }
            : {};

        const configurations = await Configuration.find(filter);

        return res.status(200).json({
            data: configurations,
        });
    } catch (err) {
        console.error("Error fetching configurations:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

exports.getConfiguration = async (req, res) => {
    try {
        const id = req.query.id;

        const configuration = await Configuration.findById(id)

        if (!configuration) {
            return res.status(404).json({
                message: "Không tìm thấy cấu hình",
            });
        }

        return res.status(200).json({
            data: configuration,
        });
    } catch (err) {
        console.error("Error fetching configuration:", err);
        return res.status(500).json({
            message: "Lỗi server",
        });
    }
};

exports.getServerConfig = async (req, res) => {
    let config = await Configuration.findOne()
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
}