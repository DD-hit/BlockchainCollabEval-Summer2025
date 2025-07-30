import { pool } from '../../config/database.js';

export class MilestoneService {
    static async createMilestone(title, description, projectId, startTime, endTime) {
        // 验证项目是否存在
        const [_projectId] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (_projectId.length === 0) {
            throw new Error('项目不存在');
        }
        
        const [result] = await pool.execute('INSERT INTO milestones (title, description, projectId, status, startTime, endTime) VALUES ( ?, ?, ?, ?, ?, ?)', [title, description, projectId, 'pending', startTime, endTime]);
        return {
            milestoneId: result.insertId,
            title: title,
            description: description,
            projectId: projectId,
            status: 'pending',
        };
    }
    static async getMilestoneList(projectId) {
        const [queryResult] = await pool.execute('SELECT * FROM milestones WHERE projectId = ?', [projectId]);
        return queryResult;
    }
    static async getMilestoneDetail(milestoneId) {
        const [queryResult] = await pool.execute('SELECT * FROM milestones WHERE milestoneId = ?', [milestoneId]);
        return queryResult;
    }
    static async updateMilestone(milestoneId, title, description, startTime, endTime) {
        const [result] = await pool.execute('UPDATE milestones SET title = ?, description = ?, startTime = ?, endTime = ? WHERE milestoneId = ?', [title, description, startTime, endTime, milestoneId]);
        return result;
    }
    static async deleteMilestone(milestoneId) {
        const [result] = await pool.execute('DELETE FROM milestones WHERE milestoneId = ?', [milestoneId]);
        return result;
    }
}