import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { uploadFiles, getFiles, deleteFile } from '../controllers/filesController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保uploads目录存在
const uploadsDir = path.join(process.cwd(), 'data/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 配置multer存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // 生成唯一文件名
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/pdf'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('不支持的文件类型'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB限制
    }
});

// 文件上传路由 - 支持单个文件
router.post('/filesUpload', verifyToken, upload.single('files'), uploadFiles);

// 获取文件列表路由
router.get('/files', verifyToken, getFiles);

// 删除文件路由
router.delete('/files/:fileId', verifyToken, deleteFile);

export default router; 