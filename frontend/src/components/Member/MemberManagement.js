import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberAPI, projectAPI } from '../../utils/api';
import './Member.css';

const MemberManagement = ({ user }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    username: '',
    role: '开发者'
  });

  const roles = [
    { value: '组长', label: '项目组长', description: '负责项目整体管理和决策' },
    { value: '开发者', label: '开发工程师', description: '负责代码开发和实现' },
    { value: '测试', label: '测试工程师', description: '负责项目测试和质量保证' },
    { value: '设计师', label: 'UI/UX设计师', description: '负责界面设计和用户体验' },
    { value: '产品', label: '产品经理', description: '负责产品规划和需求管理' }
  ];

  useEffect(() => {
    if (projectId) {
      loadData();
    } else {
      // 如果没有projectId，显示所有项目的成员管理
      loadAllMembers();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersRes, projectRes] = await Promise.all([
        memberAPI.getMemberList(projectId),
        projectAPI.getProjectDetail(projectId)
      ]);

      if (membersRes.data.success) {
        setMembers(membersRes.data.data);
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

  const loadAllMembers = async () => {
    try {
      setLoading(true);
      // 这里可以实现获取所有项目成员的逻辑
      setMembers([]);
    } catch (error) {
      console.error('加载成员数据失败:', error);
      setError('加载成员数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const memberData = {
        projectId: parseInt(projectId),
        username: newMember.username,
        role: newMember.role
      };

      const response = await memberAPI.addMember(memberData);
      if (response.data.success) {
        setShowAddModal(false);
        setNewMember({ username: '', role: '开发者' });
        loadData(); // 重新加载数据
      } else {
        setError(response.data.message || '添加成员失败');
      }
    } catch (error) {
      console.error('添加成员失败:', error);
      setError(error.response?.data?.message || '添加成员失败');
    }
  };

  const handleRemoveMember = async (username) => {
    if (!window.confirm(`确定要移除成员 ${username} 吗？`)) {
      return;
    }

    try {
      const response = await memberAPI.deleteMember(projectId, username);
      if (response.data.success) {
        loadData(); // 重新加载数据
      } else {
        setError(response.data.message || '移除成员失败');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      setError(error.response?.data?.message || '移除成员失败');
    }
  };

  const handleUpdateRole = async (username, newRole) => {
    try {
      const memberData = {
        username: username,
        role: newRole
      };

      const response = await memberAPI.updateMember(projectId, memberData);
      if (response.data.success) {
        loadData(); // 重新加载数据
      } else {
        setError(response.data.message || '更新角色失败');
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      setError(error.response?.data?.message || '更新角色失败');
    }
  };

  const getRoleColor = (role) => {
    const colorMap = {
      '组长': '#e53e3e',
      '开发者': '#00d4ff',
      '测试': '#38a169',
      '设计师': '#805ad5',
      '产品': '#d69e2e'
    };
    return colorMap[role] || '#718096';
  };

  const getRoleIcon = (role) => {
    const iconMap = {
      '组长': '👑',
      '开发者': '💻',
      '测试': '🧪',
      '设计师': '🎨',
      '产品': '📋'
    };
    return iconMap[role] || '👤';
  };

  if (loading) {
    return (
      <div className="member-management-loading">
        <div className="loading-spinner">⏳</div>
        <p>加载成员数据中...</p>
      </div>
    );
  }

  return (
    <div className="member-management">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="page-title">
              {project ? `${project.projectName} - 成员管理` : '成员管理'}
            </h1>
            <p className="page-subtitle">
              {project ? '管理项目团队成员和角色权限' : '管理所有项目的团队成员'}
            </p>
          </div>
          <div className="header-actions">
            {projectId && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                ➕ 添加成员
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          <span>❌</span>
          {error}
          <button onClick={() => setError('')} className="close-btn">✕</button>
        </div>
      )}

      {/* 成员统计 */}
      <div className="member-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{members.length}</h3>
            <p>团队成员</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <h3>{members.filter(m => m.role === '组长').length}</h3>
            <p>项目组长</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💻</div>
          <div className="stat-info">
            <h3>{members.filter(m => m.role === '开发者').length}</h3>
            <p>开发工程师</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🧪</div>
          <div className="stat-info">
            <h3>{members.filter(m => m.role === '测试').length}</h3>
            <p>测试工程师</p>
          </div>
        </div>
      </div>

      {/* 成员列表 */}
      <div className="members-section">
        <div className="section-header">
          <h2>团队成员</h2>
          <div className="member-count">共 {members.length} 人</div>
        </div>

        {members.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>暂无团队成员</h3>
            <p>添加团队成员开始协作开发</p>
            {projectId && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                添加第一个成员
              </button>
            )}
          </div>
        ) : (
          <div className="members-grid">
            {members.map(member => (
              <div key={member.username} className="member-card">
                <div className="member-header">
                  <div className="member-avatar">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-info">
                    <h3>{member.username}</h3>
                    <div className="member-role-section">
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateRole(member.username, e.target.value)}
                        className="role-select"
                        style={{ color: getRoleColor(member.role) }}
                      >
                        {roles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="member-details">
                  <div className="detail-item">
                    <span className="detail-label">角色</span>
                    <span 
                      className="role-badge"
                      style={{ backgroundColor: getRoleColor(member.role) }}
                    >
                      {getRoleIcon(member.role)} {member.role}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">加入时间</span>
                    <span className="detail-value">
                      {new Date(member.joinTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="member-actions">
                  <button 
                    className="action-btn edit-btn"
                    title="编辑成员"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn remove-btn"
                    onClick={() => handleRemoveMember(member.username)}
                    title="移除成员"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加成员模态框 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加团队成员</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="add-member-form">
              <div className="form-group">
                <label>用户名 *</label>
                <input
                  type="text"
                  value={newMember.username}
                  onChange={(e) => setNewMember({...newMember, username: e.target.value})}
                  placeholder="输入用户名"
                  required
                />
              </div>

              <div className="form-group">
                <label>角色 *</label>
                <div className="role-options">
                  {roles.map(role => (
                    <div 
                      key={role.value}
                      className={`role-option ${newMember.role === role.value ? 'selected' : ''}`}
                      onClick={() => setNewMember({...newMember, role: role.value})}
                    >
                      <div className="role-header">
                        <span className="role-icon">{getRoleIcon(role.value)}</span>
                        <span className="role-title">{role.label}</span>
                      </div>
                      <p className="role-description">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  添加成员
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
