import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Layout, Nav, Button, Typography, Card, Space, Row, Col } from '@douyinfe/semi-ui';
import { IconApps, IconCalendar } from '@douyinfe/semi-icons';
import RecognitionPage from './pages/RecognitionPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import GroupPage from './pages/GroupPage.jsx';
import './App.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

// 主应用组件
const AppContent = () => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(() => {
    const path = location.pathname;
    if (path === '/calendar') return 'calendar';
    if (path === '/recognition') return 'recognition';
    if (path.startsWith('/group/')) return 'group';
    return 'home';
  });

  // 页面加载时从 URL 恢复状态
  useEffect(() => {
    const path = location.pathname;
    if (path === '/calendar') setCurrentPage('calendar');
    else if (path === '/recognition') setCurrentPage('recognition');
    else if (path.startsWith('/group/')) setCurrentPage('group');
    else setCurrentPage('home');
  }, [location.pathname]);

  // 保存当前页面到 sessionStorage
  const handlePageChange = (page) => {
    setCurrentPage(page);
    sessionStorage.setItem('currentPage', page);
  };

  const topNavItems = [
    { itemKey: 'calendar', text: '演出日历', icon: <IconCalendar /> },
    { itemKey: 'recognition', text: '演出表识别', icon: <IconApps /> },
  ];

  const handleNavClick = (data) => {
    console.log('导航点击事件:', data);
    if (data.itemKey === 'calendar') {
      window.location.href = '/calendar';
    } else if (data.itemKey === 'recognition') {
      window.location.href = '/recognition';
    }
  };

  const renderContent = () => (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="欢迎使用地下偶像相关便利站" style={{ marginBottom: '24px' }}>
            <Text>专为地下偶像粉丝打造的一站式服务平台，提供演出日历管理和演出表智能识别功能，让您不错过任何精彩演出！</Text>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            title="演出日历" 
            style={{ height: '300px', cursor: 'pointer' }}
            shadows="hover"
            onClick={() => window.location.href = '/calendar'}
          >
            <Space vertical style={{ width: '100%', height: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <IconCalendar size="extra-large" style={{ color: 'var(--semi-color-primary)' }} />
              </div>
              <Text strong style={{ fontSize: '16px', marginBottom: '12px' }}>演出日程管理</Text>
              <Text type="tertiary" style={{ marginBottom: '20px' }}>
                查看和管理地下偶像的演出日程，支持按时间、地点、团体筛选
              </Text>
              <Button 
                theme="solid" 
                type="primary" 
                block 
                style={{ marginTop: 'auto' }}
                onClick={() => window.location.href = '/calendar'}
              >
                进入演出日历
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={12}>
          <Card 
            title="演出表识别" 
            style={{ height: '300px', cursor: 'pointer' }}
            shadows="hover"
            onClick={() => window.location.href = '/recognition'}
          >
            <Space vertical style={{ width: '100%', height: '100%' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <IconApps size="extra-large" style={{ color: 'var(--semi-color-primary)' }} />
              </div>
              <Text strong style={{ fontSize: '16px', marginBottom: '12px' }}>智能识别演出表</Text>
              <Text type="tertiary" style={{ marginBottom: '20px' }}>
                上传演出表图片，AI智能识别演出信息，自动添加到日历中
              </Text>
              <Button 
                theme="solid" 
                type="primary" 
                block 
                style={{ marginTop: 'auto' }}
                onClick={() => window.location.href = '/recognition'}
              >
                开始识别演出表
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card title="最近更新" style={{ marginTop: '16px' }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Text strong style={{ fontSize: '24px', color: 'var(--semi-color-primary)' }}>156</Text>
                  <br />
                  <Text type="tertiary">已收录演出</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Text strong style={{ fontSize: '24px', color: 'var(--semi-color-primary)' }}>24</Text>
                  <br />
                  <Text type="tertiary">活跃团体</Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Text strong style={{ fontSize: '24px', color: 'var(--semi-color-primary)' }}>1,234</Text>
                  <br />
                  <Text type="tertiary">用户使用次数</Text>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{ 
        backgroundColor: 'var(--semi-color-bg-0)', 
        borderBottom: '1px solid var(--semi-color-border)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        {/* 左侧标题 */}
        <Title 
          heading={3} 
          style={{ margin: 0, color: 'var(--semi-color-text-0)', cursor: 'pointer' }}
          onClick={() => window.location.href = '/'}
        >
          地下偶像相关便利站
        </Title>
        
        {/* 中间导航 */}
        <div style={{ 
          position: 'absolute', 
          left: '50%', 
          transform: 'translateX(-50%)' 
        }}>
        <Nav
          mode="horizontal"
          items={topNavItems}
          style={{ display: 'flex', gap: '20px' }}
          onSelect={handleNavClick}
          selectedKeys={[currentPage]}
        />
        </div>
        
        {/* 右侧占位 */}
        <div style={{ width: '200px' }}></div>
      </Header>

      {/* 主内容区域 */}
      <Content style={{ backgroundColor: 'var(--semi-color-bg-0)' }}>
        <Routes>
          <Route path="/" element={renderContent()} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/recognition" element={<RecognitionPage />} />
          <Route path="/group/:groupName" element={<GroupPage />} />
        </Routes>
      </Content>
    </Layout>
  );
};

// 主应用组件包装器
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
