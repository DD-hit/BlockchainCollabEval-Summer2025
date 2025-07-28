import { ProjectMemberService } from '../services/projectMemberService.js';

export const addProjectMember = async (req, res) => {
    try {
        const { projectId, username, role, status } = req.body;
        const result = await ProjectMemberService.addProjectMember(projectId, username, role, status);
        res.json({
            success: true,
            message: '添加项目成员成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const getProjectMemberList = async (req, res) => {
    try {
        const { projectId } = req.params;
        const result = await ProjectMemberService.getProjectMemberList(projectId);
        res.json({
            success: true,
            message: '获取项目成员列表成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const deleteProjectMember = async (req, res) => {
    try {
        const { projectId, username } = req.body;
        const result = await ProjectMemberService.deleteProjectMember(projectId, username);
        res.json({
            success: true,
            message: '删除项目成员成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

export const updateProjectMember = async (req, res) => {
    try {
        const { projectId, username, role, status } = req.body;
        const result = await ProjectMemberService.updateProjectMember(projectId, username, role, status);
        res.json({
            success: true,
            message: '更新项目成员成功',
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}
