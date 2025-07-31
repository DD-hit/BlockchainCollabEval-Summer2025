import { pool } from '../../config/database.js';
import { ProjectMemberService } from './projectMemberService.js';

export class ProjectManagerService {
    //创建项目
    static async createProject(projectName, description, projectOwner, startTime, endTime) {
        if (!projectName) {
            throw new Error('项目名称不能为空');
        }
        
        // 先插入项目到数据库
        const [result] = await pool.execute('INSERT INTO projects (projectName, description, projectOwner, startTime, endTime) VALUES ( ?, ?, ?, ?, ?)', [projectName, description, projectOwner, startTime, endTime]);
        
        // 获取生成的projectId
        const projectId = result.insertId;
        
        // 然后添加项目成员
        await ProjectMemberService.addProjectMember(projectId, projectOwner,'组长');

        return {
            projectId: projectId,
            projectName: projectName,
            description: description,
            projectOwner: projectOwner,
            startTime: startTime,
            endTime: endTime,
        }
    }

    //获取项目列表
    static async getProjectList() {
        const [queryResult] = await pool.execute('SELECT * FROM projects');
        return queryResult;
    }

    //获取我的项目列表
    static async getMyProjectList(username) {
        const [queryResult] = await pool.execute('SELECT * FROM projects WHERE projectOwner = ?', [username]);
        return queryResult;
    }

    //获取项目详情
    static async getProjectDetail(projectId) {
        const [queryResult] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        return queryResult[0];
    }

    //删除项目
    static async deleteProject(projectId) {
        const [queryResult] = await pool.execute('DELETE FROM projects WHERE projectId = ?', [projectId]);
        return queryResult[0];
    }

    //更新项目
    static async updateProject(projectId, projectName, projectOwner) {
        const [queryResult] = await pool.execute('UPDATE projects SET projectName = ?, projectOwner = ? WHERE projectId = ?', [projectName, projectOwner, projectId]);
        return queryResult[0];
    }


}