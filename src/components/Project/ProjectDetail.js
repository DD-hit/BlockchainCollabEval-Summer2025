import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './Project.css';

const ProjectDetail = ({ user }) => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const fetchProjectDetail = async () => {
    try {
      // 模拟API调用
      setTimeout(() => {
        setProject({
          id: parseInt(id),
          name: '区块链投票系统',
          description: '基于以太坊的去中心化投票平台，支持多种投票模式，确保投票过程的透明性和不可篡改性。',
          status: '进行中',
          progress: 65,
          startDate: '2024-01-15',
          endDate: '2024-03-15',
          creator: 'admin',
          createdAt: '2024-01-15'
        });

        setMembers([
          { username: 'alice', address: '0x1234...5678', role: '前端开发', joinDate: '2024-01-15' },
          { username: 'bob', address: '0x2345...6789', role: '智能合约开发', joinDate: '2024-01-16' },
          { username: 'charlie', address: '0x3456...7890', role: '测试工程师', joinDate: '2024-01-17' },
          { username: 'david', address: '0x4567...8901', role: 'UI设计师', joinDate: '2024-01-18' }
        ]);

        setTasks([
          {
            id: 1,
            title: '智能合约架构设计',
            description: '设计投票合约的整体架构',
            status: '已完成',
            priority: '高',
            assignee: 'bob',
            estimatedHours: 20,
            actualHours: 18,
            dueDate: '2024-01-25',
            completedDate: '2024-01-24'
          },
          {
            id: 2,
            title: '前端界面开发',
            description: '开发用户投票界面',
            status: '进行中',
            priority: '高',
            assignee: 'alice',
            estimatedHours: 30,
            actualHours: 15,
            dueDate: '2024-02-05',
            completedDate: null
          },
          {
            id: 3,
            title: '合约安全审计',
            description: '对智能合约进行安全性测试',
            status: '未开始',
            priority: '中',
            assignee: 'charlie',
            estimatedHours: 25,
            actualHours: 0,
            dueDate: '2024-02-15',
            completedDate: null
          }
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('获取项目详情失败:', error);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '进行中': return '#28a745';
      case '已完成': return '#007bff';
      case '未开始': return '#6c757d';
      case '已暂停': return '#ffc107';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case '高': return '#dc3545';
      case '中': return '#ffc107';
      case '低': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="project-detail">
        <div className="loading">
          <div className="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail">
        <div className="container">
          <div className="alert alert-error">项目不存在或已被删除</div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail">
      <div className="container">
        {/* 项目头部 */}
        <div className="project-header-section">
          <div className="project-title">
            <h1>{project.name}</h1>
            <span 
              className="status-badge large"
              style={{ backgroundColor: getStatusColor(project.status) }}
            >
              {project.status}
            </span>
          </div>
          <div className="project-actions">
            <Link to={`/project/${project.id}/tasks/assign`} className="btn btn-primary">
              📋 任务分配
            </Link>
            <Link to={`/project/${project.id}/upload`} className="btn btn-success">
              📁 文件上传
            </Link>
            <button className="btn btn-secondary">⚙️ 项目设置</button>
          </div>
        </div>

        {/* 项目进度 */}
        <div className="progress-section">
          <div className="progress-info">
            <span>项目进度</span>
            <span>{project.progress}%</span>
          </div>
          <div className="progress-bar large">
            <div 
              className="progress-fill"
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="tabs-nav">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 项目概览
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📋 任务列表
          </button>
          <button 
            className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            👥 团队成员
          </button>
          <button 
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            📁 项目文件
          </button>
        </div>

        {/* 标签页内容 */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>📝 项目描述</h3>
                  <p>{project.description}</p>
                </div>
                
                <div className="overview-card">
                  <h3>📅 项目时间</h3>
                  <div className="date-info">
                    <div>开始日期: {project.startDate}</div>
                    <div>结束日期: {project.endDate}</div>
                    <div>创建时间: {project.createdAt}</div>
                  </div>
                </div>
                
                <div className="overview-card">
                  <h3>📊 项目统计</h3>
                  <div className="stats-grid-small">
                    <div className="stat-item">
                      <span className="stat-number">{tasks.length}</span>
                      <span className="stat-label">总任务数</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{tasks.filter(t => t.status === '已完成').length}</span>
                      <span className="stat-label">已完成</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{tasks.filter(t => t.status === '进行中').length}</span>
                      <span className="stat-label">进行中</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{members.length}</span>
                      <span className="stat-label">团队成员</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="tasks-tab">
              <div className="tasks-header">
                <h3>📋 任务列表</h3>
                <Link to={`/project/${project.id}/tasks/assign`} className="btn btn-primary">
                  ➕ 分配新任务
                </Link>
              </div>
              
              <div className="tasks-table">
                <div className="table-header">
                  <div>任务名称</div>
                  <div>负责人</div>
                  <div>状态</div>
                  <div>优先级</div>
                  <div>截止日期</div>
                  <div>进度</div>
                </div>
                
                {tasks.map(task => (
                  <div key={task.id} className="table-row">
                    <div className="task-info">
                      <strong>{task.title}</strong>
                      <p>{task.description}</p>
                    </div>
                    <div>{task.assignee}</div>
                    <div>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(task.status) }}
                      >
                        {task.status}
                      </span>
                    </div>
                    <div>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <div>{task.dueDate}</div>
                    <div>
                      <div className="mini-progress">
                        <div 
                          className="mini-progress-fill"
                          style={{ 
                            width: `${task.status === '已完成' ? 100 : 
                                   task.status === '进行中' ? 50 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="members-tab">
              <div className="members-header">
                <h3>👥 团队成员</h3>
                <button className="btn btn-primary">➕ 邀请成员</button>
              </div>
              
              <div className="members-grid">
                {members.map((member, index) => (
                  <div key={index} className="member-card">
                    <div className="member-avatar">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <h4>{member.username}</h4>
                      <p className="member-role">{member.role}</p>
                      <p className="member-address">{member.address}</p>
                      <p className="member-join">加入时间: {member.joinDate}</p>
                    </div>
                    <div className="member-actions">
                      <button className="btn btn-sm btn-secondary">查看详情</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="files-tab">
              <div className="files-header">
                <h3>📁 项目文件</h3>
                <Link to={`/project/${project.id}/upload`} className="btn btn-primary">
                  📤 上传文件
                </Link>
              </div>
              
              <div className="files-list">
                <div className="file-item">
                  <div className="file-icon">📄</div>
                  <div className="file-info">
                    <h4>项目需求文档.pdf</h4>
                    <p>上传者: admin | 2024-01-15 | 2.5MB</p>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-sm btn-secondary">下载</button>
                  </div>
                </div>
                
                <div className="file-item">
                  <div className="file-icon">💻</div>
                  <div className="file-info">
                    <h4>智能合约代码.sol</h4>
                    <p>上传者: bob | 2024-01-20 | 15KB</p>
                  </div>
                  <div className="file-actions">
                    <button className="btn btn-sm btn-secondary">下载</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;