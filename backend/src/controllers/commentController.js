import { CommentService } from '../services/commentService.js';

export const createComment = async (req, res) => {
    try {
        const { subtaskId, content} = req.body;
        const username = req.user.username;

        if (!subtaskId || !content) {
            return res.status(400).json({
                success: false,
                message: '子任务ID和评论内容不能为空'
            });
        }

        const result = await CommentService.createComment(subtaskId, username, content);
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
        const comments = await CommentService.getCommentsBySubtaskId(subtaskId);
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

        const result = await CommentService.deleteComment(commentId, username);
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
