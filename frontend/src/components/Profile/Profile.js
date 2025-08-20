import React, { useState, useEffect } from 'react';
import api, { projectAPI, subtaskAPI } from '../../utils/api';
import { accountAPI } from '../../utils/api';
import './Profile.css';

// 密码强度验证函数
const validatePasswordStrength = (password) => {
  const feedback = [];
  let score = 0;

  // 长度检查
  if (password.length < 8) {
    feedback.push('密码长度至少需要8位');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码需要包含数字');
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码需要包含小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码需要包含大写字母');
  }

  // 包含特殊字符
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码需要包含特殊字符');
  }

  // 不能包含常见弱密码
  const weakPasswords = ['123456', 'password', 'qwerty', 'admin', '123456789'];
  if (weakPasswords.includes(password.toLowerCase())) {
    feedback.push('不能使用常见弱密码');
    score = 0;
  }

  return { score, feedback };
};

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

    if (editForm.newPassword && editForm.newPassword.length < 8) {
      alert('密码长度至少需要8位');
      return;
    }

    // 增强的密码强度验证
    if (editForm.newPassword) {
      const passwordValidation = validatePasswordStrength(editForm.newPassword);
      if (passwordValidation.score < 3) {
        alert(`密码强度不够: ${passwordValidation.feedback.join(', ')}`);
        return;
      }
    }

    try {
      const updateData = {
        username: editForm.username
      };
      
      if (editForm.newPassword) {
        updateData.password = editForm.newPassword;
      }

      const response = await accountAPI.updateProfile(updateData);
      if (response.ok) {
        setUserInfo({ ...userInfo, username: editForm.username });
        setEditing(false);
        setEditForm({ ...editForm, newPassword: '', confirmPassword: '' });
        alert('个人信息更新成功');
      } else {
        alert(response.error?.message || '更新失败');
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
        <h1>👤 个人中心</h1>
        <p>管理您的个人信息和账户安全</p>
      </div>

      <div className="profile-content">
        {/* 基本信息卡片 */}
        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="user-avatar-large">
              {userInfo.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <h2>{userInfo.username}</h2>
              <div className="user-address-container">
                <span className="address-label">区块链地址:</span>
                <span className="user-address">{userInfo.address}</span>
              </div>
            </div>
          </div>
          
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



        {/* 私钥管理 */}
        <div className="private-key-section">
          <div className="section-header">
            <h3>🔐 私钥管理</h3>
            <p>安全地查看和管理您的区块链私钥</p>
          </div>
          <div className="warning-box">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>安全提醒</h4>
              <p>私钥是您区块链账户的重要凭证，请妥善保管，不要泄露给他人！</p>
            </div>
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

