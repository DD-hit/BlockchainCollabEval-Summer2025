import { pool } from '../../config/database.js';
import { ProjectMemberService } from './projectMemberService.js';

export class ProjectManagerService {
    //创建项目
    static async createProject(
        projectName, 
        description, 
        projectOwner, 
        startTime, 
        endTime,
        blockchainType = 'EVM',
        enableDAO = false,
        templateType = 'solidity',
        isPublic = true
    ) {
        if (!projectName) {
            throw new Error('项目名称不能为空');
        }
        
        // 先插入项目到数据库
        const [result] = await pool.execute(
            `INSERT INTO projects (
                projectName, 
                description, 
                projectOwner, 
                startTime, 
                endTime,
                blockchainType,
                enableDAO,
                templateType,
                isPublic
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                projectName, 
                description, 
                projectOwner, 
                startTime, 
                endTime,
                blockchainType,
                enableDAO,
                templateType,
                isPublic
            ]
        );
        
        // 获取生成的projectId
        const projectId = result.insertId;
        
        // 然后添加项目成员
        await ProjectMemberService.addProjectMember(projectId, projectOwner, '组长');

        return {
            projectId: projectId,
            projectName: projectName,
            description: description,
            projectOwner: projectOwner,
            startTime: startTime,
            endTime: endTime,
            blockchainType: blockchainType,
            enableDAO: enableDAO,
            templateType: templateType,
            isPublic: isPublic
        }
    }

    //获取项目列表
    static async getProjectList() {
        const [queryResult] = await pool.execute('SELECT * FROM projects ORDER BY createTime DESC');
        return queryResult;
    }

    //获取我的项目列表
    static async getMyProjectList(username) {
        const [queryResult] = await pool.execute(
            'SELECT * FROM projects WHERE projectOwner = ? ORDER BY createTime DESC', 
            [username]
        );
        return queryResult;
    }

    //获取项目详情
    static async getProjectDetail(projectId) {
        const [queryResult] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (queryResult.length === 0) {
            throw new Error('项目不存在');
        }
        return queryResult[0];
    }

    //删除项目
    static async deleteProject(projectId) {
        // 检查项目是否存在
        const [project] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (project.length === 0) {
            throw new Error('项目不存在');
        }

        // 删除项目相关的所有数据
        await pool.execute('DELETE FROM project_members WHERE projectId = ?', [projectId]);
        await pool.execute('DELETE FROM subtasks WHERE milestoneId IN (SELECT milestoneId FROM milestones WHERE projectId = ?)', [projectId]);
        await pool.execute('DELETE FROM milestones WHERE projectId = ?', [projectId]);
        
        // 最后删除项目
        const [result] = await pool.execute('DELETE FROM projects WHERE projectId = ?', [projectId]);
        return { deletedRows: result.affectedRows };
    }

    //更新项目
    static async updateProject(
        projectId, 
        projectName, 
        description,
        startTime,
        endTime,
        blockchainType,
        enableDAO,
        templateType,
        isPublic
    ) {
        // 检查项目是否存在
        const [project] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (project.length === 0) {
            throw new Error('项目不存在');
        }

        const [result] = await pool.execute(
            `UPDATE projects SET 
                projectName = ?, 
                description = ?,
                startTime = ?,
                endTime = ?,
                blockchainType = ?,
                enableDAO = ?,
                templateType = ?,
                isPublic = ?
            WHERE projectId = ?`, 
            [
                projectName, 
                description,
                startTime,
                endTime,
                blockchainType,
                enableDAO,
                templateType,
                isPublic,
                projectId
            ]
        );
        
        return { 
            projectId,
            projectName,
            description,
            startTime,
            endTime,
            blockchainType,
            enableDAO,
            templateType,
            isPublic,
            updatedRows: result.affectedRows 
        };
    }
}
