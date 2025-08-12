import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './MemberManagement.css';

const MemberManagement = ({ projectId, user, isProjectOwner }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ username: '', role: 'member' });
  const [memberStats, setMemberStats] = useState({});

  useEffect(() => {
    loadMembers();
    loadMemberStats();
  }, [projectId]);

  const loadMembers = async () => {
    try {
      const response = await api.get(`/api/projectMembers/list/${projectId}`);
      if (response.data.success) {
        setMembers(response.data.data);
      }
    } catch (error) {
      console.error('加载成员列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberStats = async () => {
    try {
      const response = await api.get(`/api/score/member-contributions/${projectId}`);
      if (response.data.success) {
        setMemberStats(response.data.data);
      }
    } catch (error) {
      console.error('加载成员统计失败:', error);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.username.trim()) {
      alert('请输入用户名');
      return;
    }

    try {
      const response = await api.post('/api/projectMembers/add', {
        projectId: parseInt(projectId),
        username: newMember.username.trim(),
        role: newMember.role
      });

      if (response.data.success) {
        setMembers([...members, response.data.data]);
        setNewMember({ username: '', role: 'member' });
        setShowAddModal(false);
        alert('成员添加成功');
      }
    } catch (error) {
      console.error('添加成员失败:', error);
      alert(error.response?.data?.message || '添加成员失败');
    }
  };

  const handleUpdateMemberRole = async (username, newRole) => {
    try {
      const response = await api.put('/api/projectMembers/update', {
        projectId: parseInt(projectId),
        username,
        role: newRole
      });

      if (response.data.success) {
        setMembers(members.map(member => 
          member.username === username 
            ? { ...member, role: newRole }
            : member
        ));
        alert('角色更新成功');
      }
    } catch (error) {
      console.error('更新成员角色失败:', error);
      alert('更新成员角色失败');
    }
  };

  const handleRemoveMember = async (username) => {
    if (!window.confirm(`确定要移除成员 ${username} 吗？`)) return;

    try {
      const response = await api.delete('/api/projectMembers/remove', {
        data: {
          projectId: parseInt(projectId),
          username
        }
      });

      if (response.data.success) {
        setMembers(members.filter(member => member.username !== username));
        alert('成员移除成功');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      alert('移除成员失败');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'manager': '#10b981',
      'leader': '#f59e0b', 
      'member': '#6366f1'
    };
    return colors[role] || colors.member;
  };

  const getRoleText = (role) => {
    const texts = {
      'manager': '项目经理',
      'leader': '组长',
      'member': '成员'
    };
    return texts[role] || '成员';
  };

  if (loading) {
    return <div className="loading">加载成员列表...</div>;
  }

  return (
    <div className="member-management">
      <div className="member-header">
        <h2>👥 成员管理</h2>
        {isProjectOwner && (
          <button 
            className="add-member-btn"
            onClick={() => setShowAddModal(true)}
          >
            + 添加成员
          </button>
        )}
      </div>

      {/* 成员贡献统计 */}
      <div className="member-stats-section">
        <h3>📊 成员贡献统计</h3>
        <div className="contribution-chart">
          {members.map(member => {
            const stats = memberStats[member.username] || { score: 0, tasks: 0 };
            return (
              <div key={member.username} className="contribution-item">
                <div className="member-avatar">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className="contribution-info">
                  <h4>{member.username}</h4>
                  <div className="contribution-metrics">
                    <span className="metric">
                      <span className="metric-label">评分:</span>
                      <span className="metric-value">{stats.score || 0}</span>
                    </span>
                    <span className="metric">
                      <span className="metric-label">任务:</span>
                      <span className="metric-value">{stats.tasks || 0}</span>
                    </span>
                  </div>
                </div>
                <div className="contribution-bar">
                  <div 
                    className="contribution-fill"
                    style={{ 
                      width: `${Math.min((stats.score || 0) / 100 * 100, 100)}%`,
                      background: getRoleColor(member.role)
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 成员列表 */}
      <div className="member-list-section">
        <h3>👤 成员列表</h3>
        <div className="member-list">
          {members.map(member => (
            <div key={member.username} className="member-item">
              <div className="member-info">
                <div className="member-avatar">
                  {member.username.charAt(0).toUpperCase()}
                </div>
                <div className="member-details">
                  <h4>{member.username}</h4>
                  <span 
                    className="member-role"
                    style={{ background: getRoleColor(member.role) }}
                  >
                    {getRoleText(member.role)}
                  </span>
                </div>
              </div>
              
              <div className="member-actions">
                {isProjectOwner && member.username !== user.username && (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member.username, e.target.value)}
                      className="role-selector"
                    >
                      <option value="member">成员</option>
                      <option value="leader">组长</option>
                      <option value="manager">项目经理</option>
                    </select>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveMember(member.username)}
                    >
                      移除
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 添加成员模态框 */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加成员</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="modal-body">
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={newMember.username}
                  onChange={(e) => setNewMember({...newMember, username: e.target.value})}
                  placeholder="请输入用户名"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>角色</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                >
                  <option value="member">成员</option>
                  <option value="leader">组长</option>
                  <option value="manager">项目经理</option>
                </select>
              </div>
              
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  取消
                </button>
                <button type="submit">
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
