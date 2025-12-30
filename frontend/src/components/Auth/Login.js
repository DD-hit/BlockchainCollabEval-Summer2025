import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';
import { accountAPI } from '../../utils/api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
  
      
      const response = await accountAPI.login({
        username: formData.username,
        password: formData.password
      });

      if (response.data.success) {
        const { token, username, address, githubAuthUrl } = response.data.data;
        
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('username', username);
        if (address) sessionStorage.setItem('address', address);
        
        // 处理GitHub认证
        if (githubAuthUrl) {
          // 询问用户是否要连接GitHub
          const shouldConnectGitHub = window.confirm('登录成功！是否要连接GitHub账户？');
          if (shouldConnectGitHub) {
            // 跳转到GitHub授权页面
            window.location.href = githubAuthUrl;
            return; // 不调用onLogin，因为页面会跳转
          }
        }
        
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
            {error && <div className="error-message">{error}</div>}
            
            <div className="form-group">
              <label>用户名</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="请输入用户名"
                required
              />
            </div>
            
            <div className="form-group">
              <label>密码</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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