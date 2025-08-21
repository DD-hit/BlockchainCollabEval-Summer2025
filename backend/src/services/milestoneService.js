import { pool } from '../../config/database.js';

export class MilestoneService {
    static async createMilestone(title, description, projectId, startTime, endTime) {
        // 验证项目是否存在
        const [projectResult] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (projectResult.length === 0) {
            throw new Error('项目不存在');
        }
        
        const project = projectResult[0];
        
        // 验证里程碑时间是否在项目时间范围内
        if (startTime && project.startTime) {
            const milestoneStart = new Date(startTime);
            const projectStart = new Date(project.startTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate());
            const projectStartDate = new Date(projectStart.getFullYear(), projectStart.getMonth(), projectStart.getDate());
            
            if (milestoneStartDate < projectStartDate) {
                throw new Error('里程碑开始时间不能早于项目开始时间');
            }
        }
        
        if (endTime && project.endTime) {
            const milestoneEnd = new Date(endTime);
            const projectEnd = new Date(project.endTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate());
            const projectEndDate = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate());
            
            if (milestoneEndDate > projectEndDate) {
                throw new Error('里程碑结束时间不能晚于项目结束时间');
            }
        }
        
        // 处理时间格式 - 避免时区偏移
        const formattedStartTime = startTime ? startTime : null;
        const formattedEndTime = endTime ? endTime : null;
        
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
        // 获取里程碑信息以获取项目ID
        const [milestoneResult] = await pool.execute('SELECT projectId FROM milestones WHERE milestoneId = ?', [milestoneId]);
        if (milestoneResult.length === 0) {
            throw new Error('里程碑不存在');
        }
        
        const projectId = milestoneResult[0].projectId;
        
        // 获取项目信息
        const [projectResult] = await pool.execute('SELECT * FROM projects WHERE projectId = ?', [projectId]);
        if (projectResult.length === 0) {
            throw new Error('项目不存在');
        }
        
        const project = projectResult[0];
        
        // 验证里程碑时间是否在项目时间范围内
        if (startTime && project.startTime) {
            const milestoneStart = new Date(startTime);
            const projectStart = new Date(project.startTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate());
            const projectStartDate = new Date(projectStart.getFullYear(), projectStart.getMonth(), projectStart.getDate());
            
            if (milestoneStartDate < projectStartDate) {
                throw new Error('里程碑开始时间不能早于项目开始时间');
            }
        }
        
        if (endTime && project.endTime) {
            const milestoneEnd = new Date(endTime);
            const projectEnd = new Date(project.endTime);
            
            // 使用日期比较而不是时间比较，避免时区问题
            const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate());
            const projectEndDate = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate());
            
            if (milestoneEndDate > projectEndDate) {
                throw new Error('里程碑结束时间不能晚于项目结束时间');
            }
        }
        
        // 处理时间格式 - 避免时区偏移
        const formattedStartTime = startTime ? startTime : null;
        const formattedEndTime = endTime ? endTime : null;
        
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