import { MilestoneService } from '../services/milestoneService.js';

export const createMilestone = async (req, res) => {
    try {
        const { title, description, projectId, startDate, endDate } = req.body;
        
        // 输入验证
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: '里程碑标题不能为空'
            });
        }
        
        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: '里程碑描述不能为空'
            });
        }

        if(startDate === null || endDate === null){
            return res.status(400).json({
                success: false,
                message: '开始时间和结束时间不能为空'
            });
        }
        
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        // 标题长度验证
        if (title.trim().length < 2 || title.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: '里程碑标题长度必须在2-100个字符之间'
            });
        }
        
        // 时间验证
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: '开始时间和结束时间不能为空'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: '时间格式不正确'
            });
        }
        
        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: '结束时间必须晚于开始时间'
            });
        }
        
        const result = await MilestoneService.createMilestone(
            title.trim(), 
            description.trim(), 
            parseInt(projectId), 
            startDate, 
            endDate
        );
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
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        const result = await MilestoneService.getMilestoneList(parseInt(projectId));
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
        
        // 参数验证
        if (!milestoneId || isNaN(parseInt(milestoneId))) {
            return res.status(400).json({
                success: false,
                message: '里程碑ID必须是有效的数字'
            });
        }
        
        const result = await MilestoneService.getMilestoneDetail(parseInt(milestoneId));
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
        
        // 参数验证
        if (!milestoneId || isNaN(parseInt(milestoneId))) {
            return res.status(400).json({
                success: false,
                message: '里程碑ID必须是有效的数字'
            });
        }
        
        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: '里程碑标题不能为空'
            });
        }
        
        // 标题长度验证
        if (title.trim().length < 2 || title.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: '里程碑标题长度必须在2-100个字符之间'
            });
        }
        
        // 时间验证
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: '开始时间和结束时间不能为空'
            });
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: '时间格式不正确'
            });
        }
        
        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: '结束时间必须晚于开始时间'
            });
        }
        
        const result = await MilestoneService.updateMilestone(
            parseInt(milestoneId), 
            title.trim(), 
            description, 
            startDate, 
            endDate
        );
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
        
        // 参数验证
        if (!milestoneId || isNaN(parseInt(milestoneId))) {
            return res.status(400).json({
                success: false,
                message: '里程碑ID必须是有效的数字'
            });
        }
        
        const result = await MilestoneService.deleteMilestone(parseInt(milestoneId));
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

export const updateMilestoneStatus = async (req, res) => {
    try {
        const { milestoneId } = req.params;
        const { status } = req.body;
        
        // 参数验证
        if (!milestoneId || isNaN(parseInt(milestoneId))) {
            return res.status(400).json({
                success: false,
                message: '里程碑ID必须是有效的数字'
            });
        }
        
        if (!status || !status.trim()) {
            return res.status(400).json({
                success: false,
                message: '状态不能为空'
            });
        }
        
        // 状态值验证
        const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'overdue'];
        if (!validStatuses.includes(status.trim())) {
            return res.status(400).json({
                success: false,
                message: '状态值无效，必须是：pending、in_progress、completed、cancelled、overdue 之一'
            });
        }
        
        const result = await MilestoneService.updateMilestoneStatus(parseInt(milestoneId), status.trim());
        res.json({
            success: true,
            message: '更新里程碑状态成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}