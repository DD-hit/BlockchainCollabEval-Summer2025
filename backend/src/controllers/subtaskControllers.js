import { SubtaskService } from '../services/subtaskService.js';

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
