const Application = require("../../models/application.model");
const AppIcon = require("../../models/app_icon.model");
const fs = require("fs");
const path = require("path");

exports.getAll = async (req, res) => {
    try {
        const searchTerm = req.query.searchTerm || "";

        // Tạo điều kiện tìm kiếm nếu có searchTerm
        const filter = searchTerm
            ? {
                $or: [
                    { name: { $regex: searchTerm, $options: "i" } },
                    { pkg: { $regex: searchTerm, $options: "i" } },
                ],
            }
            : {};

        const applications = await Application.find(filter);

        return res.status(200).json({
            data: applications,
        });
    } catch (err) {
        console.error("Error fetching configurations:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

exports.getAppIcon = async (req, res) => {
    try {
        const appIcons = await AppIcon.find();

        return res.status(200).json({
            data: appIcons,
        });
    } catch (err) {
        console.error("Error fetching configurations:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

exports.addAppIcon = async (req, res) => {
    const { name, serverPath } = req.body;

    console.log("Received data:", req.body);

    if (!name || !serverPath) {
        return res.status(400).json({
            message: "Invalid request",
        });
    }

    try {
        // check name
        const appIcon = await AppIcon.findOne({ name });
        if (appIcon) {
            return res.status(400).json({
                message: "Tên icon đã tồn tại",
            });
        }
        // check serverPath
        if (fs.existsSync(serverPath)) {
            const fileName = path.basename(serverPath).replace(".temp", ".png");

            // 👉 Lấy đường dẫn tuyệt đối đến thư mục public/files/apk (nằm ngoài src)
            const uploadDir = path.join(__dirname, "..", "..", "public", "files", "icon");

            // ✅ Tạo thư mục nếu chưa tồn tại
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const newPath = path.join(uploadDir, fileName);

            fs.renameSync(serverPath, newPath);

            // Optional: lưu đường dẫn mới nếu bạn muốn phản hồi lại client
            console.log("APK saved to:", newPath);

            const url = `/files/icon/${fileName}`;
            const newAppIcon = new AppIcon({
                name,
                url,
            });
            await newAppIcon.save();
            return res.status(200).json({
                message: "Thêm icon thành công",
                data: newAppIcon,
            });
        } else {
            return res.status(400).json({
                message: "Đường dẫn icon không hợp lệ",
            });
        }
    } catch (err) {
        console.error("Error fetching configurations:", err);
        return res.status(500).json({
            message: "Internal Server Error",
        });
    }
}

exports.addApplication = async (req, res) => {
    try {
        const { 
            apkServerPath, 
            appName, 
            packageName, 
            versionName, 
            versionCode, 
            isSystemApp, 
            showIcon, 
            iconId, 
            iconName
        } = req.body;

        if (!appName || !packageName || (!isSystemApp && (!apkServerPath || !versionName || !versionCode))) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        // check packageName
        const application = await Application.findOne({ pkg: packageName });
        if (application) {
            return res.status(400).json({
                message: "Ứng dụng đã tồn tại",
            });
        }
        let versions = [];
        if (apkServerPath && fs.existsSync(apkServerPath)) {
            const fileName = path.basename(apkServerPath).replace(".temp", ".apk");
            const uploadDir = path.join(__dirname, "..", "..", "public", "files", "apk");
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            const newPath = path.join(uploadDir, fileName);
            fs.renameSync(apkServerPath, newPath);
            console.log("APK saved to:", newPath);

            const url = `/files/apk/${fileName}`;
            versions.push({
                versionName,
                versionCode,
                url,
            });
        } else {
            if (!isSystemApp) {
                return res.status(400).json({
                    message: "Đường dẫn APK không hợp lệ. Vui lòng tải lên lại.",
                });
            }
        }
        // Nếu là ứng dụng hệ thống, không cần đường dẫn APK
        const newApplication = new Application({
            name: appName,
            pkg: packageName,
            versions: versions,
            isSystemApp: isSystemApp || false,
            showIcon: showIcon || false,
            icon: iconId || null,
            iconText: iconName || null,
        });
        await newApplication.save();
        return res.status(200).json({
            message: "Thêm ứng dụng thành công",
            data: newApplication,
        });
    } catch (err) {
        console.error("Add application error:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
};