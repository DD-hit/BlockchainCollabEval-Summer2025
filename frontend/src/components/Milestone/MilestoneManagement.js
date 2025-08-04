import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { milestoneAPI, projectAPI, subtaskAPI } from '../../utils/api';
import './Milestone.css';

const MilestoneManagement = ({ user }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [subtasks, setSubtasks] = useState({});
  const [newMilestone, setNewMilestone] = useState({
    milestoneName: '',
    description: '',
    deadline: '',
    priority: 'medium'
  });

  const priorities = [
    { value: 'low', label: '低优先级', color: '#38a169' },
    { value: 'medium', label: '中优先级', color: '#d69e2e' },
    { value: 'high', label: '高优先级', color: '#e53e3e' }
  ];

  useEffect(() => {
    if (projectId) {
      // 从项目页面进入，直接加载该项目的里程碑
      setSelectedProjectId(projectId);
      loadData();
    } else {
      // 从侧边栏进入，先加载用户的项目列表
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
      const [milestonesRes, projectRes] = await Promise.all([
        milestoneAPI.getMilestoneList(selectedProjectId),
        projectAPI.getProjectDetail(selectedProjectId)
      ]);

      if (milestonesRes.data.success) {
        const milestonesData = milestonesRes.data.data;
        setMilestones(milestonesData);
        
        // 为每个里程碑加载子任务
        const subtasksData = {};
        for (const milestone of milestonesData) {
          try {
            const subtaskRes = await subtaskAPI.getSubtaskList(milestone.milestoneId);
            if (subtaskRes.data.success) {
              subtasksData[milestone.milestoneId] = subtaskRes.data.data;
            }
          } catch (error) {
            console.error(`加载里程碑 ${milestone.milestoneId} 的子任务失败:`, error);
            subtasksData[milestone.milestoneId] = [];
          }
        }
        setSubtasks(subtasksData);
      }

      if (projectRes.data.success) {
        setProject(projectRes.data.data);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      setError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      const milestoneData = {
        projectId: parseInt(selectedProjectId || projectId),
        title: newMilestone.milestoneName,
        description: newMilestone.description,
        startDate: new Date().toISOString().split('T')[0], // 当前日期作为开始日期
        endDate: newMilestone.deadline
      };

      const response = await milestoneAPI.createMilestone(milestoneData);
      if (response.data.success) {
        setShowCreateModal(false);
        setNewMilestone({
          milestoneName: '',
          description: '',
          deadline: '',
          priority: 'medium'
        });
        loadData(); // 重新加载数据
      } else {
        setError(response.data.message || '创建里程碑失败');
      }
    } catch (error) {
      console.error('创建里程碑失败:', error);
      setError(error.response?.data?.message || '创建里程碑失败');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('确定要删除这个里程碑吗？这将同时删除所有相关的子任务。')) {
      return;
    }

    try {
      const response = await milestoneAPI.deleteMilestone(milestoneId);
      if (response.data.success) {
        loadData(); // 重新加载数据
      } else {
        setError(response.data.message || '删除里程碑失败');
      }
    } catch (error) {
      console.error('删除里程碑失败:', error);
      setError(error.response?.data?.message || '删除里程碑失败');
    }
  };

  const getMilestoneStatus = (milestone) => {
    const now = new Date();
    const deadline = new Date(milestone.deadline);
    const milestoneSubtasks = subtasks[milestone.milestoneId] || [];
    
    if (milestoneSubtasks.length === 0) return 'planning';
    
    const completedTasks = milestoneSubtasks.filter(task => task.status === 'completed').length;
    const totalTasks = milestoneSubtasks.length;
    
    if (completedTasks === totalTasks) return 'completed';
    if (now > deadline) return 'overdue';
    return 'active';
  };

  const getMilestoneProgress = (milestone) => {
    const milestoneSubtasks = subtasks[milestone.milestoneId] || [];
    if (milestoneSubtasks.length === 0) return 0;
    
    const completedTasks = milestoneSubtasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / milestoneSubtasks.length) * 100);
  };

  const getStatusColor = (status) => {
    const colorMap = {
      'planning': '#718096',
      'active': '#00d4ff',
      'completed': '#48bb78',
      'overdue': '#e53e3e'
    };
    return colorMap[status] || '#718096';
  };

  const getStatusText = (status) => {
    const statusMap = {
      'planning': '计划中',
      'active': '进行中',
      'completed': '已完成',
      'overdue': '已逾期'
    };
    return statusMap[status] || status;
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : '#718096';
  };

  if (loading) {
    return (
      <div className="milestone-management-loading">
        <div className="loading-spinner">⏳</div>
        <p>加载里程碑数据中...</p>
      </div>
    );
  }

  // 如果没有projectId且没有选择项目，显示项目选择界面
  if (!projectId && !selectedProjectId && projects.length > 0) {
    return (
      <div className="milestone-management">
        <div className="page-header">
          <h1>里程碑管理</h1>
          <p>请选择一个项目来管理里程碑</p>
        </div>
        
        <div className="project-selector">
          <h3>选择项目</h3>
          <div className="project-list">
            {projects.map(proj => (
              <div 
                key={proj.projectId} 
                className="project-card"
                onClick={() => setSelectedProjectId(proj.projectId.toString())}
              >
                <h4>{proj.projectName}</h4>
                <p>{proj.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="milestone-management">
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
            <h1>里程碑管理</h1>
            {project && <p>{project.projectName} - 里程碑管理</p>}
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedProjectId}
            >
              + 创建里程碑
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>创建新里程碑</h2>
            <form onSubmit={handleCreateMilestone}>
              <div className="form-group">
                <label htmlFor="milestoneName">里程碑名称</label>
                <input 
                  type="text" 
                  id="milestoneName" 
                  value={newMilestone.milestoneName}
                  onChange={(e) => setNewMilestone({ ...newMilestone, milestoneName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">描述</label>
                <textarea 
                  id="description" 
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deadline">截止日期</label>
                <input 
                  type="date" 
                  id="deadline" 
                  value={newMilestone.deadline}
                  onChange={(e) => setNewMilestone({ ...newMilestone, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="priority">优先级</label>
                <select 
                  id="priority" 
                  value={newMilestone.priority}
                  onChange={(e) => setNewMilestone({ ...newMilestone, priority: e.target.value })}
                >
                  {priorities.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-success">创建</button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="milestone-content">
        {milestones.length > 0 ? (
          <div className="milestone-list">
            {milestones.map(milestone => (
              <div key={milestone.milestoneId} className="milestone-item">
                <div className="milestone-header">
                  <h3 className="milestone-title">{milestone.milestoneName}</h3>
                  <div className="milestone-actions">
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedMilestone(milestone)}
                    >
                      查看详情
                    </button>
                    <button 
                      className="btn btn-danger"
                      onClick={() => handleDeleteMilestone(milestone.milestoneId)}
                    >
                      删除
                    </button>
                  </div>
                </div>
                <div className="milestone-details">
                  <p className="milestone-description">{milestone.description}</p>
                  <div className="milestone-info">
                    <div className="milestone-info-item">
                      <span className="milestone-info-label">截止日期:</span>
                      <span className="milestone-info-value">{milestone.deadline}</span>
                    </div>
                    <div className="milestone-info-item">
                      <span className="milestone-info-label">优先级:</span>
                      <span className="milestone-info-value" style={{ color: getPriorityColor(milestone.priority) }}>
                        {milestone.priority}
                      </span>
                    </div>
                    <div className="milestone-info-item">
                      <span className="milestone-info-label">状态:</span>
                      <span className="milestone-info-value" style={{ color: getStatusColor(getMilestoneStatus(milestone)) }}>
                        {getStatusText(getMilestoneStatus(milestone))}
                      </span>
                    </div>
                    <div className="milestone-info-item">
                      <span className="milestone-info-label">进度:</span>
                      <span className="milestone-info-value">{getMilestoneProgress(milestone)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>暂无里程碑</p>
        )}
      </div>
    </div>
  );
};

export default MilestoneManagement;



