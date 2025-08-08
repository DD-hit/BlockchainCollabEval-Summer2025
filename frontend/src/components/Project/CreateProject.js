import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Select, 
  DatePicker, 
  Switch, 
  Row, 
  Col, 
  message,
  Divider
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './CreateProject.css';

const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CreateProject = ({ user }) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // 处理日期格式
      const formData = {
        ...values,
        projectOwner: user?.username,
        startTime: values.projectTime ? values.projectTime[0].format('YYYY-MM-DD') : null,
        endTime: values.projectTime ? values.projectTime[1].format('YYYY-MM-DD') : null,
      };
      
      // 移除projectTime字段，因为后端不需要
      delete formData.projectTime;

      const response = await fetch('http://localhost:5000/api/projectManager/createProject', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (result.success) {
        message.success('项目创建成功！');
        navigate('/projects');
      } else {
        message.error('创建失败：' + result.message);
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      message.error('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  return (
    <div className="create-project-container">
      <div className="page-header">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleCancel}
          className="back-button"
        >
          返回项目列表
        </Button>
        <div className="header-content">
          <h1>创建新项目</h1>
          <p>设置您的区块链协同开发项目</p>
        </div>
      </div>

      <Card className="create-form-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            blockchainType: 'EVM',
            templateType: 'solidity',
            enableDAO: false,
            isPublic: true
          }}
        >
          <div className="form-section">
            <h3>基本信息</h3>
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="项目名称"
                  name="projectName"
                  rules={[
                    { required: true, message: '请输入项目名称' },
                    { min: 2, message: '项目名称至少2个字符' },
                    { max: 50, message: '项目名称不能超过50个字符' }
                  ]}
                >
                  <Input placeholder="输入项目名称" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="项目时间"
                  name="projectTime"
                >
                  <RangePicker 
                    style={{ width: '100%' }} 
                    size="large"
                    placeholder={['开始时间', '结束时间']}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="项目描述"
              name="description"
              rules={[
                { required: true, message: '请输入项目描述' },
                { min: 10, message: '项目描述至少10个字符' },
                { max: 500, message: '项目描述不能超过500个字符' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="详细描述您的项目..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </div>

          <Divider />

          <div className="form-section">
            <h3>技术配置</h3>
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="区块链类型"
                  name="blockchainType"
                  rules={[{ required: true, message: '请选择区块链类型' }]}
                >
                  <Select size="large" placeholder="选择区块链类型">
                    <Option value="EVM">EVM (以太坊虚拟机)</Option>
                    <Option value="Solana">Solana</Option>
                    <Option value="Polkadot">Polkadot</Option>
                    <Option value="BSC">BSC (币安智能链)</Option>
                    <Option value="Polygon">Polygon</Option>
                    <Option value="Avalanche">Avalanche</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="模板类型"
                  name="templateType"
                  rules={[{ required: true, message: '请选择模板类型' }]}
                >
                  <Select size="large" placeholder="选择模板类型">
                    <Option value="solidity">Solidity 智能合约</Option>
                    <Option value="defi">DeFi 应用</Option>
                    <Option value="nft">NFT 项目</Option>
                    <Option value="dao">DAO 治理</Option>
                    <Option value="gamefi">GameFi 游戏</Option>
                    <Option value="custom">自定义</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          <div className="form-section">
            <h3>项目设置</h3>
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="启用 DAO 治理"
                  name="enableDAO"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="开启" 
                    unCheckedChildren="关闭"
                  />
                  <div className="form-help">
                    允许社区参与项目决策和治理
                  </div>
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="公开项目"
                  name="isPublic"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="公开" 
                    unCheckedChildren="私有"
                  />
                  <div className="form-help">
                    其他用户可以查看和参与项目
                  </div>
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="form-actions">
            <Button 
              size="large"
              onClick={handleCancel}
              style={{ marginRight: 16 }}
            >
              取消
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              size="large"
              loading={loading}
              icon={<SaveOutlined />}
            >
              {loading ? '创建中...' : '创建项目'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateProject;