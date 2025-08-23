import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { projectAPI, milestoneAPI, subtaskAPI } from '../../utils/api';
import { calculateProjectStatus, getStatusColor, getStatusText, convertStatusToEnglish } from '../../utils/overdueUtils';
import GitHubRepos from './GitHubRepos';
import './ProjectList.css';

const ProjectList = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' 或 'github'
  const navigate = useNavigate();
  const location = useLocation();

  // 获取当前用户信息
  const currentUser = user || {
    username: sessionStorage.getItem('username'),
    address: sessionStorage.getItem('address')
  };

  useEffect(() => {
    const currentUserInfo = {
      username: sessionStorage.getItem('username'),
      address: sessionStorage.getItem('address'),
      token: sessionStorage.getItem('token')
    };
    
    loadProjects();
    
    // 如果从创建页面跳转过来，显示成功消息
    if (location.state?.shouldRefresh) {
      if (location.state.message) {
        setTimeout(() => alert(location.state.message), 100);
      }
      // 清除状态
      navigate('/projects', { replace: true });
    }
  }, [location.state, navigate, currentUser]);

  // 监听子任务状态变化，自动刷新项目列表
  useEffect(() => {
    const handleSubtaskChange = () => {
      loadProjects();
    };

    // 监听自定义事件
    window.addEventListener('subtaskStatusChanged', handleSubtaskChange);
    
    // 添加定时器，每分钟检查一次逾期状态
    const intervalId = setInterval(() => {
      loadProjects();
    }, 60000); // 每分钟刷新一次
    
    return () => {
      window.removeEventListener('subtaskStatusChanged', handleSubtaskChange);
      clearInterval(intervalId);
    };
  }, []);

  // 计算项目实际状态
  const calculateProjectActualStatus = async (project) => {
    try {
      // 获取项目的所有里程碑
      const milestonesResponse = await milestoneAPI.listByProject(project.projectId)
      if (!milestonesResponse.ok || !milestonesResponse.data) {
        return project.status || '进行中'
      }

      const milestones = Array.isArray(milestonesResponse.data) ? milestonesResponse.data : []
      if (milestones.length === 0) {
        return project.status || '进行中'
      }

      // 获取所有里程碑的子任务信息
      const milestoneSubtasks = {}
      for (const milestone of milestones) {
        try {
          const subtasksResponse = await subtaskAPI.list(milestone.milestoneId)
          if (subtasksResponse.ok && subtasksResponse.data) {
            const subtasks = Array.isArray(subtasksResponse.data) ? subtasksResponse.data : []
            milestoneSubtasks[milestone.milestoneId] = subtasks
          } else {
            milestoneSubtasks[milestone.milestoneId] = []
          }
        } catch (error) {
          console.error(`获取里程碑 ${milestone.milestoneId} 的子任务失败:`, error)
          milestoneSubtasks[milestone.milestoneId] = []
        }
      }

      // 使用工具函数计算项目状态（基于里程碑状态和子任务信息）
      const calculatedStatus = calculateProjectStatus(project, milestones, milestoneSubtasks)
      
      // 如果计算出的状态与数据库状态不一致，更新数据库
      if (calculatedStatus !== project.status) {
        try {
          // 将中文状态转换为英文状态用于API调用
          const englishStatus = convertStatusToEnglish(calculatedStatus)
          await projectAPI.updateStatus(project.projectId, englishStatus)
        } catch (updateError) {
          console.error(`更新项目 ${project.projectId} 状态失败:`, updateError)
        }
      }
      
      return calculatedStatus
    } catch (error) {
      console.error(`计算项目 ${project.projectId} 状态失败:`, error)
      return project.status || '进行中'
    }
  }

  const loadProjects = async () => {
    try {
      setLoading(true);

      // 使用projectAPI.myProjects()方法
      const response = await projectAPI.myProjects();
      
      if (response.ok) {
        const projectsData = response.data || [];
        
        // 为每个项目计算实际状态
        const projectsWithStatus = await Promise.all(
          projectsData.map(async (project) => {
            const actualStatus = await calculateProjectActualStatus(project)
            return {
              ...project,
              actualStatus
            }
          })
        )
        
        setProjects(projectsWithStatus);
        
      } else {
        console.error('获取项目列表失败:', response.error);
      }
    } catch (error) {
      console.error('加载项目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadProjects();
  };

  const handleDeleteProject = async (projectId, projectName, e) => {
    e.preventDefault(); // 阻止Link的导航
    e.stopPropagation(); // 阻止事件冒泡
    
    if (!window.confirm(`确定要删除项目"${projectName}"吗？此操作不可撤销。`)) {
      return;
    }

    try {
      const response = await projectAPI.delete(projectId);
      if (response.ok) {
        alert('项目删除成功！');
        loadProjects(); // 重新加载项目列表
      } else {
        alert(`删除失败: ${response.error?.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      alert('删除项目失败');
    }
  };

  if (loading) {
    return <div className="loading">加载项目列表...</div>;
  }

  const handleRepoSelect = (repo) => {
    // 可以在这里处理仓库选择，比如创建新项目时关联GitHub仓库
    console.log('选择的仓库:', repo);
    // 可以跳转到创建项目页面并传递仓库信息
    navigate('/project/create', { 
      state: { 
        githubRepo: repo,
        message: `已选择GitHub仓库: ${repo.name}`
      }
    });
  };

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h1>项目管理</h1>
        <div className="header-actions">
          <button 
            className="refresh-btn"
            onClick={handleRefresh}
            title="刷新列表"
          >
            🔄 刷新
          </button>
          <button 
            className="create-project-btn"
            onClick={() => navigate('/project/create')}
          >
            + 创建项目
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📋 我的项目
        </button>
        <button 
          className={`tab-btn ${activeTab === 'github' ? 'active' : ''}`}
          onClick={() => setActiveTab('github')}
        >
          📚 GitHub 仓库
        </button>
      </div>

      {/* 项目列表标签页 */}
      {activeTab === 'projects' && (
        <>
          <div className="projects-grid">
            {projects.map(project => (
              <div key={project.projectId} className="project-card-wrapper">
                <Link 
                  to={`/project/${project.projectId}`} 
                  className="project-link"
                >
                  <div className="project-card">
                    <div className="project-header">
                      <h3>{project.projectName}</h3>
                      <span 
                        className="project-status" 
                        data-status={project.actualStatus || project.status || '进行中'}
                        style={{ 
                          background: getStatusColor(project.actualStatus || project.status || '进行中'),
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        {getStatusText(project.actualStatus || project.status || '进行中')}
                      </span>
                    </div>
                    <p className="project-description">{project.description || '暂无描述'}</p>
                    <div className="project-meta">
                      <span>负责人: {project.projectOwner}</span>
                    </div>
                  </div>
                </Link>
                
                {/* 删除按钮 - 只有项目所有者才能看到 */}
                {user && user.username === project.projectOwner && (
                  <button
                    className="delete-project-btn"
                    onClick={(e) => handleDeleteProject(project.projectId, project.projectName, e)}
                    title="删除项目"
                  >
                    🗑️
                  </button>
                )}
              </div>
            ))}
          </div>

          {projects.length === 0 && !loading && (
            <div className="no-projects">
              <h3>还没有项目</h3>
              <p>创建您的第一个项目开始协作吧！</p>
              <button 
                className="create-first-project-btn"
                onClick={() => navigate('/project/create')}
              >
                创建项目
              </button>
            </div>
          )}
        </>
      )}

      {/* GitHub仓库标签页 */}
      {activeTab === 'github' && (
        <GitHubRepos onRepoSelect={handleRepoSelect} />
      )}
    </div>
  );
};

export default ProjectList;





