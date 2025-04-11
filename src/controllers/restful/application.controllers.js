const Application = require("../../models/application.model");
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
                    { description: { $regex: searchTerm, $options: "i" } },
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

exports.addApplication = async (req, res) => {
    try {
        const { name, pkg, version, versionCode, apkServerPath } = req.body;

        if (apkServerPath && fs.existsSync(apkServerPath)) {
            const fileName = path.basename(apkServerPath).replace(".temp", ".apk");

            // 👉 Lấy đường dẫn tuyệt đối đến thư mục public/files/apk (nằm ngoài src)
            const uploadDir = path.join(__dirname, "..", "..", "public", "files", "apk");

            // ✅ Tạo thư mục nếu chưa tồn tại
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const newPath = path.join(uploadDir, fileName);

            fs.renameSync(apkServerPath, newPath);

            // Optional: lưu đường dẫn mới nếu bạn muốn phản hồi lại client
            console.log("APK saved to:", newPath);
        }

        return res.json({ status: "OK" });
    } catch (err) {
        console.error("Add application error:", err);
        return res.status(500).json({ status: "ERROR", message: "Failed to add application" });
    }
};