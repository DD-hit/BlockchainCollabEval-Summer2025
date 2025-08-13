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
        if (!projectName || !projectOwner) {
            return res.status(400).json({
                success: false,
                message: '项目名称和项目负责人不能为空'
            });
        }
        
        
        const result = await ProjectManagerService.createProject(
            projectName, 
            description || '', 
            projectOwner, 
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
        
        if (!projectName) {
            return res.status(400).json({
                success: false,
                message: '项目名称不能为空'
            });
        }
        
        const result = await ProjectManagerService.updateProject(
            projectId,
            projectName,
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
