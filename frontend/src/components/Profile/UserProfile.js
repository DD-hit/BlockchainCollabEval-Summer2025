import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Modal, Input, message, Spin, Alert } from 'antd';
import { UserOutlined, EyeOutlined, EyeInvisibleOutlined, CopyOutlined } from '@ant-design/icons';
import './UserProfile.css';

const UserProfile = ({ user }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKeyVisible, setPrivateKeyVisible] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/accounts/getBalance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setUserInfo(result.data);
      } else {
        message.error('获取用户信息失败：' + result.message);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleShowPrivateKey = () => {
    Modal.confirm({
      title: '显示私钥',
      content: (
        <div>
          <Alert
            message="安全警告"
            description="私钥是您账户的最高权限凭证，请妥善保管，不要泄露给任何人！"
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <p>确定要显示私钥吗？</p>
        </div>
      ),
      okText: '确定显示',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        setShowPrivateKey(true);
      }
    });
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success(`${label}已复制到剪贴板`);
    }).catch(() => {
      message.error('复制失败');
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
        <p>加载用户信息...</p>
      </div>
    );
  }

  if (!userInfo) {
    return (
      <div className="profile-error">
        <Alert
          message="无法获取用户信息"
          description="请刷新页面重试"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="profile-header">
        <h1>个人信息</h1>
        <p>管理您的账户信息和区块链钱包</p>
      </div>

      <Card className="profile-card" title="基本信息" extra={<UserOutlined />}>
        <Descriptions column={1} bordered>
          <Descriptions.Item label="用户名">
            {userInfo.username}
          </Descriptions.Item>
          <Descriptions.Item label="以太坊地址">
            <div className="address-item">
              <Input.TextArea
                value={userInfo.address}
                readOnly
                autoSize={{ minRows: 1, maxRows: 2 }}
                className="address-input"
              />
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(userInfo.address, '地址')}
                className="copy-button"
              />
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="账户余额">
            {userInfo.balance} ETH
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(userInfo.createdAt).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="profile-card" title="安全信息">
        <div className="security-section">
          <div className="private-key-section">
            <h4>私钥管理</h4>
            <p className="security-warning">
              ⚠️ 私钥是您账户的最高权限凭证，请务必妥善保管！
            </p>
            
            {!showPrivateKey ? (
              <Button
                type="primary"
                danger
                icon={<EyeOutlined />}
                onClick={handleShowPrivateKey}
              >
                显示私钥
              </Button>
            ) : (
              <div className="private-key-display">
                <div className="private-key-input">
                  <Input.TextArea
                    value={privateKeyVisible ? userInfo.privateKey : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                    readOnly
                    autoSize={{ minRows: 2, maxRows: 3 }}
                    className="private-key-textarea"
                  />
                  <div className="private-key-actions">
                    <Button
                      type="text"
                      icon={privateKeyVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                      onClick={() => setPrivateKeyVisible(!privateKeyVisible)}
                    >
                      {privateKeyVisible ? '隐藏' : '显示'}
                    </Button>
                    {privateKeyVisible && (
                      <Button
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={() => copyToClipboard(userInfo.privateKey, '私钥')}
                      >
                        复制
                      </Button>
                    )}
                  </div>
                </div>
                <Alert
                  message="请将私钥保存在安全的地方"
                  description="建议将私钥写在纸上或保存在离线设备中，不要截图或保存在联网设备上。"
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserProfile;