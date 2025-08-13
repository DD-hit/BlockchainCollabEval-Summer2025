import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { projectAPI } from '../../utils/api';
import './ProjectList.css';

const ProjectList = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const loadProjects = async () => {
    try {
      setLoading(true);

      // 使用projectAPI.myProjects()方法
      const response = await projectAPI.myProjects();
      
      if (response.ok) {
        setProjects(response.data || []);
        
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

  return (
    <div className="project-list">
      <div className="project-list-header">
        <h1>我的项目</h1>
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
                  <span className="project-status">{project.status || '进行中'}</span>
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
    </div>
  );
};

export default ProjectList;




