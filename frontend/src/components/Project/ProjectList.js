import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Avatar, Tooltip, Input, Select, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  UserOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './ProjectList.css';

const { Search } = Input;
const { Option } = Select;

const ProjectList = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5000/api/projectManager/getProjectList', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setProjects(result.data || []);
      } else {
        message.error('获取项目列表失败：' + result.message);
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = () => {
    navigate('/projects/create');
  };

  const handleEditProject = (projectId) => {
    message.info('编辑功能开发中...');
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5000/api/projectManager/deleteProject/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        message.success('项目删除成功');
        fetchProjects(); // 重新获取项目列表
      } else {
        message.error('删除失败：' + result.message);
      }
    } catch (error) {
      console.error('删除项目失败:', error);
      message.error('删除失败，请重试');
    }
  };

  const getStatusTag = (project) => {
    const now = new Date();
    const startTime = new Date(project.startTime);
    const endTime = new Date(project.endTime);
    
    if (now < startTime) {
      return <Tag color="blue">未开始</Tag>;
    } else if (now > endTime) {
      return <Tag color="red">已结束</Tag>;
    } else {
      return <Tag color="green">进行中</Tag>;
    }
  };

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text, record) => (
        <div className="project-name-cell">
          <div className="project-title">{text}</div>
          <div className="project-description">{record.description}</div>
        </div>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.projectName.toLowerCase().includes(value.toLowerCase()) ||
        record.description.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: '项目负责人',
      dataIndex: 'projectOwner',
      key: 'projectOwner',
      render: (owner) => (
        <div className="owner-cell">
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {owner?.charAt(0)?.toUpperCase()}
          </Avatar>
          <span className="owner-name">{owner}</span>
        </div>
      ),
    },
    {
      title: '区块链类型',
      dataIndex: 'blockchainType',
      key: 'blockchainType',
      render: (type) => (
        <Tag color="purple">{type || 'EVM'}</Tag>
      ),
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => getStatusTag(record),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (time) => (
        <div className="time-cell">
          <CalendarOutlined />
          <span>{new Date(time).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      title: '项目时间',
      key: 'projectTime',
      render: (_, record) => (
        <div className="project-time">
          {record.startTime && (
            <div>开始: {new Date(record.startTime).toLocaleDateString()}</div>
          )}
          {record.endTime && (
            <div>结束: {new Date(record.endTime).toLocaleDateString()}</div>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑项目">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditProject(record.projectId)}
            />
          </Tooltip>
          {record.projectOwner === user?.username && (
            <Tooltip title="删除项目">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteProject(record.projectId)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    
    const now = new Date();
    const startTime = new Date(project.startTime);
    const endTime = new Date(project.endTime);
    
    switch (statusFilter) {
      case 'active':
        return now >= startTime && now <= endTime;
      case 'pending':
        return now < startTime;
      case 'completed':
        return now > endTime;
      default:
        return true;
    }
  });

  return (
    <div className="project-list-container">
      <div className="page-header">
        <div className="header-content">
          <h1>项目管理</h1>
          <p>管理您的区块链协同开发项目</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreateProject}
          size="large"
        >
          创建项目
        </Button>
      </div>

      <Card className="project-list-card">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <Search
              placeholder="搜索项目名称或描述"
              allowClear
              style={{ width: 300 }}
              onSearch={setSearchText}
              onChange={(e) => !e.target.value && setSearchText('')}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120, marginLeft: 16 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">进行中</Option>
              <Option value="pending">未开始</Option>
              <Option value="completed">已结束</Option>
            </Select>
          </div>
          <div className="toolbar-right">
            <Button
              icon={<SearchOutlined />}
              onClick={fetchProjects}
              loading={loading}
            >
              刷新
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={filteredProjects}
          rowKey="projectId"
          loading={loading}
          pagination={{
            total: filteredProjects.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          className="project-table"
        />
      </Card>
    </div>
  );
};

export default ProjectList;