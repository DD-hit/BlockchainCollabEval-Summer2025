import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { projectAPI } from '../../utils/api';
import './ProjectList.css';

const ProjectList = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadProjects();
    
    // 如果从创建页面跳转过来，显示成功消息
    if (location.state?.shouldRefresh) {
      if (location.state.message) {
        setTimeout(() => alert(location.state.message), 100);
      }
      // 清除状态
      navigate('/projects', { replace: true });
    }
  }, [location.state, navigate]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      // 使用projectAPI.myProjects()方法
      const response = await projectAPI.myProjects();
      if (response.ok) {
        setProjects(response.data || []);
        console.log('加载的项目列表:', response.data); // 调试日志
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
          <Link 
            key={project.projectId}
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
                <span>创建时间: {project.createTime ? new Date(project.createTime).toLocaleDateString() : '未知'}</span>
              </div>
            </div>
          </Link>
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




