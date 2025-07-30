import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { accountAPI } from '../../utils/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不匹配');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('发送注册请求:', { username: formData.username });
      const data = await accountAPI.register(formData.username, formData.password);
      
      console.log('注册响应:', data);

      if (data.success) {
        setSuccess('注册成功！正在跳转到登录页面...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || '注册失败');
      }
    } catch (err) {
      console.error('注册错误:', err);
      setError(`连接失败: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>🚀 注册账户</h2>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-control"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="form-control"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="请再次输入密码"
              required
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? '注册中...' : '📝 注册'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>已有账户？ <Link to="/login">立即登录</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;



