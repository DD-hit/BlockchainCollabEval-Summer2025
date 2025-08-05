import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';
import { accountAPI } from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    // email: '',
    password: '',
    confirmPassword: '',
    // walletAddress: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('密码确认不匹配');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少需要6位');
      setLoading(false);
      return;
    }

    try {
      // 调用真正的注册API
      const response = await accountAPI.register({
        username: formData.username,
        password: formData.password
      });
      
      if (response.data.success) {
        // 注册成功，跳转到登录页面
        navigate('/login');
      } else {
        setError(response.data.message || '注册失败');
      }
    } catch (err) {
      console.error('注册错误:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('注册失败，请检查网络连接');
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
          <h2>加入区块链开发社区</h2>
          <p>创建账户，开始您的去中心化协同开发之旅</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-header">
            <h1>创建账户</h1>
            <p>填写信息完成注册</p>
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
            
            <div className="form-group">
              <label>确认密码</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                placeholder="请再次输入密码"
                required
              />
            </div>
            
            
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </button>
          </form>
          
          <div className="auth-footer">
            <p>已有账户？ <Link to="/login">立即登录</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
  // return (
  //   <div className="auth-container">
  //     <div className="auth-left">
  //       <div className="auth-illustration">
  //         <div className="blockchain-visual">
  //           <div className="block">⛓️</div>
  //           <div className="block">🔗</div>
  //           <div className="block">💎</div>
  //         </div>
  //         <h2>加入区块链开发社区</h2>
  //         <p>创建账户，开始您的去中心化协同开发之旅</p>
  //       </div>
  //     </div>
  //     <div className="auth-right">
  //       <div className="auth-form-container">
  //         <div className="auth-header">
  //           <h1>创建账户</h1>
  //           <p>填写信息完成注册</p>
  //         </div>
          
  //         <form onSubmit={handleSubmit} className="auth-form">
  //           {error && <div className="error-message">{error}</div>}
            
  //           <div className="form-group">
  //             <label>用户名</label>
  //             <input
  //               type="text"
  //               value={formData.username}
  //               onChange={(e) => setFormData({...formData, username: e.target.value})}
  //               placeholder="请输入用户名"
  //               required
  //             />
  //           </div>
            
  //           <div className="form-group">
  //             <label>邮箱</label>
  //             <input
  //               type="email"
  //               value={formData.email}
  //               onChange={(e) => setFormData({...formData, email: e.target.value})}
  //               placeholder="请输入邮箱地址"
  //               required
  //             />
  //           </div>
            
  //           <div className="form-group">
  //             <label>密码</label>
  //             <input
  //               type="password"
  //               value={formData.password}
  //               onChange={(e) => setFormData({...formData, password: e.target.value})}
  //               placeholder="请输入密码"
  //               required
  //             />
  //           </div>
            
  //           <div className="form-group">
  //             <label>确认密码</label>
  //             <input
  //               type="password"
  //               value={formData.confirmPassword}
  //               onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
  //               placeholder="请再次输入密码"
  //               required
  //             />
  //           </div>
            
  //           <div className="form-group">
  //             <label>钱包地址（可选）</label>
  //             <input
  //               type="text"
  //               value={formData.walletAddress}
  //               onChange={(e) => setFormData({...formData, walletAddress: e.target.value})}
  //               placeholder="0x..."
  //             />
  //           </div>
            
  //           <button type="submit" className="auth-btn" disabled={loading}>
  //             {loading ? '注册中...' : '注册'}
  //           </button>
  //         </form>
          
  //         <div className="auth-footer">
  //           <p>已有账户？ <Link to="/login">立即登录</Link></p>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
};

export default Register;
