const Configuration = require("../../models/configuration.model");
const Device = require("../../models/device.model");
const AppIcon = require("../../models/app_icon.model");

const { getSHA1String } = require("../../helper/crypto");

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
    const { deviceInfo, deviceId, signature } = req.body;

    if (!deviceId) {
        console.log("Thiếu deviceId");
        return res.status(400).json({
            message: "Thiếu deviceId",
        });
    }

    if (!signature) {
        console.log("Thiếu chữ ký");
        return res.status(400).json({
            message: "Thiếu chữ ký",
        });
    }

    const serverSignature = getSHA1String(process.env.MOBILE_SIGNATURE + deviceId);

    if (serverSignature !== signature) {
        console.log("Chữ ký không hợp lệ");
        return res.status(400).json({
            message: "Chữ ký không hợp lệ",
        });
    }

    console.log("deviceId: ", deviceId);
    console.log("signature: ", signature);
    console.log("Device Info: ", deviceInfo);

    let device = await Device.findOne({ deviceId })
        .populate({
            path: "configuration",
            populate: {
                path: "applications",
                populate: {
                    path: "application",
                    populate: {
                        path: "icon",
                        model: "AppIcon",
                    }
                }
            }
        })
        .exec()

    if (!device) {
        console.log("Device không tồn tại");
        return res.status(400).json({
            message: "Device không tồn tại",
        });
    }

    for (const appSetting of device.configuration.applicationSettings) {
        if (appSetting.application && appSetting.application.icon) {
            appSetting.application.icon = await AppIcon.findById(appSetting.application.icon);
        }
    }

    let deviceInfoObj = device.deviceInfo;

    if (deviceInfoObj) {
        // Check if deviceInfo is different
        if (deviceInfoObj.deviceBuildId !== deviceInfo.deviceBuildId) {
            console.log("DeviceId này đã được đăng ký trên thiết bị khác");
            return res.status(400).json({
                message: "DeviceId này đã được đăng ký trên thiết bị khác",
            });
        }
    } else {
        // update deviceInfo
        await Device.findByIdAndUpdate(
            device._id,
            {
                deviceInfo: deviceInfo,
                enrollDate: new Date(),
            },
            { new: true }
        )
    }

    if (!device.configuration) {
        console.log("Device chưa có cấu hình");
        return res.status(400).json({
            message: "Device chưa có cấu hình",
        });
    }

    const data = {
        ...JSON.parse(JSON.stringify(device.configuration)),
        factoryReset: device.factoryReset,
        reboot: device.reboot,
        lock: device.lock,
        lockMessage: device.lockMessage,
        passwordReset: device.passwordReset,
    };

    if (device.reboot) {
        device.rebootConfirmed = new Date();
        device.reboot = false;
    }
    if (device.factoryReset) {
        device.factoryResetConfirmed = new Date();
        device.factoryReset = false;
    }
    await device.save();

    return res.status(200).json({
        message: "Get server config successfully",
        data,
    });
}

exports.saveConfiguration = async (req, res) => {
    try {
        const { configuration } = req.body;
        const { _id } = configuration;
        // Kiểm tra xem _id có tồn tại không
        if (_id) {
            // Nếu có, cập nhật cấu hình
            const updatedConfiguration = await Configuration.findByIdAndUpdate(
                _id,
                configuration,
                { new: true }
            );
            if (!updatedConfiguration) {
                return res.status(404).json({
                    message: "Không tìm thấy cấu hình",
                });
            }
        } else {
            // Nếu không có, tạo mới cấu hình
            const newConfiguration = new Configuration(configuration);
            await newConfiguration.save();
        }
        // Trả về cấu hình đã lưu
        return res.status(200).json({
            message: "Lưu cấu hình thành công",
            data: configuration,
        });
        console.log("configuration", configuration);
    } catch (err) {
        console.error("Error saving configuration:", err);
        return res.status(500).json({
            message: "Lỗi server",
        });
    }
}

exports.deleteConfiguration = async (req, res) => {
    const { id } = req.body;
    try {
        const configuration = await Configuration.findOne({
            _id: id,
        });
        if (!configuration) {
            return res.status(404).json({
                message: "Không tìm thấy cấu hình",
            });
        }

        // Kiểm tra xem cấu hình có được sử dụng bởi thiết bị nào không
        const devicesUsingConfig = await Device.findOne({
            configuration: id,
        });

        if (devicesUsingConfig) {
            return res.status(400).json({
                message: "Cấu hình này đang được sử dụng bởi thiết bị khác",
            });
        }

        // Xóa cấu hình
        await Configuration.deleteOne({ _id: id });
        console.log("Đã xóa cấu hình:", id);

        return res.status(200).json({
            message: "Xóa cấu hình thành công",
        });
    } catch (err) {
        console.error("Error deleting configuration:", err);
        return res.status(500).json({
            message: "Lỗi server",
        });
    }
}

exports.copyConfiguration = async (req, res) => {
    const { configurationId, name, description } = req.body;
    try {
        if (!configurationId || !name) {
            return res.status(400).json({
                message: "Thiếu thông tin cấu hình hoặc tên mới",
            });
        }

        const configuration = await Configuration.findById(configurationId);
        if (!configuration) {
            return res.status(404).json({
                message: "Không tìm thấy cấu hình",
            });
        }

        // Kiểm tra nếu tên trùng với tên hiện tại
        if (name && name == configuration.name) {
            return res.status(400).json({
                message: "Đã có cấu hình với tên này",
            });
        }

        // Tạo bản sao của cấu hình
        const { _id, ...configData } = configuration.toObject();
        const newConfiguration = new Configuration({
            ...configData,
            name: name || configuration.name,
            description: description || configuration.description,
        });

        // Lưu bản sao
        await newConfiguration.save();

        return res.status(200).json({
            message: "Sao chép cấu hình thành công",
            data: newConfiguration,
        });
    } catch (err) {
        console.error("Error copying configuration:", err);
        return res.status(500).json({
            message: "Lỗi server",
        });
    }
}