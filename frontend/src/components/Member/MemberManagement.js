import React, { useState, useEffect } from 'react';
import api, { projectMemberAPI, scoreAPI } from '../../utils/api';
import './MemberManagement.css';

const MemberManagement = ({ projectId, user, isProjectOwner }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ username: '', role: '项目负责人' });
  const [memberStats, setMemberStats] = useState({});

  useEffect(() => {
    loadMembers();
    loadMemberStats();
  }, [projectId]);

  // 监听贡献更新事件
  useEffect(() => {
    const handleContributionUpdate = () => {
  
      loadMembers();
      loadMemberStats();
    };

    window.addEventListener('contributionUpdated', handleContributionUpdate);
    
    return () => {
      window.removeEventListener('contributionUpdated', handleContributionUpdate);
    };
  }, []);

  const loadMembers = async () => {
    try {

      const response = await projectMemberAPI.list(projectId);
      
      if (response.ok && response.data) {
        setMembers(response.data);
        
      } else {
        console.error('加载成员列表失败:', response.error);
        setMembers([]); // 设置为空数组而不是undefined
      }
    } catch (error) {
      console.error('加载成员列表失败:', error);
      setMembers([]); // 设置为空数组而不是undefined
    } finally {
      setLoading(false);
    }
  };

  const loadMemberStats = async () => {
    try {

      const response = await scoreAPI.getProjectContributions(projectId);
      
      if (response.ok && response.data) {
        // 将数组转换为对象格式，以username为key
        const statsObj = {};
        response.data.forEach(member => {
          statsObj[member.username] = {
            score: member.score,
            tasks: member.tasks
          };
        });
        setMemberStats(statsObj);
        
      } else {
        console.error('加载成员统计失败:', response.error);
        setMemberStats({});
      }
    } catch (error) {
      console.error('加载成员统计失败:', error);
      setMemberStats({});
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.username.trim()) {
      alert('请输入用户名');
      return;
    }

    try {
      const response = await projectMemberAPI.add({
        projectId: parseInt(projectId),
        username: newMember.username.trim(),
        role: newMember.role
      });

             if (response.ok) {
         setMembers([...members, response.data]);
         setNewMember({ username: '', role: '项目负责人' });
         setShowAddModal(false);
         alert('成员添加成功');
         loadMembers(); // 重新加载成员列表
       } else {
        alert(response.error?.message || '添加成员失败');
      }
    } catch (error) {
      console.error('添加成员失败:', error);
      alert('添加成员失败');
    }
  };

  const handleUpdateMemberRole = async (username, newRole) => {
    try {
      const response = await projectMemberAPI.update(projectId, {
        username,
        role: newRole
      });

      if (response.ok) {
        setMembers(members.map(member => 
          member.username === username 
            ? { ...member, role: newRole }
            : member
        ));
        alert('角色更新成功');
      } else {
        alert(response.error?.message || '更新成员角色失败');
      }
    } catch (error) {
      console.error('更新成员角色失败:', error);
      alert('更新成员角色失败');
    }
  };

  const handleRemoveMember = async (username) => {
    if (!window.confirm(`确定要移除成员 ${username} 吗？`)) return;

    try {
      const response = await projectMemberAPI.delete(projectId, {
        username
      });

      if (response.ok) {
        setMembers(members.filter(member => member.username !== username));
        alert('成员移除成功');
      } else {
        alert(response.error?.message || '移除成员失败');
      }
    } catch (error) {
      console.error('移除成员失败:', error);
      alert('移除成员失败');
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      '项目负责人': '#dc2626', // 红色
      '技术负责人': '#ea580c', // 橙色
      '前端开发': '#2563eb', // 蓝色
      '后端开发': '#7c3aed', // 紫色
      '全栈开发': '#059669', // 绿色
      'UI/UX设计师': '#db2777', // 粉色
      '产品经理': '#0891b2', // 青色
      '测试工程师': '#65a30d', // 青绿色
      '运维工程师': '#9333ea', // 深紫色
      '数据分析师': '#ea580c', // 橙色
      '文档编写': '#6b7280', // 灰色
      '组长': '#f59e0b'
    };
    return colors[role] || '#6366f1'; // 默认蓝色
  };

  const getRoleText = (role) => {
    // 如果已经是中文，直接返回
    if (['组长', '项目负责人', '技术负责人', '前端开发', '后端开发', '全栈开发', 'UI/UX设计师', '产品经理', '测试工程师', '运维工程师', '数据分析师', '文档编写'].includes(role)) {
      return role;
    }
    // 如果是英文，转换为中文
    const texts = {
      'leader': '组长',
      'project_manager': '项目负责人',
      'tech_lead': '技术负责人',
      'frontend_dev': '前端开发',
      'backend_dev': '后端开发',
      'fullstack_dev': '全栈开发',
      'ui_ux_designer': 'UI/UX设计师',
      'product_manager': '产品经理',
      'test_engineer': '测试工程师',
      'devops_engineer': '运维工程师',
      'data_analyst': '数据分析师',
      'documentation': '文档编写'
    };
    return texts[role] || '项目负责人';
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
          <h3>🏆 贡献排行榜</h3>
          <div className="contribution-leaderboard">
            {members && members.length > 0 ? 
              members
                .map(member => {
                  if (!member || !member.username) return null;
                  const stats = memberStats[member.username] || { score: 0, tasks: 0 };
                  // 使用数据库中的contributionPoint作为贡献点
                  return { 
                    ...member, 
                    stats: {
                      ...stats,
                      score: member.contributionPoint || 0 // 使用数据库中的贡献点
                    }
                  };
                })
                .filter(member => member !== null)
                .sort((a, b) => (b.stats.score || 0) - (a.stats.score || 0))
                .map((member, index) => (
                  <div key={member.username} className={`leaderboard-item rank-${index + 1}`}>
                    <div className="rank-badge">
                      {index + 1}
                    </div>
                    <div className="member-avatar">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <h4>{member.username}</h4>
                      <span className="member-role" style={{ background: getRoleColor(member.role) }}>
                        {getRoleText(member.role)}
                      </span>
                    </div>
                    <div className="contribution-score">
                      <div className="score-number">{member.stats.score || 0}</div>
                      <div className="score-label">贡献点</div>
                    </div>
                    <div className="contribution-details">
                      <div className="detail-item">
                        <span className="detail-label">完成任务</span>
                        <span className="detail-value">{member.stats.tasks || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">平均分</span>
                        <span className="detail-value">{member.stats.score > 0 ? Math.round(member.stats.score / Math.max(member.stats.tasks, 1)) : 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              : <p className="no-data">暂无成员数据</p>
            }
          </div>
        </div>

             {/* 成员列表 */}
       <div className="member-list-section">
         <h3>👤 成员列表</h3>
         <div className="member-list">
           {members && members.length > 0 ? members.map(member => {
             if (!member || !member.username) return null; // 跳过无效的成员
             return (
                               <div key={member.username} className={`member-item ${member.username === user.username ? 'current-user' : ''}`}>
                  <div className="member-info">
                    <div className="member-avatar">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                                                            <div className="member-details">
                      <h4>{member.username}</h4>
                    </div>
                  </div>
                  
                                     <div className="member-actions">
                     {/* 所有成员都显示角色 */}
                     <div className="role-display">
                       <span 
                         className="member-role"
                         style={{ background: getRoleColor(member.role) }}
                       >
                         {getRoleText(member.role)}
                       </span>
                     </div>
                     {/* 只有项目所有者可以移除其他成员，但保持布局一致 */}
                     {isProjectOwner && member.username !== user.username ? (
                       <button
                         className="remove-btn"
                         onClick={() => handleRemoveMember(member.username)}
                       >
                         移除
                       </button>
                     ) : (
                       <div className="remove-btn-placeholder"></div>
                     )}
                   </div>
                </div>
             );
           }) : <p>暂无成员</p>}
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
                  <option value="项目负责人">项目负责人</option>
                  <option value="技术负责人">技术负责人</option>
                  <option value="前端开发">前端开发</option>
                  <option value="后端开发">后端开发</option>
                  <option value="全栈开发">全栈开发</option>
                  <option value="UI/UX设计师">UI/UX设计师</option>
                  <option value="产品经理">产品经理</option>
                  <option value="测试工程师">测试工程师</option>
                  <option value="运维工程师">运维工程师</option>
                  <option value="数据分析师">数据分析师</option>
                  <option value="文档编写">文档编写</option>
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
