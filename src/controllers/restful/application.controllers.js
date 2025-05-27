const Application = require("../../models/application.model");
const AppIcon = require("../../models/app_icon.model");
const Configuration = require("../../models/configuration.model");
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

exports.editApplication = async (req, res) => {
    try {
        const {
            id,
            appName, 
            packageName, 
            showIcon, 
            iconId,
            iconName,
        } = req.body;

        if (!appName || !packageName) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        // check packageName
        const application = await Application.findOne({ _id: id });
        if (application) {
            application.name = appName;
            application.pkg = packageName;
            application.icon = iconId || null;
            application.iconText = iconName || null;
            application.showIcon = showIcon || false;
            await application.save();
            return res.status(200).json({
                message: "Cập nhật ứng dụng thành công",
                data: application,
            });
        } else {
            return res.status(400).json({
                message: "Ứng dụng không tồn tại",
            });
        }
    } catch (err) {
        console.error("Add application error:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
};

exports.getApplicationByPackageName = async (req, res) => {
    try {
        const { packageName } = req.query;

        if (!packageName) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        // check packageName
        const application = await Application.findOne({ pkg: packageName });
        if (application) {
            return res.status(200).json({
                message: "Lấy ứng dụng thành công",
                data: application,
            });
        } else {
            return res.status(400).json({
                message: "Ứng dụng không tồn tại",
            });
        }
    } catch (err) {
        console.error("Lỗi khi lấy ứng dụng:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
}

exports.addApkVersion = async (req, res) => {
    try {
        const { 
            apkServerPath, 
            packageName, 
            versionName, 
            versionCode 
        } = req.body;

        if (!apkServerPath || !packageName || !versionName || !versionCode) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        // check packageName
        const application = await Application.findOne({ pkg: packageName });
        if (!application) {
            return res.status(400).json({
                message: "Ứng dụng không tồn tại",
            });
        }

        // get last version
        const lastVersion = application.versions.reduce((prev, current) => {
            return (prev.versionCode > current.versionCode) ? prev : current;
        })

        if (lastVersion.versionCode >= versionCode) {
            return res.status(400).json({
                message: "Yêu cầu phiên bản lớn hơn phiên bản hiện tại (" + lastVersion.versionCode + ")",
            });
        }

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
            
            const newVersion = {
                versionName,
                versionCode,
                url,
            }
            application.versions.push(newVersion);
            await application.save();

            // Cập nhật application trong cấu hình
            const configurations = await Configuration.find({ "applications.application.pkg": packageName });
            for (const config of configurations) {
                config.applications = config.applications.map(app => {
                    if (app.application.pkg === packageName) {
                        app.application.versions = application.versions; // Cập nhật phiên bản mới
                    }
                    return app;
                });

                config.markModified("applications");
                await config.save();
            }
            
            return res.status(200).json({
                message: "Thêm phiên bản APK thành công",
                data: newVersion,
            });
        } else {
            return res.status(400).json({
                message: "Đường dẫn APK không hợp lệ. Vui lòng tải lên lại.",
            });
        }
    } catch (err) {
        console.error("Lỗi khi thêm phiên bản APK:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
}

exports.deleteApkVersion = async (req, res) => {
    try {
        const { 
            packageName, 
            versionCode 
        } = req.body;

        if (!packageName || !versionCode) {
            return res.status(400).json({
                message: "Thông tin không hợp lệ",
            });
        }

        // check packageName
        const application = await Application.findOne({ pkg: packageName });
        if (!application) {
            return res.status(400).json({
                message: "Ứng dụng không tồn tại",
            });
        }

        const versions = application.versions;

        // get specific version
        const versionWillBeDelete = versions.find(version => version.versionCode === versionCode);

        if (!versionWillBeDelete) {
            return res.status(400).json({
                message: "Phiên bản không tồn tại",
            });
        }

        const newVersions = application.versions.filter(version => version.versionCode !== versionCode);
        application.versions = newVersions;
        await application.save();

        // Cập nhật application trong cấu hình
        const configurations = await Configuration.find({ "applications.application.pkg": packageName });
        for (const config of configurations) {
            config.applications = config.applications.map(app => {
                if (app.application.pkg === packageName) {
                    app.application.versions = newVersions; // Cập nhật phiên bản mới
                    // Cập nhật cấu hình ứng dụng
                    let isInVersionList = newVersions.some(version => version.versionCode === app.version.versionCode);
                    if (!isInVersionList) {
                        app.version = app.application.versions[app.application.versions.length - 1]; // Cập nhật phiên bản mới nhất
                    }
                }
                return app;
            });

            config.markModified("applications");
            await config.save();
        }

        return res.status(200).json({
            message: "Xóa phiên bản APK thành công",
            data: newVersions,
        });
    } catch (err) {
        console.error("Lỗi khi xóa phiên bản APK:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
}

exports.getAvailableApplicationForConfig = async (req, res) => {
    try {
        const {
            configId,
        } = req.body;

        console.log("Received data:", req.body);

        const allApplications = await Application.find();
        const config = await Configuration.findById(configId);
        if (!config) {
            return res.status(200).json({
                data: allApplications,
            });
        } else {
            const configApplications = config.applications.map(app => app.application._id.toString());
            const availableApplications = allApplications.filter(app => !configApplications.includes(app._id.toString()));
            console.log("Available applications:", availableApplications);
            return res.status(200).json({
                data: availableApplications,
            });
        }
    } catch (err) {
        console.error("Lỗi khi lấy ứng dụng:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
}

exports.deleteApplication = async (req, res) => {
    const { packageName } = req.body;
    if (!packageName) {
        return res.status(400).json({
            message: "Thông tin không hợp lệ",
        });
    }

    try {
        // check packageName
        const application = await Application.findOne({ pkg: packageName });
        if (!application) {
            return res.status(400).json({
                message: "Ứng dụng không tồn tại",
            });
        }

        // Kiểm tra xem ứng dụng có được sử dụng trong cấu hình nào không
        const configurations = await Configuration.find({ "applications.application.pkg": application.pkg });
        if (configurations.length > 0) {
            const configNames = configurations.map(config => config.name).join(", ");
            return res.status(400).json({
                message: "Ứng dụng đang được sử dụng trong cấu hình: " + configNames + ". Vui lòng xóa ứng dụng khỏi cấu hình trước khi xóa.",
            });
        }

        // Xóa ứng dụng
        await Application.deleteOne({ pkg: packageName });

        // Xóa icon nếu có
        if (application.icon) {
            await AppIcon.deleteOne({ _id: application.icon });
        }

        return res.status(200).json({
            message: "Xóa ứng dụng thành công",
        });
    } catch (err) {
        console.error("Lỗi khi xóa ứng dụng:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to delete application" });
    }
}