import { CommentService } from '../services/commentService.js';

export const createComment = async (req, res) => {
    try {
        const { subtaskId, content} = req.body;
        const username = req.user.username;

        // 参数验证
        if (!subtaskId || isNaN(parseInt(subtaskId))) {
            return res.status(400).json({
                success: false,
                message: '子任务ID必须是有效的数字'
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                success: false,
                message: '评论内容不能为空'
            });
        }

        // 评论内容长度验证
        if (content.trim().length < 1 || content.trim().length > 1000) {
            return res.status(400).json({
                success: false,
                message: '评论内容长度必须在1-1000个字符之间'
            });
        }

        const result = await CommentService.createComment(parseInt(subtaskId), username, content.trim());
        res.json({
            success: true,
            message: '评论创建成功',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getCommentsBySubtaskId = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        
        // 参数验证
        if (!subtaskId || isNaN(parseInt(subtaskId))) {
            return res.status(400).json({
                success: false,
                message: '子任务ID必须是有效的数字'
            });
        }
        
        const comments = await CommentService.getCommentsBySubtaskId(parseInt(subtaskId));
        res.json({
            success: true,
            message: '获取评论成功',
            data: comments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        const username = req.user.username;

        // 参数验证
        if (!commentId || isNaN(parseInt(commentId))) {
            return res.status(400).json({
                success: false,
                message: '评论ID必须是有效的数字'
            });
        }

        const result = await CommentService.deleteComment(parseInt(commentId), username);
        res.json({
            success: true,
            message: '评论删除成功',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
