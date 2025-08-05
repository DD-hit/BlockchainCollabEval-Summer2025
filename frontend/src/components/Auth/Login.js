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
      const response = await accountAPI.login(formData);
      
      if (response.data.success) {
        const userData = response.data.data;
        
        sessionStorage.setItem('token', userData.token);
        sessionStorage.setItem('username', userData.username);
        sessionStorage.setItem('address', userData.address);
        
        onLogin(userData);
      } else {
        setError(response.data.message || '登录失败');
      }
    } catch (err) {
      console.error('登录错误:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('登录失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
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
