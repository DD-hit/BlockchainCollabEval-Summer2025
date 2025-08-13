import { pool } from '../../config/database.js';

export class MilestoneService {
    static async createMilestone(title, description, projectId, startTime, endTime) {
        // 验证项目是否存在
        const [_projectId] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (_projectId.length === 0) {
            throw new Error('项目不存在');
        }
        
        // 处理时间格式
        const formattedStartTime = startTime ? new Date(startTime).toISOString().slice(0, 19).replace('T', ' ') : null;
        const formattedEndTime = endTime ? new Date(endTime).toISOString().slice(0, 19).replace('T', ' ') : null;
        
        const [result] = await pool.execute('INSERT INTO milestones (title, description, projectId, status, startTime, endTime) VALUES ( ?, ?, ?, ?, ?, ?)', [title, description, projectId, 'in_progress', formattedStartTime, formattedEndTime]);
        return {
            milestoneId: result.insertId,
            title: title,
            description: description,
            projectId: projectId,
            status: 'in_progress',
            startTime: formattedStartTime,
            endTime: formattedEndTime
        };
    }
    static async getMilestoneList(projectId) {
        const [queryResult] = await pool.execute('SELECT * FROM milestones WHERE projectId = ?', [projectId]);
        return queryResult;
    }
    static async getMilestoneDetail(milestoneId) {
        const [queryResult] = await pool.execute('SELECT * FROM milestones WHERE milestoneId = ?', [milestoneId]);
        if (queryResult.length === 0) {
            throw new Error(`里程碑ID ${milestoneId} 不存在`);
        }
        return queryResult[0];
    }
    static async updateMilestone(milestoneId, title, description, startTime, endTime) {
        // 处理时间格式
        const formattedStartTime = startTime ? new Date(startTime).toISOString().slice(0, 19).replace('T', ' ') : null;
        const formattedEndTime = endTime ? new Date(endTime).toISOString().slice(0, 19).replace('T', ' ') : null;
        
        const [result] = await pool.execute('UPDATE milestones SET title = ?, description = ?, startTime = ?, endTime = ? WHERE milestoneId = ?', [title, description, formattedStartTime, formattedEndTime, milestoneId]);
        return result;
    }

    static async updateMilestoneStatus(milestoneId, status) {
        const [result] = await pool.execute('UPDATE milestones SET status = ? WHERE milestoneId = ?', [status, milestoneId]);
        return result;
    }
    static async deleteMilestone(milestoneId) {
        const [result] = await pool.execute('DELETE FROM milestones WHERE milestoneId = ?', [milestoneId]);
        return result;
    }
    static async getProjectIdByMilestoneId(milestoneId) {
        const [queryResult] = await pool.execute('SELECT projectId FROM milestones WHERE milestoneId = ?', [milestoneId]);
        return queryResult[0].projectId;
    }
}