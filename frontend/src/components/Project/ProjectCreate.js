import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectAPI } from '../../utils/api';
import './Project.css';

const ProjectCreate = ({ user }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    blockchainType: 'EVM',
    startTime: '',
    endTime: '',
    enableDAO: false,
    templateType: 'solidity',
    isPublic: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const blockchainTypes = [
    { value: 'EVM', label: 'EVM (以太坊虚拟机)', description: '支持以太坊、BSC、Polygon等' },
    { value: 'Cosmos', label: 'Cosmos SDK', description: '支持Cosmos生态链' },
    { value: 'Solana', label: 'Solana', description: '高性能区块链' },
    { value: 'Polkadot', label: 'Polkadot', description: '跨链互操作性' }
  ];

  const templateTypes = [
    { value: 'solidity', label: 'Solidity 智能合约', description: '以太坊标准合约模板' },
    { value: 'rust', label: 'Rust 合约', description: 'Solana/Near 合约模板' },
    { value: 'cosmwasm', label: 'CosmWasm', description: 'Cosmos 生态合约模板' },
    { value: 'substrate', label: 'Substrate', description: 'Polkadot 平行链模板' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const projectData = {
        projectName: formData.projectName,
        description: formData.description,
        projectOwner: user.username,
        startTime: formData.startTime,
        endTime: formData.endTime,
        blockchainType: formData.blockchainType,
        enableDAO: formData.enableDAO,
        templateType: formData.templateType,
        isPublic: formData.isPublic
      };

      const response = await projectAPI.createProject(projectData);
      
      if (response.data.success) {
        navigate('/dashboard');
      } else {
        setError(response.data.message || '创建项目失败');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      setError(error.response?.data?.message || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="project-create">
      <div className="page-header">
        <h1>创建区块链项目</h1>
        <p>设置您的区块链开发项目，选择合适的技术栈</p>
      </div>
      
      {error && (
        <div className="error-message">
          <span>❌</span>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="project-form">
        {/* 基本信息 */}
        <div className="form-section">
          <h3>📋 基本信息</h3>
          <div className="form-group">
            <label>项目名称 *</label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              placeholder="输入项目名称"
              required
            />
          </div>
          
          <div className="form-group">
            <label>项目描述 *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="描述项目目标和功能"
              rows={4}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>开始时间</label>
              <input
                type="date"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>结束时间</label>
              <input
                type="date"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 区块链配置 */}
        <div className="form-section">
          <h3>⛓️ 区块链配置</h3>
          <div className="form-group">
            <label>区块链类型 *</label>
            <div className="blockchain-options">
              {blockchainTypes.map(type => (
                <div 
                  key={type.value}
                  className={`blockchain-option ${formData.blockchainType === type.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('blockchainType', type.value)}
                >
                  <div className="option-header">
                    <span className="option-title">{type.label}</span>
                    <span className="option-radio">
                      {formData.blockchainType === type.value ? '🔘' : '⚪'}
                    </span>
                  </div>
                  <p className="option-description">{type.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>代码模板</label>
            <select
              value={formData.templateType}
              onChange={(e) => handleInputChange('templateType', e.target.value)}
            >
              {templateTypes.map(template => (
                <option key={template.value} value={template.value}>
                  {template.label} - {template.description}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 高级选项 */}
        <div className="form-section">
          <h3>⚙️ 高级选项</h3>
          <div className="checkbox-group">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.enableDAO}
                onChange={(e) => handleInputChange('enableDAO', e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="checkbox-content">
                <span className="checkbox-title">启用 DAO 治理</span>
                <p className="checkbox-description">自动生成去中心化治理合约模板</p>
              </div>
            </label>

            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
              />
              <span className="checkmark"></span>
              <div className="checkbox-content">
                <span className="checkbox-title">公开项目</span>
                <p className="checkbox-description">允许其他开发者查看和贡献</p>
              </div>
            </label>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            取消
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '创建中...' : '🚀 创建项目'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreate;
