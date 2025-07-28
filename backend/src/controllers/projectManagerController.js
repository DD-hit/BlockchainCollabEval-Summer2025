import { ProjectManagerService } from '../services/projectManagerService.js';
import { ProjectMemberService } from '../services/projectMemberService.js';

export const createProject = async (req, res) => {
    try {
        const { projectName, projectOwner } = req.body;
        const result = await ProjectManagerService.createProject(projectName, projectOwner);
        await ProjectMemberService.addProjectMember(result.projectId, projectOwner, 'admin', 'accepted');
        res.json({
            success: true,
            message: '项目创建成功',
            data: result
        });
    } catch (error) {
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
