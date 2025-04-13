const Application = require("../../models/application.model");
var ApkReader = require('node-apk-parser')
const fs = require("fs");

exports.uploadApk = async (req, res) => {
    try {
        const apkFilePath = req.file.path;

        console.log("APK File Path:", apkFilePath);

        const reader = await ApkReader.readFile(apkFilePath);
        const manifest = reader.readManifestSync();

        const pkg = manifest.package;
        const versionName = manifest.versionName;
        const versionCode = manifest.versionCode;

        const application = await Application.findOne({ pkg: pkg });

        if (application) {
            return res.status(400).json({
                status: "ERROR",
                message: "Ứng dụng đã tồn tại",
            });
        }

        return res.status(200).json({
            data: {
                serverPath: apkFilePath,
                fileDetails: {
                    pkg: pkg,
                    version: versionName,
                    versionCode: versionCode,
                    name: null,
                },
            }
        });
    } catch (err) {
        console.error("APK Parse Error:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to parse APK" });
    }
};

exports.uploadFile = async (req, res) => {
    try {
        const filePath = req.file.path;
        console.log("File Path:", filePath);
        return res.status(200).json({
            serverPath: filePath,
        });
    } catch (err) {
        return res.status(500).json({ status: "ERROR", message: "Failed to upload file" });
    }
};

exports.cancelUpload = async (req, res) => {
    const { filePath } = req.body;
    fs.unlink(filePath, (err) => {
        if (err) return res.status(500).json({ message: "Không xóa được file" });
        res.status(200).json({ message: "Đã xóa file tạm" });
    });
}