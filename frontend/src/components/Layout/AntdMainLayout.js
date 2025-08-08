import React, { useState } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, theme } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  ApartmentOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CheckSquareOutlined,
  TeamOutlined,
  FileTextOutlined,
  FolderOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import './AntdMainLayout.css';

const { Header, Sider, Content } = Layout;

const AntdMainLayout = ({ children, user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openKeys, setOpenKeys] = useState(['projects']);
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/profile') return 'profile';
    if (path === '/projects') return 'project-overview';
    if (path === '/projects/create') return 'project-create';
    if (path === '/projects/members') return 'member-management';
    if (path === '/projects/milestones') return 'milestone';
    if (path === '/projects/tasks') return 'sub-tasks';
    if (path === '/team') return 'collaboration';
    if (path === '/docs') return 'documents';
    if (path === '/storage') return 'storage';
    if (path === '/analytics') return 'analysis';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };

  const handleMenuClick = (e) => {
    const keyToPath = {
      'dashboard': '/dashboard',
      'profile': '/profile',
      'project-overview': '/projects',
      'project-create': '/projects/create',
      'member-management': '/projects/members',
      'milestone': '/projects/milestones',
      'sub-tasks': '/projects/tasks',
      'decision': '/decision',
      'basic-management': '/basic',
      'database': '/database',
      'subtask': '/subtask',
      'collaboration': '/team',
      'documents': '/docs',
      'storage': '/storage',
      'analysis': '/analytics',
      'settings': '/settings'
    };
    
    const path = keyToPath[e.key];
    if (path) {
      navigate(path);
    }
  };

  const handleSubMenuOpen = (keys) => {
    setOpenKeys(keys);
  };

  const handleUserMenuClick = (e) => {
    if (e.key === 'profile') {
      navigate('/profile');
    } else if (e.key === 'settings') {
      navigate('/settings');
    } else if (e.key === 'logout') {
      onLogout();
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '账户设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={(value) => setCollapsed(value)}
        theme="light"
        width={250}
        collapsedWidth={80}
      >
        <div className="logo">
          <h3>{collapsed ? 'BCS' : '区块链协同系统'}</h3>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          openKeys={openKeys}
          onOpenChange={handleSubMenuOpen}
          onClick={handleMenuClick}
        >
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            仪表盘
          </Menu.Item>
          
          <Menu.SubMenu key="projects" icon={<ProjectOutlined />} title="项目管理">
            <Menu.Item key="project-overview">项目总览</Menu.Item>
            <Menu.Item key="project-create">创建项目</Menu.Item>
            <Menu.Item key="member-management">成员管理</Menu.Item>
            <Menu.Item key="milestone">里程碑</Menu.Item>
            <Menu.Item key="sub-tasks">子任务</Menu.Item>
          </Menu.SubMenu>
          
          <Menu.Item key="collaboration" icon={<TeamOutlined />}>
            团队协作
          </Menu.Item>
          <Menu.Item key="documents" icon={<FileTextOutlined />}>
            文档中心
          </Menu.Item>
          <Menu.Item key="storage" icon={<FolderOutlined />}>
            数据存储
          </Menu.Item>
          <Menu.Item key="settings" icon={<SettingOutlined />}>
            系统设置
          </Menu.Item>
        </Menu>
      </Sider>
      
      <Layout>
        <Header className="header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <h1>区块链协同开发系统</h1>
          </div>
          
          <div className="header-right">
            <Dropdown
              menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
              placement="bottomRight"
              arrow
            >
              <div className="user-info">
                <Avatar style={{ backgroundColor: '#1890ff' }}>
                  {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <span className="username">{user?.username || '用户'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        
        <Content className="content">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AntdMainLayout;







