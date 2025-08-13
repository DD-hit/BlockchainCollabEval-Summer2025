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
        username
    ) {
        // 验证输入
        if (!projectName || !projectOwner) {
            throw new Error('项目名称和项目负责人不能为空');
        }
        
        // 开始事务
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // 创建项目
            const [result] = await connection.execute(
                'INSERT INTO projects (projectName, description, projectOwner, startTime, endTime) VALUES (?, ?, ?, ?, ?)',
                [projectName, description || '', projectOwner, startTime, endTime]
            );
            
            const projectId = result.insertId;
            
            // 自动将创建者添加为项目成员（组长角色）
            await connection.execute(
                'INSERT INTO project_members (projectId, username, role) VALUES (?, ?, ?)',
                [projectId, username, '组长']
            );
            
            await connection.commit();
            
            return {
                projectId: projectId,
                projectName,
                description: description || '',
                projectOwner,
                startTime,
                endTime
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    //获取项目列表
    static async getProjectList() {
        const [queryResult] = await pool.execute('SELECT * FROM projects ORDER BY projectId DESC');
        return queryResult;
    }

    //获取我的项目列表
    static async getMyProjectList(username) {

        
        // 先检查项目成员表
        const [membersResult] = await pool.execute(
            'SELECT * FROM project_members WHERE username = ?',
            [username]
        );

        
        const [queryResult] = await pool.execute(
            'SELECT * FROM projects p WHERE p.projectId IN (SELECT projectId FROM project_members pm WHERE pm.username = ?) ORDER BY p.projectId DESC', 
            [username]
        );
        

        
        return queryResult;
    }

    //获取项目详情
    static async getProjectDetail(projectId) {
        try {
            const [projects] = await pool.execute(
                'SELECT * FROM projects WHERE projectId = ?',
                [projectId]
            );
            
            if (projects.length === 0) {
                throw new Error('项目不存在');
            }
            
            return projects[0];
        } catch (error) {
            console.error('获取项目详情失败:', error);
            throw error;
        }
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
        endTime
    ) {
        // 检查项目是否存在
        const [project] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (project.length === 0) {
            throw new Error('项目不存在');
        }

        const [result] = await pool.execute(
            'UPDATE projects SET projectName = ?, description = ?, startTime = ?, endTime = ? WHERE projectId = ?', 
            [
                projectName, 
                description,
                startTime,
                endTime,
                projectId
            ]
        );
        
        return { 
            projectId,
            projectName,
            description,
            startTime,
            endTime,
            updatedRows: result.affectedRows 
        };
    }
}
