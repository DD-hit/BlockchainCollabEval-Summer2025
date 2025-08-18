import { ProjectMemberService } from '../services/projectMemberService.js';

export const addProjectMember = async (req, res) => {
    try {
        const { projectId, username, role } = req.body;
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        if (!role || !role.trim()) {
            return res.status(400).json({
                success: false,
                message: '角色不能为空'
            });
        }
        
        // 角色验证
        const validRoles = ['项目负责人', '前端开发', '后端开发', 'UI设计师', '产品经理', '测试工程师', '运维工程师', '数据分析师'];
        if (!validRoles.includes(role.trim())) {
            return res.status(400).json({
                success: false,
                message: '角色值无效，请选择有效的角色'
            });
        }
        
        const result = await ProjectMemberService.addProjectMember(parseInt(projectId), username.trim(), role.trim());
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
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        const result = await ProjectMemberService.getProjectMemberList(parseInt(projectId));
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
        const { projectId } = req.params;
        const { username } = req.body;
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        const result = await ProjectMemberService.deleteProjectMember(parseInt(projectId), username.trim());
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
        const { projectId } = req.params;
        const { username, role } = req.body;
        
        // 参数验证
        if (!projectId || isNaN(parseInt(projectId))) {
            return res.status(400).json({
                success: false,
                message: '项目ID必须是有效的数字'
            });
        }
        
        if (!username || !username.trim()) {
            return res.status(400).json({
                success: false,
                message: '用户名不能为空'
            });
        }
        
        if (!role || !role.trim()) {
            return res.status(400).json({
                success: false,
                message: '角色不能为空'
            });
        }
        
        // 角色验证
        const validRoles = ['项目负责人', '前端开发', '后端开发', 'UI设计师', '产品经理', '测试工程师', '运维工程师', '数据分析师'];
        if (!validRoles.includes(role.trim())) {
            return res.status(400).json({
                success: false,
                message: '角色值无效，请选择有效的角色'
            });
        }
        
        const result = await ProjectMemberService.updateProjectMember(parseInt(projectId), username.trim(), role.trim());
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
