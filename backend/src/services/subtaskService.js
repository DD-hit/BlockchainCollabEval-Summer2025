import { pool } from '../../config/database.js';
import { MilestoneService } from './milestoneService.js';

export class SubtaskService {
    static async createSubtask(milestoneId, title, status, description, assignedTo, startTime, endTime, priority) {
        // 验证里程碑是否存在
        const [milestoneResult] = await pool.execute('SELECT * FROM milestones WHERE milestoneId = ?', [milestoneId]);
        if (milestoneResult.length === 0) {
            throw new Error('里程碑不存在');
        }
        
        const milestone = milestoneResult[0];
        
        // 验证子任务时间是否在里程碑时间范围内
        if (startTime && milestone.startTime) {
            const subtaskStart = new Date(startTime);
            const milestoneStart = new Date(milestone.startTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const subtaskStartDate = new Date(subtaskStart.getFullYear(), subtaskStart.getMonth(), subtaskStart.getDate());
            const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate());
            
            if (subtaskStartDate < milestoneStartDate) {
                throw new Error('子任务开始时间不能早于里程碑开始时间');
            }
        }
        
        if (endTime && milestone.endTime) {
            const subtaskEnd = new Date(endTime);
            const milestoneEnd = new Date(milestone.endTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const subtaskEndDate = new Date(subtaskEnd.getFullYear(), subtaskEnd.getMonth(), subtaskEnd.getDate());
            const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate());
            
            if (subtaskEndDate > milestoneEndDate) {
                throw new Error('子任务结束时间不能晚于里程碑结束时间');
            }
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
            status || 'in_progress',
            description || '', // 改为空字符串而不是null，因为数据库字段是NOT NULL
            assignedTo || null,
            startTime || null,
            endTime || null,
            priority || 2 // 默认中等优先级
        ];
        
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
        // 获取子任务信息以获取里程碑ID
        const [subtaskResult] = await pool.execute('SELECT milestoneId FROM subtasks WHERE subtaskId = ?', [subtaskId]);
        if (subtaskResult.length === 0) {
            throw new Error('子任务不存在');
        }
        
        const milestoneId = subtaskResult[0].milestoneId;
        
        // 获取里程碑信息
        const [milestoneResult] = await pool.execute('SELECT * FROM milestones WHERE milestoneId = ?', [milestoneId]);
        if (milestoneResult.length === 0) {
            throw new Error('里程碑不存在');
        }
        
        const milestone = milestoneResult[0];
        
        // 验证子任务时间是否在里程碑时间范围内
        if (startTime && milestone.startTime) {
            const subtaskStart = new Date(startTime);
            const milestoneStart = new Date(milestone.startTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const subtaskStartDate = new Date(subtaskStart.getFullYear(), subtaskStart.getMonth(), subtaskStart.getDate());
            const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate());
            
            if (subtaskStartDate < milestoneStartDate) {
                throw new Error('子任务开始时间不能早于里程碑开始时间');
            }
        }
        
        if (endTime && milestone.endTime) {
            const subtaskEnd = new Date(endTime);
            const milestoneEnd = new Date(milestone.endTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const subtaskEndDate = new Date(subtaskEnd.getFullYear(), subtaskEnd.getMonth(), subtaskEnd.getDate());
            const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate());
            
            if (subtaskEndDate > milestoneEndDate) {
                throw new Error('子任务结束时间不能晚于里程碑结束时间');
            }
        }
        
        const [result] = await pool.execute('UPDATE subtasks SET title = ?, status = ?, description = ?, assignedTo = ?, startTime = ?, endTime = ?, priority = ? WHERE subtaskId = ?', [title, status, description || '', assignedTo, startTime, endTime, priority, subtaskId]);
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

    static async getMyTasks(username) {
        // 获取分配给当前用户的任务
        const [queryResult] = await pool.execute(`
            SELECT 
                s.subtaskId,
                s.title,
                s.status,
                s.description,
                s.assignedTo,
                s.startTime,
                s.endTime,
                s.priority,
                s.milestoneId,
                m.title as milestoneTitle,
                p.projectId,
                p.projectName,
                p.description as projectDescription
            FROM subtasks s
            JOIN milestones m ON s.milestoneId = m.milestoneId
            JOIN projects p ON m.projectId = p.projectId
            WHERE s.assignedTo = ?
            ORDER BY s.priority DESC, s.endTime ASC
        `, [username]);
        
        return queryResult;
    }
}
