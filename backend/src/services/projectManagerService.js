import { pool } from '../../config/database.js';

export class ProjectManagerService {
    //创建项目
    static async createProject(projectName, projectOwner) {
        if (!projectName) {
            throw new Error('项目名称不能为空');
        }
        const [result] = await pool.execute('INSERT INTO projects (projectName, projectOwner,createTime) VALUES ( ?, ?, now() )', [projectName, projectOwner]);

        return {
            projectId: result.insertId,
            projectName: projectName,
            projectOwner: projectOwner,
            createTime: new Date().toISOString()
        }
    }

    //获取项目列表
    static async getProjectList() {
        const queryResult = await pool.execute('SELECT * FROM projects');
        return queryResult[0];
    }

    //获取项目详情
    static async getProjectDetail(projectId) {
        const queryResult = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        return queryResult[0][0];
    }

    //删除项目
    static async deleteProject(projectId) {
        const queryResult = await pool.execute('DELETE FROM projects WHERE projectId = ?', [projectId]);
        return queryResult[0][0];
    }

    //更新项目
    static async updateProject(projectId, projectName, projectOwner) {
        const queryResult = await pool.execute('UPDATE projects SET projectName = ?, projectOwner = ? WHERE projectId = ?', [projectName, projectOwner, projectId]);
        return queryResult[0][0];
    }


}