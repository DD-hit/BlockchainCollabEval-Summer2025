// controllers/filesController.js - 文件上传控制层
import { FilesService } from '../services/filesService.js';
import { NotificationService } from '../services/notificationService.js';
import { SubtaskService } from '../services/subtaskService.js';
import { ProjectMemberService } from '../services/projectMemberService.js';
// 处理文件上传请求
export const uploadFiles = async (req, res) => {
    try {
        // 1. 验证请求数据
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: '没有选择文件' 
            });
        }

        const { description, subtaskId, privateKey } = req.body;
        if (!description || !description.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: '请填写描述' 
            });
        }

        if (!subtaskId) {
            return res.status(400).json({ 
                success: false, 
                message: '请选择子任务' 
            });
        }

        if (!privateKey) {
            return res.status(400).json({ 
                success: false, 
                message: '请提供私钥' 
            });
        }

        // 2. 调用业务逻辑层处理
        const username = req.user.username;
        const result = await FilesService.uploadFiles(req.file, description.trim(), username, subtaskId, privateKey);
        //获取除上传者外的所有项目成员
        const projectId = await SubtaskService.getProjectIdBySubtaskId(subtaskId);
        const projectMembers = await ProjectMemberService.getProjectMemberList(projectId);
        for (const member of projectMembers) {
            if (member.username !== username) {
                await NotificationService.addFileNotification(username, member.username, projectId, result.fileId);
            }
        }

        // 3. 返回成功响应
        res.json({
            success: true,
            message: '文件上传成功',
            data: result
        });

    } catch (error) {
        console.error('文件上传失败:', error);
        
        // 4. 返回错误响应
        res.status(500).json({
            success: false,
            message: '文件上传失败',
            error: error.message
        });
    }
};

// 获取文件列表
export const getFiles = async (req, res) => {
    try {
        const files = await FilesService.getFiles();
        res.json({
            success: true,
            message: '文件列表获取成功',
            data: files
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '获取文件列表失败',
            error: error.message
        });
    }
};

// 删除文件
export const deleteFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        await FilesService.deleteFile(fileId);
        res.json({
            success: true,
            message: '文件删除成功'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: '文件删除失败',
            error: error.message
        });
    }
};
