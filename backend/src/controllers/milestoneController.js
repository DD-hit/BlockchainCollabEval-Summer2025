import { MilestoneService } from '../services/milestoneService.js';

export const createMilestone = async (req, res) => {
    try {
        const { title, description, projectId, startDate, endDate } = req.body;
        
        // 输入验证
        if (!title || !description || !projectId) {
            return res.status(400).json({
                success: false,
                message: '标题、描述和项目ID不能为空'
            });
        }
        
        const result = await MilestoneService.createMilestone(title, description, projectId, startDate, endDate);
        res.json({
            success: true,
            message: '创建里程碑成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getMilestoneList = async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await MilestoneService.getMilestoneList(projectId);
        res.json({
            success: true,
            message: '获取里程碑列表成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getMilestoneDetail = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const result = await MilestoneService.getMilestoneDetail(milestoneId);
        res.json({
            success: true,
            message: '获取里程碑详情成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const updateMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { title, description, startDate, endDate } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                message: '标题不能为空'
            });
        }
        
        const result = await MilestoneService.updateMilestone(milestoneId, title, description, startDate, endDate);
        res.json({
            success: true,
            message: '更新里程碑成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const deleteMilestone = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const result = await MilestoneService.deleteMilestone(milestoneId);
        res.json({
            success: true,
            message: '删除里程碑成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}