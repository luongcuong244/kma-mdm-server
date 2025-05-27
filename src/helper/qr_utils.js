const path = require("path");
const fs = require("fs");
const QRCode = require("qrcode");

exports.createQrCode = async (deviceId, configuration) => {
    // Tạo dữ liệu QR provisioning
    const qrCodeData = {
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_COMPONENT_NAME": "com.example.kmamdm/com.example.kmamdm.AdminReceiver",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_PACKAGE_DOWNLOAD_LOCATION": "https://onehost-wphn032504.000nethost.com:2023/website/preview/luongcuong244.id.vn/static/kmamdm.apk",
        "android.app.extra.PROVISIONING_DEVICE_ADMIN_SIGNATURE_CHECKSUM": "fMy7UfzfB7HumjwzgskPjlVLxmQ1LwEBsRgyffN3xP0=",
        "android.app.extra.PROVISIONING_LEAVE_ALL_SYSTEM_APPS_ENABLED": true,
        "android.app.extra.PROVISIONING_SKIP_ENCRYPTION": true,
        "android.app.extra.PROVISIONING_ADMIN_EXTRAS_BUNDLE": {
            "DEVICE_ID": deviceId,
        }
    };

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