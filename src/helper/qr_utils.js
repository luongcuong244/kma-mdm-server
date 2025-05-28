const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");
const { getBaseUrl } = require("../config/base_url");

exports.createQrCode = async (deviceId, configuration) => {
    // Lấy mdm app
    const mdmApp = configuration.mdmApp;
    const mdmAppVersion = configuration.applications.find(app => app.application.pkg === mdmApp)?.version;

    if (!mdmApp || !mdmAppVersion) {
        console.error("MDM app or version not found in configuration.");
        return null;
    }

    // Kiểm tra checksum của MDM app
    if (!configuration.mdmChecksum) {
        console.error("MDM checksum not found in configuration.");
        return null;
    }



    // Tạo dữ liệu QR provisioning
    const qrCodeData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": configuration.adminReceiverClass,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": getBaseUrl() + mdmAppVersion.url,
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": configuration.mdmChecksum,
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "DEVICE_ID": deviceId,
            "BASE_URL": getBaseUrl(),
        }
    };

    console.log("QR Code Data:", qrCodeData);

    // Tạo đường dẫn QR
    const qrFolderPath = path.join(__dirname, "..", "public", "qr");
    if (!fs.existsSync(qrFolderPath)) {
        fs.mkdirSync(qrFolderPath, { recursive: true });
    }

    const fileName = `${deviceId}_${new Date().getTime()}.png`;
    const qrImagePath = path.join(qrFolderPath, fileName);

    // Tạo và lưu mã QR
    try {
        await QRCode.toFile(qrImagePath, JSON.stringify(qrCodeData), {
            type: "png",
            errorCorrectionLevel: "H",
            width: 700,
        });

        return `/qr/${fileName}`
    } catch (error) {
        return null;
    }
}

exports.deleteQrCodeByPath = (qrCodePath) => {
    if (!qrCodePath) return;

    const qrFilePath = path.join(__dirname, "..", "public", "qr", path.basename(qrCodePath));
    if (fs.existsSync(qrFilePath)) {
        fs.unlinkSync(qrFilePath);
    }
}