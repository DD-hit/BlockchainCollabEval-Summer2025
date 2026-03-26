import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import { accountAPI } from '../../utils/api';

const AUTH_NOTICE_KEY = 'auth_notice';

const REASON_MESSAGES = {
  kicked:
    '您的账号已在其他设备（或浏览器）登录，本会话已失效。仍可在此重新登录；重新登录后其他设备上的会话将失效。',
  token: '登录已过期或验证失败，请重新登录。',
  auth: '请先登录后再访问该页面。',
};

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 用 sessionStorage 携带提示，避免 React StrictMode 双次挂载 + 立刻清 URL 导致消息丢失
  useEffect(() => {
    const fromStore = sessionStorage.getItem(AUTH_NOTICE_KEY);
    const fromUrl = new URLSearchParams(window.location.search).get('reason');
    const key =
      fromStore && REASON_MESSAGES[fromStore]
        ? fromStore
        : fromUrl && REASON_MESSAGES[fromUrl]
          ? fromUrl
          : null;
    if (!key) return;
    if (!fromStore) sessionStorage.setItem(AUTH_NOTICE_KEY, key);
    setError(REASON_MESSAGES[key]);
    if (fromUrl) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const clearAuthNotice = () => sessionStorage.removeItem(AUTH_NOTICE_KEY);

  const handleFieldChange = (field) => (e) => {
    clearAuthNotice();
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    clearAuthNotice();

    try {
  
      
      const response = await accountAPI.login({
        username: formData.username,
        password: formData.password
      });

      if (response.data.success) {
        const { token, username, address } = response.data.data;
        
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('username', username);
        if (address) sessionStorage.setItem('address', address);
        
        onLogin({ username, address, token });
      } else {
        setError(response.data.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      
      // 更详细的错误信息
      if (error.code === 'ERR_NETWORK' || error.message.includes('ERR_CONNECTION_REFUSED')) {
        setError('无法连接到服务器，请检查：\n1. 后端服务器是否正在运行\n2. 服务器地址是否正确\n3. 网络连接是否正常');
      } else {
        setError(error.response?.data?.message || '登录失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* 添加粒子效果 */}
      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      <div className="particle particle-4"></div>
      <div className="particle particle-5"></div>
      
      {/* 添加围绕屏幕的矩形发光边框 */}
      <div className="border-glow">
        <div className="glow-point glow-point-1"></div>
        <div className="glow-point glow-point-2"></div>
        <div className="glow-point glow-point-3"></div>
        <div className="glow-point glow-point-4"></div>
      </div>
      
      <div className="auth-left">
        <div className="auth-illustration">
          <div className="blockchain-visual">
            <div className="block">⛓️</div>
            <div className="block">🔗</div>
            <div className="block">💎</div>
          </div>
          <h2>去中心化协同开发</h2>
          <p>基于区块链技术的项目管理平台，让团队协作更加透明和高效</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-header">
            <h1>欢迎回来</h1>
            <p>登录您的账户继续使用</p>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div
                className={
                  error.includes('其他设备') || error.includes('本会话已失效')
                    ? 'auth-notice-banner'
                    : 'error-message'
                }
                role="alert"
              >
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={handleFieldChange('username')}
                placeholder="请输入用户名"
                required
              />
            </div>
            
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={handleFieldChange('password')}
                placeholder="请输入密码"
                required
              />
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>还没有账户？ <Link to="/register">立即注册</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;