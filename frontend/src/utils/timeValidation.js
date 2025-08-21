// 时间约束验证工具函数

/**
 * 验证里程碑时间是否在项目时间范围内
 * @param {Object} project - 项目信息
 * @param {Object} milestone - 里程碑信息
 * @returns {Object} 验证结果
 */
export function validateMilestoneTime(project, milestone) {
  const errors = []
  
  // 检查开始时间约束
  if (project.startTime && milestone.startTime) {
    const projectStart = new Date(project.startTime)
    const milestoneStart = new Date(milestone.startTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const projectStartDate = new Date(projectStart.getFullYear(), projectStart.getMonth(), projectStart.getDate())
    const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate())
    
    if (milestoneStartDate < projectStartDate) {
      errors.push('里程碑开始时间不能早于项目开始时间')
    }
  } else if (project.startTime && !milestone.startTime) {
    // 如果项目有开始时间但里程碑没有，建议设置里程碑开始时间
    errors.push('建议设置里程碑开始时间，不能早于项目开始时间')
  }
  
  // 检查结束时间约束
  if (project.endTime && milestone.endTime) {
    const projectEnd = new Date(project.endTime)
    const milestoneEnd = new Date(milestone.endTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const projectEndDate = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate())
    const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate())
    
    if (milestoneEndDate > projectEndDate) {
      errors.push('里程碑结束时间不能晚于项目结束时间')
    }
  } else if (project.endTime && !milestone.endTime) {
    // 如果项目有结束时间但里程碑没有，建议设置里程碑结束时间
    errors.push('建议设置里程碑结束时间，不能晚于项目结束时间')
  }
  
  // 检查里程碑时间范围是否合理
  if (milestone.startTime && milestone.endTime) {
    const milestoneStart = new Date(milestone.startTime)
    const milestoneEnd = new Date(milestone.endTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate())
    const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate())
    
    if (milestoneStartDate > milestoneEndDate) {
      errors.push('里程碑开始时间必须早于结束时间')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证子任务时间是否在里程碑时间范围内
 * @param {Object} milestone - 里程碑信息
 * @param {Object} subtask - 子任务信息
 * @returns {Object} 验证结果
 */
export function validateSubtaskTime(milestone, subtask) {
  const errors = []
  
  // 检查开始时间约束
  if (milestone.startTime && subtask.startTime) {
    const milestoneStart = new Date(milestone.startTime)
    const subtaskStart = new Date(subtask.startTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const milestoneStartDate = new Date(milestoneStart.getFullYear(), milestoneStart.getMonth(), milestoneStart.getDate())
    const subtaskStartDate = new Date(subtaskStart.getFullYear(), subtaskStart.getMonth(), subtaskStart.getDate())
    
    if (subtaskStartDate < milestoneStartDate) {
      errors.push('子任务开始时间不能早于里程碑开始时间')
    }
  } else if (milestone.startTime && !subtask.startTime) {
    // 如果里程碑有开始时间但子任务没有，建议设置子任务开始时间
    errors.push('建议设置子任务开始时间，不能早于里程碑开始时间')
  }
  
  // 检查结束时间约束
  if (milestone.endTime && subtask.endTime) {
    const milestoneEnd = new Date(milestone.endTime)
    const subtaskEnd = new Date(subtask.endTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const milestoneEndDate = new Date(milestoneEnd.getFullYear(), milestoneEnd.getMonth(), milestoneEnd.getDate())
    const subtaskEndDate = new Date(subtaskEnd.getFullYear(), subtaskEnd.getMonth(), subtaskEnd.getDate())
    
    if (subtaskEndDate > milestoneEndDate) {
      errors.push('子任务结束时间不能晚于里程碑结束时间')
    }
  } else if (milestone.endTime && !subtask.endTime) {
    // 如果里程碑有结束时间但子任务没有，建议设置子任务结束时间
    errors.push('建议设置子任务结束时间，不能晚于里程碑结束时间')
  }
  
  // 检查子任务时间范围是否合理
  if (subtask.startTime && subtask.endTime) {
    const subtaskStart = new Date(subtask.startTime)
    const subtaskEnd = new Date(subtask.endTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const subtaskStartDate = new Date(subtaskStart.getFullYear(), subtaskStart.getMonth(), subtaskStart.getDate())
    const subtaskEndDate = new Date(subtaskEnd.getFullYear(), subtaskEnd.getMonth(), subtaskEnd.getDate())
    
    if (subtaskStartDate > subtaskEndDate) {
      errors.push('子任务开始时间必须早于结束时间')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证项目时间是否合理
 * @param {Object} project - 项目信息
 * @returns {Object} 验证结果
 */
export function validateProjectTime(project) {
  const errors = []
  
  // 检查项目时间范围是否合理
  if (project.startTime && project.endTime) {
    const projectStart = new Date(project.startTime)
    const projectEnd = new Date(project.endTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const projectStartDate = new Date(projectStart.getFullYear(), projectStart.getMonth(), projectStart.getDate())
    const projectEndDate = new Date(projectEnd.getFullYear(), projectEnd.getMonth(), projectEnd.getDate())
    
    if (projectStartDate > projectEndDate) {
      errors.push('项目开始时间必须早于结束时间')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证时间格式是否正确
 * @param {string} dateString - 日期字符串
 * @returns {boolean} 是否有效
 */
export function isValidDate(dateString) {
  if (!dateString) return true // 空值认为是有效的
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * 验证开始时间是否早于结束时间
 * @param {string} startTime - 开始时间
 * @param {string} endTime - 结束时间
 * @returns {Object} 验证结果
 */
export function validateTimeRange(startTime, endTime) {
  const errors = []
  
  if (startTime && endTime) {
    const start = new Date(startTime)
    const end = new Date(endTime)
    
    // 使用日期比较而不是时间比较，避免时区问题
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate())
    
    if (startDate > endDate) {
      errors.push('开始时间必须早于结束时间')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 获取建议的时间范围
 * @param {Object} parent - 父级对象（项目或里程碑）
 * @param {string} type - 类型：'milestone' 或 'subtask'
 * @returns {Object} 建议的时间范围
 */
export function getSuggestedTimeRange(parent, type) {
  const suggestions = {
    startTime: null,
    endTime: null
  }
  
  if (parent.startTime) {
    suggestions.startTime = parent.startTime
  }
  
  if (parent.endTime) {
    suggestions.endTime = parent.endTime
  }
  
  return suggestions
}

/**
 * 验证完整的时间层级约束
 * @param {Object} project - 项目信息
 * @param {Object} milestone - 里程碑信息（可选）
 * @param {Object} subtask - 子任务信息（可选）
 * @returns {Object} 验证结果
 */
export function validateTimeHierarchy(project, milestone = null, subtask = null) {
  const errors = []
  
  // 验证项目时间
  const projectValidation = validateProjectTime(project)
  errors.push(...projectValidation.errors)
  
  // 如果有里程碑，验证里程碑时间
  if (milestone) {
    const milestoneValidation = validateMilestoneTime(project, milestone)
    errors.push(...milestoneValidation.errors)
  }
  
  // 如果有子任务，验证子任务时间
  if (subtask && milestone) {
    const subtaskValidation = validateSubtaskTime(milestone, subtask)
    errors.push(...subtaskValidation.errors)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
