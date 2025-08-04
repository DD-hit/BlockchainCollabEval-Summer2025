import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectAPI, milestoneAPI, subtaskAPI } from '../../utils/api';
import './TaskBoard.css';

const TaskBoard = ({ user }) => {
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMilestone, setSelectedMilestone] = useState('all');
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
      loadData();
    } else {
      loadProjects();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedProjectId && selectedProjectId !== projectId) {
      loadData();
    }
  }, [selectedProjectId]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getProjectList();
      if (response.data.success) {
        setProjects(response.data.data);
        if (response.data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(response.data.data[0].projectId.toString());
        }
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
      setError('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    if (!selectedProjectId) return;
    
    try {
      setLoading(true);
      const [projectRes, milestonesRes] = await Promise.all([
        projectAPI.getProjectDetail(selectedProjectId),
        milestoneAPI.getMilestoneList(selectedProjectId)
      ]);

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }

      if (milestonesRes.data.success) {
        setMilestones(milestonesRes.data.data);
        
        // 加载所有里程碑的任务
        const allTasks = [];
        for (const milestone of milestonesRes.data.data) {
          try {
            const tasksRes = await subtaskAPI.getSubtaskList(milestone.milestoneId);
            if (tasksRes.data.success) {
              allTasks.push(...tasksRes.data.data.map(task => ({
                ...task,
                milestoneName: milestone.milestoneName
              })));
            }
          } catch (error) {
            console.error(`加载里程碑 ${milestone.milestoneId} 的任务失败:`, error);
          }
        }
        setTasks(allTasks);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredTasks = (status) => {
    let filteredTasks = tasks.filter(task => task.status === status);
    
    if (selectedMilestone !== 'all') {
      filteredTasks = filteredTasks.filter(task => task.milestoneId === parseInt(selectedMilestone));
    }
    
    return filteredTasks;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'pending': '#718096',
      'in_progress': '#ed8936', 
      'completed': '#48bb78'
    };
    return colorMap[status] || '#718096';
  };

  const getStatusIcon = (status) => {
    const iconMap = {
      'pending': '📋',
      'in_progress': '🔄',
      'completed': '✅'
    };
    return iconMap[status] || '📋';
  };

  const getStatusTitle = (status) => {
    const titleMap = {
      'pending': '待办',
      'in_progress': '进行中',
      'completed': '已完成'
    };
    return titleMap[status] || status;
  };

  if (loading) {
    return (
      <div className="task-board-loading">
        <div className="loading-spinner">⏳</div>
        <p>加载任务看板数据中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>❌ 加载失败</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="task-board">
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            {!projectId && (
              <div className="project-selector-dropdown">
                <label>当前项目:</label>
                <select 
                  value={selectedProjectId} 
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(proj => (
                    <option key={proj.projectId} value={proj.projectId}>
                      {proj.projectName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <h1>任务看板</h1>
            {project && <p>{project.projectName} - 任务管理</p>}
          </div>
        </div>
      </div>

      {/* 任务统计 */}
      <div className="task-stats">
        {['pending', 'in_progress', 'completed'].map(status => {
          const count = getFilteredTasks(status).length;
          return (
            <div key={status} className="stat-card">
              <div className="stat-icon" style={{ color: getStatusColor(status) }}>
                {getStatusIcon(status)}
              </div>
              <div className="stat-info">
                <div className="stat-number">{count}</div>
                <div className="stat-label">{getStatusTitle(status)}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 任务看板 */}
      <div className="kanban-board">
        {['pending', 'in_progress', 'completed'].map(status => {
          const columnTasks = getFilteredTasks(status);
          return (
            <div key={status} className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span className="column-icon">{getStatusIcon(status)}</span>
                  <span>{getStatusTitle(status)}</span>
                </div>
                <span className="task-count">{columnTasks.length}</span>
              </div>
              
              <div className="column-content">
                {columnTasks.length > 0 ? (
                  columnTasks.map(task => (
                    <div key={task.subtaskId} className="task-card">
                      <div className="task-header">
                        <h4 className="task-title">{task.taskName}</h4>
                      </div>
                      <p className="task-description">{task.description}</p>
                      <div className="task-footer">
                        <span className="milestone-tag">
                          📍 {task.milestoneName}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-column">
                    <div className="empty-icon">{getStatusIcon(status)}</div>
                    <p>暂无{getStatusTitle(status)}任务</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskBoard;






