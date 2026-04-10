import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Button, Drawer, Spin } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  ShopOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  SettingOutlined,
  BarChartOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useStore';
import '../styles/AdminLayout.css';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);

  // Check auth on mount and when token/user changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      navigate('/');
      setLoading(false);
      return;
    }
    
    // Check user role from auth store
    if (!user || user.role !== 'admin') {
      // If user not loaded yet, don't redirect immediately
      // Let it load from auth store in App.jsx
      if (user === null) {
        // User data is still loading
        return;
      }
      // User is loaded but not admin
      navigate('/');
      setLoading(false);
    } else {
      // User is loaded and is admin
      setLoading(false);
    }
  }, [token, user, navigate]);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/admin/dashboard'),
    },
    {
      key: '/admin/statistics',
      icon: <BarChartOutlined />,
      label: 'Thống Kê',
      onClick: () => navigate('/admin/statistics'),
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Quản Lý Users',
      onClick: () => navigate('/admin/users'),
    },
    {
      key: '/admin/foods',
      icon: <ShoppingOutlined />,
      label: 'Quản Lý Foods',
      onClick: () => navigate('/admin/foods'),
    },
    {
      key: '/admin/orders',
      icon: <ShopOutlined />,
      label: 'Quản Lý Orders',
      onClick: () => navigate('/admin/orders'),
    },
    {
      key: '/admin/stores',
      icon: <HomeOutlined />,
      label: 'Quản Lý Stores',
      onClick: () => navigate('/admin/stores'),
    },
    {
      key: '/admin/categories',
      icon: <ShoppingOutlined />,
      label: 'Quản Lý Categories',
      onClick: () => navigate('/admin/categories'),
    },
    {
      key: '/admin/settings',
      icon: <SettingOutlined />,
      label: 'Cài Đặt',
      onClick: () => navigate('/admin/settings'),
    },
  ];

  const handleMenuClick = (e) => {
    setMobileMenuOpen(false);
  };

  const getSelectedKey = () => {
    const key = menuItems.find(item => item.key === location.pathname);
    return key ? [key.key] : [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          theme="dark"
          className="admin-sidebar"
        >
          <div className="admin-logo">
            <span className={collapsed ? '' : 'logo-text'}>
              {collapsed ? '📊' : '📊 SmartFood Admin'}
            </span>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={getSelectedKey()}
            items={menuItems}
            className="admin-menu"
          />
          <div className="sidebar-footer">
            <Button
              type="primary"
              block
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {collapsed ? '' : 'Về Trang Chủ'}
            </Button>
          </div>
        </Sider>
      )}

        {/* Mobile Drawer Menu */}
        {isMobile && (
          <Drawer
            title="Menu"
            placement="left"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            bodyStyle={{ padding: 0 }}
          >
            <Menu
              theme="light"
              mode="vertical"
              selectedKeys={getSelectedKey()}
              items={menuItems}
              onClick={handleMenuClick}
              style={{ border: 'none' }}
            />
          </Drawer>
        )}

        <Layout>
          {/* Header */}
        <Header className="admin-header">
          <div className="admin-header-left">
            {isMobile ? (
              <Button
                type="text"
                icon={mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ fontSize: '18px', color: '#fff' }}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? '→' : '←'}
                onClick={() => setCollapsed(!collapsed)}
                style={{ fontSize: '16px', color: '#fff' }}
              />
            )}
            <h2 style={{ margin: '0 0 0 20px', color: '#fff' }}>
              {location.pathname.split('/').pop() === 'dashboard'
                ? 'Dashboard'
                : location.pathname.split('/').pop() === 'users'
                ? 'Quản Lý Users'
                : location.pathname.split('/').pop() === 'foods'
                ? 'Quản Lý Foods'
                : location.pathname.split('/').pop() === 'orders'
                ? 'Quản Lý Orders'
                : location.pathname.split('/').pop() === 'stores'
                ? 'Quản Lý Stores'
                : location.pathname.split('/').pop() === 'categories'
                ? 'Quản Lý Categories'
                : location.pathname.split('/').pop() === 'statistics'
                ? 'Thống Kê'
                : 'Cài Đặt'}
            </h2>
          </div>
          <div className="admin-header-right">
            <Avatar
              size={40}
              icon={<UserOutlined />}
              style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
            />
          </div>
        </Header>

        {/* Main Content */}
        <Content className="admin-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
