import { SubtaskService } from '../services/subtaskService.js';
import { NotificationService } from '../services/notificationService.js';

export const createSubtask = async (req, res) => {
    try {
        const { milestoneId, title, status, description, assignedTo, startTime, endTime, priority } = req.body;
        
        // 输入验证
        if (!milestoneId || !title) {
            return res.status(400).json({
                success: false,
                message: '里程碑ID和标题不能为空'
            });
        }
        
        const result = await SubtaskService.createSubtask(milestoneId, title, status, description, assignedTo, startTime, endTime, priority);
        
        // 如果分配了负责人，发送通知
        if (assignedTo) {
            try {
                await NotificationService.addSubtaskStatusNotification(
                    req.user.username, // 创建者
                    assignedTo, // 被分配者
                    result.insertId, // 新创建的子任务ID
                    title,
                    status || 'in_progress',
                    milestoneId
                );
                
                // 通过WebSocket发送实时通知
                if (global.sendWebSocketNotification) {
                    global.sendWebSocketNotification(assignedTo, {
                        type: 'subtask_created',
                        title: '新任务分配',
                        message: `您被分配了新任务"${title}"`,
                        link: `/subtask/${result.insertId}`,
                        meta: {
                            subtaskId: result.insertId,
                            status: status || 'in_progress',
                            title: title,
                            milestoneId: milestoneId
                        }
                    });
                }
            } catch (notificationError) {
                console.error('发送子任务创建通知失败:', notificationError);
            }
        }
        
        res.json({
            success: true,
            message: '创建子任务成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getSubtaskList = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const result = await SubtaskService.getSubtaskList(milestoneId);
        res.json({
            success: true,
            message: '获取子任务列表成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getSubtaskDetail = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const result = await SubtaskService.getSubtaskDetail(subtaskId);
        res.json({
            success: true,
            message: '获取子任务详情成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}   

export const updateSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const { title, status, description, assignedTo, startTime, endTime, priority } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: '标题不能为空'
            });
        }
        
        const result = await SubtaskService.updateSubtask(subtaskId, title, status, description, assignedTo, startTime, endTime, priority);
        
        // 如果状态发生变化，发送通知给相关人员
        if (status && assignedTo) {
            try {
                // 获取子任务详情以获取项目信息
                const subtaskDetail = await SubtaskService.getSubtaskDetail(subtaskId);
                if (subtaskDetail) {
                    // 发送状态变化通知
                    await NotificationService.addSubtaskStatusNotification(
                        req.user.username, // 操作者
                        assignedTo, // 被分配者
                        subtaskId,
                        title,
                        status,
                        subtaskDetail.milestoneId
                    );
                    
                    // 通过WebSocket发送实时通知
                    if (global.sendWebSocketNotification) {
                        global.sendWebSocketNotification(assignedTo, {
                            type: 'subtask_status',
                            title: '子任务状态更新',
                            message: `您的子任务"${title}"状态已更新为${status === 'completed' ? '已完成' : '进行中'}`,
                            link: `/subtask/${subtaskId}`,
                            meta: {
                                subtaskId: subtaskId,
                                status: status,
                                title: title,
                                milestoneId: subtaskDetail.milestoneId
                            }
                        });
                    }
                }
            } catch (notificationError) {
                console.error('发送子任务状态通知失败:', notificationError);
            }
        }
        
        res.json({
            success: true,
            message: '更新子任务成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}   

export const deleteSubtask = async (req, res) => {
    try {
        const { subtaskId } = req.params;
        const result = await SubtaskService.deleteSubtask(subtaskId);
        res.json({
            success: true,
            message: '删除子任务成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const myTasks = async (req, res) => {
    try {
        const username = req.user.username; // 从token中获取当前用户
        const result = await SubtaskService.getMyTasks(username);
        res.json({
            success: true,
            message: '获取我的任务列表成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
