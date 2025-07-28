import { pool } from '../../config/database.js';

export class ProjectMemberService {
    //添加项目成员
    static async addProjectMember(projectId, username,role,status) {
        //用户存在
        const _username = await pool.execute('SELECT username FROM user WHERE username = ?', [username]);
        if (_username[0].length === 0) {
            throw new Error('用户不存在');
        }
        //项目存在
        const _projectId = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (_projectId[0].length === 0) {
            throw new Error('项目不存在');
        }
        //成员已在项目中
        const _projectMember = await pool.execute('SELECT * FROM project_members WHERE projectId = ? AND username = ?', [projectId, username]);
        if (_projectMember[0].length > 0) {
            throw new Error('成员已在项目中');
        }
        const queryResult = await pool.execute('INSERT INTO project_members (projectId, username,role,status) VALUES (?, ?, ?, ?)', [projectId, username,role,status]);
        return queryResult[0][0];
    }

    //获取项目成员列表
    static async getProjectMemberList(projectId) {
        const _projectId = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (_projectId[0].length === 0) {
            throw new Error('项目不存在');
        }
        const queryResult = await pool.execute('SELECT * FROM project_members WHERE projectId = ?', [projectId]);
        return queryResult[0];

    }

    //删除项目成员
    static async deleteProjectMember(projectId, username) {
        const queryResult = await pool.execute('DELETE FROM project_members WHERE projectId = ? AND username = ?', [projectId, username]);
        return queryResult[0][0];
    }   

    //更新项目成员
    static async updateProjectMember(projectId, username, role, status) {
        const _projectId = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (_projectId[0].length === 0) {
            throw new Error('项目不存在');
        }

        // 2. 验证用户是否存在
        const _username = await pool.execute('SELECT * FROM user WHERE username = ?', [username]);
        if (_username[0].length === 0) {
            throw new Error('用户不存在');
        }

        // 3. 验证用户是否是项目成员
        const _projectMember = await pool.execute(
            'SELECT * FROM project_members WHERE projectId = ? AND username = ?',
            [projectId, username]
        );
        if (_projectMember[0].length === 0) {
            throw new Error('用户不是项目成员');
        }
        const queryResult = await pool.execute('UPDATE project_members SET role = ?, status = ? WHERE projectId = ? AND username = ?', [role, status, projectId, username]);
        return queryResult[0][0];
    }       
}