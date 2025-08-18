import { ProjectManagerService } from '../services/projectManagerService.js';
import { ProjectMemberService } from '../services/projectMemberService.js';

export const createProject = async (req, res) => {
    try {
        const { 
            projectName, 
            description, 
            projectOwner, 
            startTime, 
            endTime
        } = req.body;
        const username = req.user.username;
        
        // 输入验证
        if (!projectName || !projectName.trim()) {
            return res.status(400).json({
                success: false,
                message: '项目名称不能为空'
            });
        }

        if(description === null){
            return res.status(400).json({
                success: false,
                message: '项目描述不能为空'
            });
        }
        
        if (!projectOwner || !projectOwner.trim()) {
            return res.status(400).json({
                success: false,
                message: '项目负责人不能为空'
            });
        }
        
        if (!startTime) {
            return res.status(400).json({
                success: false,
                message: '开始时间不能为空'
            });
        }
        
        if (!endTime) {
            return res.status(400).json({
                success: false,
                message: '结束时间不能为空'
            });
        }
        
        // 项目名称长度验证
        if (projectName.trim().length < 2 || projectName.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: '项目名称长度必须在2-100个字符之间'
            });
        }
        
        // 时间验证
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        const now = new Date();
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: '时间格式不正确'
            });
        }
        
        if (endDate <= startDate) {
            return res.status(400).json({
                success: false,
                message: '结束时间必须晚于开始时间'
            });
        }
        
        const result = await ProjectManagerService.createProject(
            projectName.trim(), 
            description || '', 
            projectOwner.trim(), 
            startTime, 
            endTime,
            username
        );
        
        res.json({
            success: true,
            message: '项目创建成功',
            data: result
        });
    } catch (error) {
        console.error('创建项目失败:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getProjectList = async (req, res) => {
    try {
        const result = await ProjectManagerService.getProjectList();
        res.json({
            success: true,
            message: '项目列表获取成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getMyProjectList = async (req, res) => { 
    try {
        const username = req.user.username;

        
        const result = await ProjectManagerService.getMyProjectList(username);

        
        res.json({
            success: true,
            message: '我的项目列表获取成功',
            data: result
        });
    } catch (error) {
        console.error('获取我的项目列表失败:', error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getProjectDetail = async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await ProjectManagerService.getProjectDetail(projectId);
        res.json({
            success: true,
            message: '项目详情获取成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const updateProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { 
            projectName, 
            description,
            startTime,
            endTime,
            blockchainType,
            enableDAO,
            templateType,
            isPublic
        } = req.body;
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        if (!projectName || !projectName.trim()) {
            return res.status(400).json({
                success: false,
                message: '项目名称不能为空'
            });
        }
        
        // 项目名称长度验证
        if (projectName.trim().length < 2 || projectName.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: '项目名称长度必须在2-100个字符之间'
            });
        }
        
        // 时间验证（如果提供了时间）
        if (startTime && endTime) {
            const startDate = new Date(startTime);
            const endDate = new Date(endTime);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: '时间格式不正确'
                });
            }
            
            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    message: '结束时间必须晚于开始时间'
                });
            }
        }
        
        const result = await ProjectManagerService.updateProject(
            parseInt(projectId),
            projectName.trim(),
            description,
            startTime,
            endTime
        );
        
        res.json({
            success: true,
            message: '项目更新成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const deleteProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { username } = req.user; // 从token中获取用户名
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        // 检查用户是否为项目所有者
        const project = await ProjectManagerService.getProjectDetail(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: '项目不存在'
            });
        }
        
        if (project.projectOwner !== username) {
            return res.status(403).json({
                success: false,
                message: '只有项目所有者才能删除项目'
            });
        }
        
        const result = await ProjectManagerService.deleteProject(projectId);
        res.json({
            success: true,
            message: '项目删除成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getMyProjects = async (req, res) => {
    try {
        const { username } = req.user; // 从token中获取用户名
        const result = await ProjectManagerService.getMyProjectList(username);
        res.json({
            success: true,
            message: '我的项目列表获取成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
