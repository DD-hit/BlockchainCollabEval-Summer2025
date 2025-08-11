import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { accountAPI } from '../../utils/api';
import './Profile.css';

const Profile = ({ user }) => {
  const [userInfo, setUserInfo] = useState(user);
  const [editing, setEditing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyData, setPrivateKeyData] = useState(null);
  const [passwordForKey, setPasswordForKey] = useState('');
  const [loadingPrivateKey, setLoadingPrivateKey] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalScore: 0
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        api.get('/api/projectMembers/my-projects'),
        api.get('/api/subtasks/my-tasks')
      ]);

      if (projectsRes.data.success) {
        setStats(prev => ({ ...prev, totalProjects: projectsRes.data.data.length }));
      }

      if (tasksRes.data.success) {
        const tasks = tasksRes.data.data;
        setStats(prev => ({
          ...prev,
          totalTasks: tasks.length,
          completedTasks: tasks.filter(t => t.status === 'completed').length
        }));
      }
    } catch (error) {
      console.error('加载用户统计失败:', error);
    }
  };

  const handleGetPrivateKey = async () => {
    if (!passwordForKey.trim()) {
      alert('请输入密码');
      return;
    }

    setLoadingPrivateKey(true);
    try {
      const response = await api.post('/api/accounts/getPrivateKey', {
        username: user.username,
        password: passwordForKey
      });

      if (response.data.success) {
        setPrivateKeyData(response.data.data);
        setShowPrivateKey(true);
        setPasswordForKey('');
      } else {
        alert(response.data.message || '获取私钥失败');
      }
    } catch (error) {
      console.error('获取私钥失败:', error);
      alert(error.response?.data?.message || '获取私钥失败，请检查密码');
    } finally {
      setLoadingPrivateKey(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      alert('新密码确认不匹配');
      return;
    }

    if (editForm.newPassword && editForm.newPassword.length < 6) {
      alert('密码长度至少需要6位');
      return;
    }

    try {
      const updateData = {
        username: editForm.username
      };
      
      if (editForm.newPassword) {
        updateData.password = editForm.newPassword;
      }

      const response = await accountAPI.updateProfile(updateData);
      if (response.data.success) {
        setUserInfo({ ...userInfo, username: editForm.username });
        setEditing(false);
        setEditForm({ ...editForm, newPassword: '', confirmPassword: '' });
        alert('个人信息更新成功');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      alert(error.response?.data?.message || '更新失败');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('已复制到剪贴板');
    });
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <h1>个人中心</h1>
      </div>

      <div className="profile-content">
        {/* 基本信息卡片 */}
        <div className="profile-card">
          <div className="user-avatar-large">
            {userInfo.username.charAt(0).toUpperCase()}
          </div>
          <h2>{userInfo.username}</h2>
          <p className="user-address">{userInfo.address}</p>
          
          {!editing ? (
            <button className="edit-btn" onClick={() => setEditing(true)}>
              编辑资料
            </button>
          ) : (
            <form onSubmit={handleUpdateProfile} className="edit-form">
              <div className="form-group">
                <label>用户名</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>新密码（可选）</label>
                <input
                  type="password"
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({...editForm, newPassword: e.target.value})}
                  placeholder="留空则不修改密码"
                />
              </div>
              
              <div className="form-group">
                <label>确认新密码</label>
                <input
                  type="password"
                  value={editForm.confirmPassword}
                  onChange={(e) => setEditForm({...editForm, confirmPassword: e.target.value})}
                  placeholder="确认新密码"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-btn">保存</button>
                <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
                  取消
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 统计信息 */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>参与项目</h3>
            <div className="stat-number">{stats.totalProjects}</div>
          </div>
          <div className="stat-card">
            <h3>总任务数</h3>
            <div className="stat-number">{stats.totalTasks}</div>
          </div>
          <div className="stat-card">
            <h3>已完成</h3>
            <div className="stat-number">{stats.completedTasks}</div>
          </div>
          <div className="stat-card">
            <h3>贡献分</h3>
            <div className="stat-number">{stats.totalScore}</div>
          </div>
        </div>

        {/* 私钥管理 */}
        <div className="private-key-section">
          <h3>🔐 私钥管理</h3>
          <div className="warning-box">
            <p>⚠️ 私钥是您区块链账户的重要凭证，请妥善保管，不要泄露给他人！</p>
          </div>
          
          {!showPrivateKey ? (
            <div className="private-key-form">
              <div className="form-group">
                <label>请输入密码以查看私钥</label>
                <input
                  type="password"
                  value={passwordForKey}
                  onChange={(e) => setPasswordForKey(e.target.value)}
                  placeholder="请输入您的登录密码"
                  onKeyPress={(e) => e.key === 'Enter' && handleGetPrivateKey()}
                />
              </div>
              <button 
                className="show-key-btn" 
                onClick={handleGetPrivateKey}
                disabled={loadingPrivateKey}
              >
                {loadingPrivateKey ? '验证中...' : '显示私钥'}
              </button>
            </div>
          ) : (
            <div className="private-key-display">
              <div className="key-info">
                <div className="key-item">
                  <label>以太坊地址</label>
                  <div className="key-value">
                    <span>{privateKeyData?.address}</span>
                    <button onClick={() => copyToClipboard(privateKeyData?.address)}>
                      📋 复制
                    </button>
                  </div>
                </div>
                
                <div className="key-item">
                  <label>私钥</label>
                  <div className="key-value private-key">
                    <span>{privateKeyData?.privateKey}</span>
                    <button onClick={() => copyToClipboard(privateKeyData?.privateKey)}>
                      📋 复制
                    </button>
                  </div>
                </div>
              </div>
              
              <button 
                className="hide-key-btn" 
                onClick={() => {
                  setShowPrivateKey(false);
                  setPrivateKeyData(null);
                }}
              >
                隐藏私钥
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

