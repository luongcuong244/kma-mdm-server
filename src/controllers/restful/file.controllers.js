var ApkReader = require('node-apk-parser')
const fs = require("fs");

exports.uploadApk = async (req, res) => {
    try {
        const apkFilePath = req.file.path;

        console.log("APK File Path:", apkFilePath);

        const reader = await ApkReader.readFile(apkFilePath);
        const manifest = reader.readManifestSync();

        return res.status(200).json({
            data: {
                serverPath: apkFilePath,
                fileDetails: {
                    pkg: manifest.package,
                    version: manifest.versionName,
                    versionCode: manifest.versionCode,
                    name: manifest.application.label || "Unknown App"
                },
                application: null,
                complete: null,
                exists: null
            }
        });
    } catch (err) {
        console.error("APK Parse Error:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to parse APK" });
    }
};

exports.cancelUpload = async (req, res) => {
    const { filePath } = req.body;
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ message: "Không xóa được file" });
        res.status(200).json({ message: "Đã xóa file tạm" });
    });
}