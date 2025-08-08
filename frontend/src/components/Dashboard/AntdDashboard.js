import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Timeline, 
  Tag, 
  Space, 
  Progress, 
  Spin, 
  Alert, 
  Empty,
  Button  // 添加 Button 导入
} from 'antd';
import {
  ProjectOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './AntdDashboard.css'; // 引入已有的样式文件

const DashboardContent = ({ user }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedMilestones: 0,
    teamMembers: 0,
    pendingTasks: 0
  });
  // 添加 projects 状态变量
  const [projects, setProjects] = useState(null);  // 新增状态变量
  
  // 统一数据获取方法
  // 新增的统一请求方法
  const fetchData = async (url, errorMsg) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`${errorMsg}: ${res.status}`);
      return await res.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        
        // 并行获取核心数据
        const [projectsData, milestones, members] = await Promise.all([  // 重命名为 projectsData
          fetchData(
            `http://localhost:5000/api/projectManager/getProjectList?username=${user.username}`,
            '项目列表获取失败'
          ),
          fetchData(
            `http://localhost:5000/api/milestones/getMilestoneList/${user.currentProjectId}`,
            '里程碑获取失败'
          ),
          fetchData(
            `http://localhost:5000/api/projectMembers/getProjectMemberList/${user.currentProjectId}`,
            '成员列表获取失败'
          )
        ]);

        // 保存项目数据到状态
        setProjects(projectsData);  // 保存到状态变量
        
        // 处理统计指标
        if (projectsData?.data) {  // 使用 projectsData 变量
          setStats(prev => ({
            ...prev,
            activeProjects: projectsData.data.filter(p => p.status === 'active').length,
            completedMilestones: milestones?.data?.filter(m => m.status === 'completed').length || 0,
            teamMembers: members?.data?.length || 0
          }));
        }

        if (milestones?.data) {
          setStats(prev => ({
            ...prev,
            completedMilestones: milestones.data.filter(m => m.status === 'completed').length,
            pendingTasks: milestones.data.reduce((acc, m) => acc + (m.subtasks || []).length, 0)
          }));
        }

      } catch (err) {
        setError(`数据加载失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      loadDashboardData();
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  // 项目表格配置
  const projectColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      render: (text, record) => (
        <a onClick={() => navigate(`/projects/${record.projectId}`)}>
          {text}
        </a>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      // 保留一个 render 函数（删除重复的日期格式化 render）
      render: progress => (
        <Progress percent={progress} status={progress >= 100 ? 'success' : 'active'} />
      )
    },  
      // 如需显示日期，添加新列
      {
        title: '开始时间',
        dataIndex: 'startTime',
        render: date => new Date(date).toLocaleDateString()
      }
  ];

  // 加载状态处理
  if (loading) return <Spin tip="数据加载中..." size="large" />;

  // 错误状态处理
  if (error) return (
    <Alert
      type="error"
      message="数据加载失败"
      description={error}
      showIcon
      action={
        <Button type="primary" onClick={() => window.location.reload()}>
          重新加载
        </Button>
      }
    />
  );

  return (
    <div className="dashboard-container">
      <Row gutter={[16, 16]} className="stats-row">
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={stats.activeProjects}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        {/* 其他统计卡片... */}
      </Row>
      
      <Card title="我的项目" style={{ marginTop: 16 }}>
        <Table
          columns={projectColumns}
          dataSource={projects?.data || []}
          rowKey="projectId"  // 添加逗号
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DashboardContent;