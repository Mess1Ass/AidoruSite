import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col, 
  Tag, 
  Button, 
  Image, 
  Spin,
  Empty,
  Divider,
  Timeline,
  Avatar,
  Badge
} from '@douyinfe/semi-ui';
import { 
  IconCalendar, 
  IconMapPin, 
  IconUser, 
  IconImage,
  IconStar,
  IconHeart,
  IconShare,
  IconArrowLeft
} from '@douyinfe/semi-icons';
import { useParams, useNavigate } from 'react-router-dom';
import config from '../config';

const { Title, Text, Paragraph } = Typography;

const GroupPage = () => {
  const { groupName } = useParams();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取团体信息
  const fetchGroupInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/group/name/${encodeURIComponent(groupName)}/`);
      
      if (!response.ok) {
        throw new Error('团体信息获取失败');
      }
      
      const data = await response.json();
      setGroupInfo(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (groupName) {
      fetchGroupInfo();
    }
  }, [groupName]);

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Button 
          icon={<IconArrowLeft />} 
          onClick={handleGoBack}
          style={{ marginBottom: '20px' }}
        >
          返回
        </Button>
        <Empty 
          title="团体信息获取失败" 
          description={error}
        />
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div style={{ padding: '20px' }}>
        <Button 
          icon={<IconArrowLeft />} 
          onClick={handleGoBack}
          style={{ marginBottom: '20px' }}
        >
          返回
        </Button>
        <Empty 
          title="团体不存在" 
          description="未找到该团体的相关信息"
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 返回按钮 */}
      <Button 
        icon={<IconArrowLeft />} 
        onClick={handleGoBack}
        style={{ marginBottom: '20px' }}
      >
        返回
      </Button>

      {/* 团体基本信息 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={24}>
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              {groupInfo.avatar ? (
                <Avatar 
                  src={`${config.API_BASE_URL}${groupInfo.avatar}`}
                  size="extra-large"
                  style={{ marginBottom: '16px' }}
                />
              ) : (
                <Avatar 
                  size="extra-large"
                  style={{ 
                    marginBottom: '16px',
                    backgroundColor: 'var(--semi-color-primary)',
                    fontSize: '24px'
                  }}
                >
                  {groupInfo.name?.charAt(0) || 'G'}
                </Avatar>
              )}
            </div>
          </Col>
          <Col span={18}>
            <Space direction="vertical" spacing="large" style={{ width: '100%' }}>
              <div>
                <Title heading={1} style={{ margin: 0 }}>
                  {groupInfo.name}
                </Title>
                {groupInfo.englishName && (
                  <Text type="secondary" size="large">
                    {groupInfo.englishName}
                  </Text>
                )}
              </div>
              
              {groupInfo.description && (
                <Paragraph>
                  {groupInfo.description}
                </Paragraph>
              )}

              <Space wrap>
                {groupInfo.tags && groupInfo.tags.map((tag, index) => (
                  <Tag key={index} color="blue" size="large">
                    {tag}
                  </Tag>
                ))}
              </Space>

              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="tertiary">成立时间</Text>
                    <div style={{ fontSize: '16px', fontWeight: 500 }}>
                      {groupInfo.foundedDate ? formatDate(groupInfo.foundedDate) : '未知'}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="tertiary">成员数量</Text>
                    <div style={{ fontSize: '16px', fontWeight: 500 }}>
                      {groupInfo.memberCount || '未知'}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="tertiary">演出次数</Text>
                    <div style={{ fontSize: '16px', fontWeight: 500 }}>
                      {groupInfo.performanceCount || '未知'}
                    </div>
                  </div>
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 团体成员 */}
      {groupInfo.members && groupInfo.members.length > 0 && (
        <Card title="团体成员" style={{ marginBottom: '24px' }}>
          <Row gutter={16}>
            {groupInfo.members.map((member, index) => (
              <Col span={6} key={index}>
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <Avatar 
                    src={member.avatar ? `${config.API_BASE_URL}${member.avatar}` : undefined}
                    size="large"
                    style={{ marginBottom: '8px' }}
                  >
                    {member.name?.charAt(0) || 'M'}
                  </Avatar>
                  <div style={{ fontWeight: 500 }}>{member.name}</div>
                  {member.role && (
                    <Text type="secondary" size="small">{member.role}</Text>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 演出历史 */}
      <Card title="演出历史">
        <Empty 
          title="演出历史功能开发中" 
          description="演出历史功能正在开发中，敬请期待"
        />
      </Card>
    </div>
  );
};

export default GroupPage;
