// 逾期状态计算工具函数

/**
 * 计算子任务的实际状态
 * @param {Object} subtask - 子任务对象
 * @returns {string} 状态: 'completed' | 'in_progress' | 'overdue'
 */
export const calculateSubtaskStatus = (subtask) => {
  // 如果已完成，直接返回已完成状态
  if (subtask.status === 'completed') {
    return 'completed';
  }
  
  const now = new Date();
  
  // 检查子任务是否逾期（基于子任务自身的结束时间）
  if (subtask.endTime) {
    const endTime = new Date(subtask.endTime);
    if (now > endTime) {
      return 'overdue';
    }
  }
  
  // 默认返回进行中
  return 'in_progress';
};

/**
 * 计算里程碑的实际状态
 * @param {Object} milestone - 里程碑对象
 * @param {Array} subtasks - 里程碑下的子任务列表
 * @returns {string} 状态: 'completed' | 'in_progress' | 'overdue'
 */
export const calculateMilestoneStatus = (milestone, subtasks) => {
  const now = new Date();
  
  // 检查里程碑是否逾期（里程碑结束时间到了）
  if (milestone.endTime) {
    const milestoneEnd = new Date(milestone.endTime);
    if (now > milestoneEnd) {
      // 里程碑结束时间已过
      if (!subtasks || subtasks.length === 0) {
        // 没有子任务，显示逾期
        return 'overdue';
      } else {
        // 有子任务，检查是否全部完成
        const completedSubtasks = subtasks.filter(s => s.status === 'completed');
        if (completedSubtasks.length === subtasks.length) {
          // 所有子任务都完成了，显示完成
          return 'completed';
        } else {
          // 有未完成的子任务，显示逾期
          return 'overdue';
        }
      }
    }
  }
  
  // 里程碑未逾期，检查子任务完成情况
  if (!subtasks || subtasks.length === 0) {
    return 'in_progress';
  }
  
  const completedSubtasks = subtasks.filter(s => s.status === 'completed');
  
  // 如果所有子任务都完成了，里程碑状态为已完成
  if (completedSubtasks.length === subtasks.length) {
    return 'completed';
  }
  
  return 'in_progress';
};

/**
 * 计算项目的实际状态
 * @param {Object} project - 项目对象
 * @param {Array} milestones - 项目下的里程碑列表
 * @param {Object} milestoneSubtasks - 里程碑ID到子任务列表的映射
 * @returns {string} 状态: '进行中' | '已完成' | '已逾期'
 */
export const calculateProjectStatus = (project, milestones, milestoneSubtasks = {}) => {
  const now = new Date();
  
  // 检查项目是否逾期（项目结束时间到了）
  if (project.endTime) {
    const endTime = new Date(project.endTime);
    if (now > endTime) {
      // 项目结束时间已过，检查是否有里程碑
      if (!milestones || milestones.length === 0) {
        // 没有里程碑，项目逾期
        return '已逾期';
      }
      
      // 有里程碑，检查是否所有里程碑都已完成
      let allMilestonesCompleted = true;
      
      for (const milestone of milestones) {
        // 计算里程碑的实际状态
        const subtasks = milestoneSubtasks[milestone.milestoneId] || [];
        const actualMilestoneStatus = calculateMilestoneStatus(milestone, subtasks);
        
        if (actualMilestoneStatus !== 'completed') {
          allMilestonesCompleted = false;
          break;
        }
      }
      
      // 如果项目结束时间已过且有里程碑未完成，则项目逾期
      if (!allMilestonesCompleted) {
        return '已逾期';
      } else {
        // 如果项目结束时间已过但所有里程碑都完成了，则项目已完成
        return '已完成';
      }
    }
  }
  
  // 项目未逾期，检查里程碑完成情况
  if (!milestones || milestones.length === 0) {
    return '进行中';
  }
  

  
  // 检查是否所有里程碑都已完成
  let allMilestonesCompleted = true;
  
  for (const milestone of milestones) {
    // 计算里程碑的实际状态
    const subtasks = milestoneSubtasks[milestone.milestoneId] || [];
    const actualMilestoneStatus = calculateMilestoneStatus(milestone, subtasks);
    
    if (actualMilestoneStatus !== 'completed') {
      allMilestonesCompleted = false;
      break;
    }
  }
  
  // 如果所有里程碑都完成了，项目状态为已完成
  if (allMilestonesCompleted) {
    return '已完成';
  }
  
  return '进行中';
};

/**
 * 将中文状态转换为英文状态（用于API调用）
 * @param {string} chineseStatus - 中文状态
 * @returns {string} 英文状态
 */
export const convertStatusToEnglish = (chineseStatus) => {
  switch (chineseStatus) {
    case '已完成':
      return 'completed'
    case '已逾期':
      return 'overdue'
    case '进行中':
      return 'in_progress'
    default:
      return 'in_progress'
  }
}

/**
 * 获取状态颜色
 * @param {string} status - 状态
 * @returns {string} 颜色代码
 */
export const getStatusColor = (status) => {
  const colors = {
    'in_progress': '#3b82f6',
    '进行中': '#3b82f6',
    'completed': '#10b981',
    '已完成': '#10b981',
    'overdue': '#ef4444',
    '已逾期': '#ef4444'
  };
  return colors[status] || colors['in_progress'];
};

/**
 * 获取状态文本
 * @param {string} status - 状态
 * @returns {string} 状态文本
 */
export const getStatusText = (status) => {
  const texts = {
    'in_progress': '进行中',
    '进行中': '进行中',
    'completed': '已完成',
    '已完成': '已完成',
    'overdue': '已逾期',
    '已逾期': '已逾期'
  };
  return texts[status] || '进行中';
};
