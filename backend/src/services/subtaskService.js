import { pool } from '../../config/database.js';
import { MilestoneService } from './milestoneService.js';

export class SubtaskService {
    static async createSubtask(milestoneId, title, status, description, assignedTo, startTime, endTime, priority) {
        // 验证里程碑是否存在
        const milestoneExists = await pool.execute('SELECT * FROM milestones WHERE milestoneId = ?', [milestoneId]);
        if (milestoneExists[0].length === 0) {
            throw new Error('里程碑不存在');
        }
        
        // 如果指定了分配用户，验证用户是否存在
        if (assignedTo) {
            const userExists = await pool.execute('SELECT * FROM user WHERE username = ?', [assignedTo]);
            if (userExists[0].length === 0) {
                throw new Error('指定的用户不存在');
            }
        }
        
        // 确保所有参数都不是undefined
        const params = [
            milestoneId,
            title,
            status || 'todo',
            description || null,
            assignedTo || null,
            startTime || null,
            endTime || null,
            priority || 2 // 默认中等优先级
        ];
        
        console.log('创建子任务参数:', params); // 调试日志
        
        const [result] = await pool.execute(
            'INSERT INTO subtasks (milestoneId, title, status, description, assignedTo, startTime, endTime, priority) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
            params
        );
        return result.insertId;
    }
    static async getSubtaskList(milestoneId) {
        const [queryResult] = await pool.execute('SELECT * FROM subtasks WHERE milestoneId = ?', [milestoneId]);
        return queryResult;
    }
    static async getSubtaskDetail(subtaskId) {
        const [queryResult] = await pool.execute('SELECT * FROM subtasks WHERE subtaskId = ?', [subtaskId]);
        return queryResult[0];
    }
    static async updateSubtask(subtaskId, title, status, description, assignedTo, startTime, endTime, priority) {
        const [result] = await pool.execute('UPDATE subtasks SET title = ?, status = ?, description = ?, assignedTo = ?, startTime = ?, endTime = ?, priority = ? WHERE subtaskId = ?', [title, status, description, assignedTo, startTime, endTime, priority, subtaskId]);
        return result;
    }
    static async deleteSubtask(subtaskId) {
        const [result] = await pool.execute('DELETE FROM subtasks WHERE subtaskId = ?', [subtaskId]);
        return result;
    }

    static async getMilestoneIdBySubtaskId(subtaskId) {
        const [queryResult] = await pool.execute('SELECT milestoneId FROM subtasks WHERE subtaskId = ?', [subtaskId]);
        if (queryResult.length === 0) {
            throw new Error(`子任务ID ${subtaskId} 不存在`);
        }
        return queryResult[0].milestoneId;
    }

    static async getProjectIdBySubtaskId(subtaskId) {
        const milestoneId = await this.getMilestoneIdBySubtaskId(subtaskId);
        const projectId = await MilestoneService.getProjectIdByMilestoneId(milestoneId);
        return projectId;
    }
}
