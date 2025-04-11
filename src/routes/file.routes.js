const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const controller = require("../controllers/restful/file.controllers");
const { verifyAccessToken } = require('../middlewares/verifyToken');

const router = express.Router();

// Lưu file tạm vào /tmp hoặc thư mục bạn muốn
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = path.join(__dirname, '..', 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now();
        cb(null, `${file.originalname}${uniqueSuffix}.temp`);
    },
});

const upload = multer({ storage });

router.post('/upload-apk', [verifyAccessToken, upload.single('apkFile')], controller.uploadApk);
router.post('/cancel-upload', [verifyAccessToken], controller.cancelUpload);

module.exports = router;