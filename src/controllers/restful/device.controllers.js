const Device = require("../../models/device.model");
const Configuration = require("../../models/configuration.model");
const Application = require("../../models/application.model");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

exports.getDeviceList = async (req, res) => {
    const devices = await Device.find()
        .populate("configuration")
        .select("-__v -createdAt -updatedAt")
        .sort({ createdAt: -1 });
    if (!devices) {
        return res.status(404).json({ message: "Không tìm thấy thiết bị nào" });
    }
    return res.status(200).json({
        message: "Danh sách thiết bị",
        data: devices,
    });
}

exports.getDeviceById = async (req, res) => {
    const { deviceId } = req.params;
    const device = await Device.findById({ deviceId });
    if (!device) {
        return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }
    return res.status(200).json({
        message: "Thông tin thiết bị",
        data: device,
    });
}

exports.addNewDevice = async (req, res) => {
    const { deviceId, description, configurationId, phoneNumber } = req.body;

    if (!deviceId) {
        return res.status(400).json({ message: "Mã thiết bị không được để trống" });
    }

    if (!configurationId) {
        return res.status(400).json({ message: "Mã cấu hình không được để trống" });
    }

    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
        return res.status(400).json({ message: "Mã thiết bị đã tồn tại" });
    }

    const configuration = await Configuration.findById(configurationId);
    if (!configuration) {
        return res.status(400).json({ message: "Mã cấu hình không tồn tại" });
    }

    const mdmApplication = await Application.findOne({ pkg: configuration.mdmApp });
    if (!mdmApplication || mdmApplication.versions.length === 0) {
        return res.status(400).json({ message: "Ứng dụng MDM không tồn tại hoặc không có phiên bản nào" });
    }

    const latestVersion = mdmApplication.versions.reduce((prev, current) =>
        (prev.versionCode > current.versionCode) ? prev : current
    );

    // Tạo dữ liệu QR provisioning
    const qrCodeData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": configuration.adminReceiverClass,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": latestVersion.url,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_CHECKSUM": latestVersion.checksum || "KxXFkzx_0qN0iqmS8etdfrjNx7sGq7HDM5fNQeDtBfk=",
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "DEVICE_ID": deviceId,
        }
    };

    // Tạo đường dẫn QR
    const qrFolderPath = path.join(__dirname, "..", "..", "public", "qr");
    if (!fs.existsSync(qrFolderPath)) {
        fs.mkdirSync(qrFolderPath, { recursive: true });
    }

    const fileName = `${deviceId}.png`;
    const qrImagePath = path.join(qrFolderPath, fileName);

    // Tạo và lưu mã QR
    try {
        await QRCode.toFile(qrImagePath, JSON.stringify(qrCodeData), {
            type: "png",
            errorCorrectionLevel: "H",
            width: 700,
        });

        // Lưu thiết bị
        const newDevice = new Device({
            deviceId,
            description,
            configuration: configurationId,
            phoneNumber,
            qrCode: `/qr/${fileName}`
        });
        await newDevice.save();

        return res.status(201).json({
            message: "Thiết bị đã được thêm và mã QR đã được tạo",
            data: newDevice,
        });
    } catch (error) {
        console.error("Lỗi tạo QR:", error);
        return res.status(500).json({ message: "Lỗi khi tạo mã QR hoặc lưu thiết bị" });
    }
};