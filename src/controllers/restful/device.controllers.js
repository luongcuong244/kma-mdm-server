const Device = require("../../models/device.model");
const Configuration = require("../../models/configuration.model");
const Application = require("../../models/application.model");
const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const QrUtils = require("../../helper/qr_utils");

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
    const { deviceId } = req.query;
    const device = await Device.findOne({ deviceId })
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

    // Tạo và lưu mã QR
    try {
        const qrCode = await QrUtils.createQrCode(deviceId, configuration);
        if (!qrCode) {
            console.error("Lỗi tạo QR:", error);
            return res.status(500).json({ message: "Lỗi khi tạo mã QR hoặc lưu thiết bị" });
        }

        // Lưu thiết bị
        const newDevice = new Device({
            deviceId,
            description,
            configuration: configurationId,
            phoneNumber,
            qrCode: qrCode,
        });
        await newDevice.save();

        // return newDevice with full configuration
        const populatedDevice = await Device.findById(newDevice._id)
            .populate("configuration")
            .select("-__v -createdAt -updatedAt");
        if (!populatedDevice) {
            return res.status(404).json({ message: "Không tìm thấy thiết bị sau khi lưu" });
        }

        return res.status(201).json({
            message: "Thiết bị đã được thêm và mã QR đã được tạo",
            data: populatedDevice,
        });
    } catch (error) {
        console.error("Lỗi tạo QR:", error);
        return res.status(500).json({ message: "Lỗi khi tạo mã QR hoặc lưu thiết bị" });
    }
};

exports.deleteDeviceById = async (req, res) => {
    const { deviceId } = req.body;

    if (!deviceId) {
        return res.status(400).json({ message: "Mã thiết bị không được để trống" });
    }

    const device = await Device.findOneAndDelete({ deviceId });
    if (!device) {
        return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    // Xóa file QR nếu tồn tại
    QrUtils.deleteQrCodeByPath(device.qrCode);

    return res.status(200).json({
        message: "Thiết bị đã được xóa",
        data: device,
    });
}

exports.updateDeviceById = async (req, res) => {
    const { deviceId, description, configurationId, phoneNumber } = req.body;

    if (!deviceId) {
        return res.status(400).json({ message: "Mã thiết bị không được để trống" });
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
        return res.status(404).json({ message: "Không tìm thấy thiết bị" });
    }

    if (description) {
        device.description = description;
    }

    let isConfigurationChanged = false;

    if (configurationId) {
        const configuration = await Configuration.findById(configurationId);
        if (!configuration) {
            return res.status(400).json({ message: "Mã cấu hình không tồn tại" });
        }
        if (device.configuration && device.configuration.toString() !== configurationId) {
            // Nếu cấu hình đã thay đổi, xóa mã QR cũ
            console.log("Cấu hình đã thay đổi, xóa mã QR cũ");
            QrUtils.deleteQrCodeByPath(device.qrCode);
            isConfigurationChanged = true;
        }
        device.configuration = configurationId;

        // Tạo mã QR mới nếu cấu hình đã thay đổi
        if (isConfigurationChanged) {
            console.log("Tạo mã QR mới cho thiết bị");
            const newQrCode = await QrUtils.createQrCode(deviceId, configuration);
            if (!newQrCode) {
                return res.status(500).json({ message: "Lỗi khi tạo mã QR mới" });
            }
            device.qrCode = newQrCode;
        } else {
            console.log("Cấu hình không thay đổi, giữ nguyên mã QR cũ");
        }
    }
    if (phoneNumber) {
        device.phoneNumber = phoneNumber;
    }

    await device.save();

    const populatedDevice = await Device.findById(device._id)
        .populate("configuration");

    return res.status(200).json({
        message: "Thiết bị đã được cập nhật",
        data: populatedDevice,
    });
}