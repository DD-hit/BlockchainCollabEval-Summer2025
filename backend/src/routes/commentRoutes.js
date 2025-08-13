import express from 'express';
import { createComment, getCommentsBySubtaskId, deleteComment } from '../controllers/commentController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// 创建评论
router.post('/create', verifyToken, createComment);

// 获取子任务的评论列表
router.get('/subtask/:subtaskId', verifyToken, getCommentsBySubtaskId);

// 删除评论
router.delete('/:commentId', verifyToken, deleteComment);

export default router;
