import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Row, Col, Tag, Button, Image, Spin, Empty, Divider, Timeline, Avatar, Badge, Modal, Notification, Input, Form } from '@douyinfe/semi-ui';
import { IconCalendar, IconMapPin, IconUser, IconImage, IconStar, IconHeart, IconShare, IconArrowLeft, IconPlus, IconClose, IconEdit } from '@douyinfe/semi-icons';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentDomainConfig } from '../config';
import config from '../config';

const { Title, Text, Paragraph } = Typography;

const GroupPage = () => {
  const { groupName } = useParams();
  const navigate = useNavigate();
  
  // 获取编辑者模式状态
  const domainConfig = getCurrentDomainConfig();
  const isEditorMode = domainConfig?.editorMode ?? true;
  
  const [groupInfo, setGroupInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleDetail, setScheduleDetail] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // 编辑相关状态
  const [memberModalVisible, setMemberModalVisible] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [editingMemberIndex, setEditingMemberIndex] = useState(-1);
  const [groupEditModalVisible, setGroupEditModalVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState({ name: '', location: '' });

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

  // 获取演出详情
  const fetchScheduleDetail = async (scheduleId) => {
    try {
      setScheduleLoading(true);
      const response = await fetch(`${config.API_BASE_URL}/schedule/${scheduleId}/`);
      
      if (!response.ok) {
        throw new Error('演出详情获取失败');
      }
      
      const data = await response.json();
      setScheduleDetail(data);
      setScheduleModalVisible(true);
    } catch (error) {
      Notification.error({
        title: '获取失败',
        content: error.message || '未知错误',
        duration: 3,
      });
    } finally {
      setScheduleLoading(false);
    }
  };

  // 编辑团体信息
  const editGroup = () => {
    setEditingGroup({
      name: groupInfo.name || '',
      location: groupInfo.location || ''
    });
    setGroupEditModalVisible(true);
  };

  // 保存团体信息
  const saveGroup = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/group/update/${groupInfo.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingGroup)
      });

      if (!response.ok) {
        throw new Error('更新团体信息失败');
      }

      Notification.success({
        title: '更新成功',
        content: '团体信息已更新',
        duration: 3,
      });

      setGroupEditModalVisible(false);
      fetchGroupInfo();
    } catch (error) {
      Notification.error({
        title: '更新失败',
        content: error.message || '未知错误',
        duration: 3,
      });
    }
  };

  // 添加成员
  const addMember = () => {
    setNewMemberName('');
    setEditingMemberIndex(-1);
    setMemberModalVisible(true);
  };

  // 编辑成员
  const editMember = (memberIndex) => {
    setNewMemberName(groupInfo.mates[memberIndex]);
    setEditingMemberIndex(memberIndex);
    setMemberModalVisible(true);
  };

  // 删除成员
  const deleteMember = async (memberIndex) => {
    try {
      const updatedMates = [...groupInfo.mates];
      updatedMates.splice(memberIndex, 1);
      
      const response = await fetch(`${config.API_BASE_URL}/group/update/${groupInfo.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupInfo.name,
          location: groupInfo.location,
          mates: updatedMates
        })
      });

      if (!response.ok) {
        throw new Error('删除成员失败');
      }

      Notification.success({
        title: '删除成功',
        content: '成员已删除',
        duration: 3,
      });

      fetchGroupInfo();
    } catch (error) {
      Notification.error({
        title: '删除失败',
        content: error.message || '未知错误',
        duration: 3,
      });
    }
  };

  // 保存成员
  const saveMember = async () => {
    try {
      const updatedMates = [...groupInfo.mates];
      
      if (editingMemberIndex >= 0) {
        // 编辑现有成员
        updatedMates[editingMemberIndex] = newMemberName;
      } else {
        // 添加新成员
        updatedMates.push(newMemberName);
      }
      
      const response = await fetch(`${config.API_BASE_URL}/group/update/${groupInfo.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: groupInfo.name,
          location: groupInfo.location,
          mates: updatedMates
        })
      });

      if (!response.ok) {
        throw new Error(editingMemberIndex >= 0 ? '更新成员失败' : '添加成员失败');
      }

      Notification.success({
        title: '保存成功',
        content: editingMemberIndex >= 0 ? '成员信息已更新' : '成员已添加',
        duration: 3,
      });

      setMemberModalVisible(false);
      setNewMemberName('');
      setEditingMemberIndex(-1);
      fetchGroupInfo();
    } catch (error) {
      Notification.error({
        title: '保存失败',
        content: error.message || '未知错误',
        duration: 3,
      });
    }
  };

  // 分离中英文
  const separateChineseAndEnglish = (text) => {
    if (!text) return { chinese: '', english: '' };
    
    const chineseParts = text.match(/[\u4e00-\u9fff]+/g) || [];
    const englishParts = text.match(/[a-zA-Z\s]+/g) || [];
    
    return {
      chinese: chineseParts.join(''),
      english: englishParts.join('').trim()
    };
  };

  // 检查文本是否包含中英混合
  const hasMixedLanguage = (text) => {
    if (!text) return false;
    const { chinese, english } = separateChineseAndEnglish(text);
    return chinese.length > 0 && english.length > 0;
  };

  // 渲染混合语言文本
  const renderMixedLanguageText = (text) => {
    const { chinese, english } = separateChineseAndEnglish(text);
    
    if (chinese && english) {
      return (
        <div style={{ lineHeight: 1.2 }}>
          <div>{chinese}</div>
          <div style={{ fontSize: '0.9em', opacity: 0.8 }}>{english}</div>
        </div>
      );
    }
    return text;
  };

  // 返回上一页
  const handleGoBack = () => {
    navigate(-1);
  };

  // 图片预览
  const handleImageClick = (imageUrl) => {
    setPreviewImage({ url: imageUrl });
    setImagePreviewVisible(true);
  };

  // 按演出时间排序演出历史
  const getSortedShowlogs = () => {
    if (!groupInfo.showlogs) return [];
    return [...groupInfo.showlogs].sort((a, b) => {
      // 按日期降序排列（最新的在前）
      return new Date(b.date) - new Date(a.date);
    });
  };

  // 获取最近的演出（已排序的前3个）
  const getRecentShowlogs = () => {
    return getSortedShowlogs().slice(0, 3);
  };

  // 点击团体名称跳转
  const handleGroupClick = (groupName) => {
    setScheduleModalVisible(false);
    setScheduleDetail(null);
    navigate(`/group/${encodeURIComponent(groupName)}`);
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <Text type="danger" size="large">{error}</Text>
        <Button onClick={handleGoBack}>返回</Button>
      </div>
    );
  }

  if (!groupInfo) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Empty title="团体信息不存在" />
      </div>
    );
  }

  return (
    <div style={{ 
      padding: window.innerWidth <= 768 ? '16px' : '24px', 
      maxWidth: '1200px', 
      margin: '0 auto' 
    }}>
      {/* 头部导航 */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: window.innerWidth <= 768 ? '16px' : '24px',
        gap: '16px',
        flexWrap: window.innerWidth <= 768 ? 'wrap' : 'nowrap'
      }}>
        <Button 
          icon={<IconArrowLeft />} 
          onClick={handleGoBack}
          type="tertiary"
          size={window.innerWidth <= 768 ? 'small' : 'default'}
        >
          {window.innerWidth <= 768 ? '' : '返回'}
        </Button>
        <Title level={window.innerWidth <= 768 ? 3 : 2} style={{ margin: 0, flex: 1 }}>
          {groupInfo.name}
        </Title>
        {isEditorMode && (
          <Button 
            icon={<IconEdit />}
            onClick={editGroup}
            type="primary"
            size="small"
          >
            {window.innerWidth <= 768 ? '' : '编辑团体'}
          </Button>
        )}
      </div>

      <Row gutter={window.innerWidth <= 768 ? 16 : 24}>
        {/* 左侧主要内容 */}
        <Col span={window.innerWidth <= 768 ? 24 : 16}>
          {/* 团体基本信息 */}
          <Card style={{ marginBottom: '24px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: window.innerWidth <= 768 ? '12px' : '16px',
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                textAlign: window.innerWidth <= 768 ? 'center' : 'left'
              }}>
                <Avatar 
                  size="extra-large"
                  style={{ 
                    backgroundColor: '#1890ff',
                    borderRadius: '50%',
                    width: window.innerWidth <= 768 ? '60px' : '80px',
                    height: window.innerWidth <= 768 ? '60px' : '80px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: window.innerWidth <= 768 ? '24px' : '32px',
                    fontWeight: 'bold'
                  }}
                >
                  {groupInfo.name?.charAt(0) || 'G'}
                </Avatar>
                <div style={{ 
                  flex: 1, 
                  minWidth: 0,
                  textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                }}>
                  <Title level={window.innerWidth <= 768 ? 4 : 3} style={{ margin: 0 }}>
                    {hasMixedLanguage(groupInfo.name) ? (
                      renderMixedLanguageText(groupInfo.name)
                    ) : (
                      <span style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>
                        {groupInfo.name}
                      </span>
                    )}
                  </Title>
                  <Text type="secondary" style={{ fontSize: window.innerWidth <= 768 ? '14px' : '16px' }}>
                    {hasMixedLanguage(groupInfo.location) ? (
                      renderMixedLanguageText(groupInfo.location)
                    ) : (
                      <span style={{ 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>
                        {groupInfo.location || '未设置常驻地'}
                      </span>
                    )}
                  </Text>
                </div>
              </div>
              
              <Divider />
              
              {/* 统计信息 */}
              <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="tertiary" size={window.innerWidth <= 768 ? 'small' : 'normal'}>成员数量</Text>
                    <div style={{ 
                      fontSize: window.innerWidth <= 768 ? '18px' : '24px', 
                      fontWeight: 600, 
                      color: '#1890ff' 
                    }}>
                      {groupInfo.mates ? groupInfo.mates.length : 0}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="tertiary" size={window.innerWidth <= 768 ? 'small' : 'normal'}>演出次数</Text>
                    <div style={{ 
                      fontSize: window.innerWidth <= 768 ? '18px' : '24px', 
                      fontWeight: 600, 
                      color: '#52c41a' 
                    }}>
                      {groupInfo.showlogs ? groupInfo.showlogs.length : 0}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="tertiary" size={window.innerWidth <= 768 ? 'small' : 'normal'}>常驻地</Text>
                    <div style={{ 
                      fontSize: window.innerWidth <= 768 ? '12px' : '16px', 
                      fontWeight: 500 
                    }}>
                      {groupInfo.location || '未设置'}
                    </div>
                  </div>
                </Col>
              </Row>
            </Space>
          </Card>

          {/* 成员列表 */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>团体成员</span>
                {isEditorMode && (
                  <Button 
                    type="primary" 
                    icon={<IconPlus />}
                    size="small"
                    onClick={addMember}
                  >
                    添加成员
                  </Button>
                )}
              </div>
            }
            style={{ marginBottom: '24px' }}
          >
            {groupInfo.mates && groupInfo.mates.length > 0 ? (
              <Row gutter={window.innerWidth <= 768 ? 8 : 16}>
                {groupInfo.mates.map((memberName, index) => (
                  <Col span={window.innerWidth <= 768 ? 12 : 6} key={index}>
                    <div style={{ 
                      textAlign: 'center', 
                      padding: window.innerWidth <= 768 ? '12px' : '16px', 
                      position: 'relative',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px',
                      backgroundColor: '#fafafa'
                    }}>
                      <Avatar 
                        size="large"
                        style={{ 
                          marginBottom: '8px', 
                          backgroundColor: '#1890ff',
                          borderRadius: '50%',
                          width: window.innerWidth <= 768 ? '40px' : '60px',
                          height: window.innerWidth <= 768 ? '40px' : '60px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: window.innerWidth <= 768 ? '16px' : '20px',
                          fontWeight: 'bold'
                        }}
                      >
                        {memberName?.charAt(0) || 'M'}
                      </Avatar>
                      <div style={{ 
                        fontWeight: 500, 
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%'
                      }}>
                        {memberName}
                      </div>
                      {isEditorMode && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '8px', 
                          right: '8px',
                          display: 'flex',
                          gap: '4px'
                        }}>
                          <Button
                            type="tertiary"
                            icon={<IconEdit />}
                            size="small"
                            onClick={() => editMember(index)}
                            style={{ minWidth: '24px', height: '24px', padding: '0' }}
                          />
                          <Button
                            type="tertiary"
                            icon={<IconClose />}
                            size="small"
                            onClick={() => deleteMember(index)}
                            style={{ minWidth: '24px', height: '24px', padding: '0' }}
                          />
                        </div>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty 
                title="暂无成员" 
                description="该团体还没有成员信息"
              />
            )}
          </Card>

          {/* 演出历史 */}
          <Card title="演出历史" style={{ marginBottom: '24px' }}>
            {getSortedShowlogs().length > 0 ? (
              <Timeline>
                {getSortedShowlogs().map((showlog, index) => (
                  <Timeline.Item key={index}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                          {showlog.title}
                        </div>
                        <Space>
                          <Tag icon={<IconCalendar />}>
                            {showlog.date}
                          </Tag>
                          <Tag icon={<IconMapPin />}>
                            {showlog.location}
                          </Tag>
                        </Space>
                      </div>
                      <Button 
                        size="small"
                        onClick={() => fetchScheduleDetail(showlog.schedule_id)}
                        loading={scheduleLoading}
                      >
                        查看详情
                      </Button>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty 
                title="暂无演出记录" 
                description="该团体还没有演出历史"
              />
            )}
          </Card>
        </Col>

        {/* 右侧信息 */}
        <Col span={window.innerWidth <= 768 ? 24 : 8}>
          {/* 团体标签 */}
          <Card title="团体标签" style={{ marginBottom: '24px' }}>
            <Space wrap>
              <Tag color="blue">偶像团体</Tag>
              <Tag color="green">活跃团体</Tag>
              <Tag color="orange">上海</Tag>
            </Space>
          </Card>

          {/* 最近演出 */}
          <Card title="最近演出">
            {getRecentShowlogs().length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {getRecentShowlogs().map((showlog, index) => (
                  <div key={index} style={{ 
                    padding: '12px', 
                    border: '1px solid #f0f0f0', 
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                  onClick={() => fetchScheduleDetail(showlog.schedule_id)}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {showlog.title}
                    </div>
                    <Space>
                      <Text type="secondary" size="small">
                        {showlog.date}
                      </Text>
                      <Text type="secondary" size="small">
                        {showlog.location}
                      </Text>
                    </Space>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty 
                title="暂无演出" 
                description="该团体还没有演出记录"
                image={<IconCalendar size="extra-large" />}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 演出详情模态框 */}
      <Modal
        title="演出详情"
        visible={scheduleModalVisible}
        onCancel={() => {
          setScheduleModalVisible(false);
          setScheduleDetail(null);
        }}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : 600}
        style={{ maxWidth: window.innerWidth <= 768 ? '100vw' : '600px' }}
      >
        {scheduleDetail && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Title level={4}>{scheduleDetail.title}</Title>
              <Space>
                <Tag icon={<IconCalendar />}>{scheduleDetail.date}</Tag>
                <Tag icon={<IconMapPin />}>{scheduleDetail.location}</Tag>
                <Tag>{scheduleDetail.city}</Tag>
              </Space>
            </div>
            
            <Divider />
            
            {scheduleDetail.groups && scheduleDetail.groups.length > 0 && (
              <div>
                <Text strong>演出团体:</Text>
                <div style={{ marginTop: '8px' }}>
                  <Space wrap>
                    {scheduleDetail.groups.map((group, index) => (
                      <Tag 
                        key={index}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleGroupClick(group)}
                      >
                        {group}
                      </Tag>
                    ))}
                  </Space>
                </div>
              </div>
            )}
            
            {scheduleDetail.imgs && scheduleDetail.imgs.length > 0 && (
              <div>
                <Text strong>演出图片:</Text>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                  gap: '8px',
                  marginTop: '8px'
                }}>
                  {scheduleDetail.imgs.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      <Image
                        src={`${config.API_BASE_URL}${img.url}`}
                        alt={img.filename}
                        width="100%"
                        height="120px"
                        style={{ 
                          objectFit: 'cover',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(`${config.API_BASE_URL}${img.url}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Space>
        )}
      </Modal>

      {/* 图片预览模态框 */}
      <Modal
        visible={imagePreviewVisible}
        onCancel={() => setImagePreviewVisible(false)}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : '90%'}
        style={{ maxWidth: window.innerWidth <= 768 ? '100vw' : '1200px' }}
      >
        {previewImage && (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={previewImage.url}
              alt="预览"
              style={{ 
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          </div>
        )}
      </Modal>

      {/* 团体编辑模态框 */}
      <Modal
        title="编辑团体信息"
        visible={groupEditModalVisible}
        onCancel={() => setGroupEditModalVisible(false)}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : 500}
        style={{ maxWidth: window.innerWidth <= 768 ? '100vw' : '500px' }}
      >
        <Form>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                团体名称 *
              </label>
              <Input
                placeholder="请输入团体名称"
                value={editingGroup.name}
                onChange={val => setEditingGroup(prev => ({ ...prev, name: val }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                常驻地
              </label>
              <Input
                placeholder="请输入常驻地"
                value={editingGroup.location}
                onChange={val => setEditingGroup(prev => ({ ...prev, location: val }))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button onClick={() => setGroupEditModalVisible(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                onClick={saveGroup}
                disabled={!editingGroup.name.trim()}
              >
                保存
              </Button>
            </div>
          </Space>
        </Form>
      </Modal>

      {/* 成员编辑模态框 */}
      <Modal
        title={editingMemberIndex >= 0 ? '编辑成员' : '添加成员'}
        visible={memberModalVisible}
        onCancel={() => {
          setMemberModalVisible(false);
          setNewMemberName('');
          setEditingMemberIndex(-1);
        }}
        footer={null}
        width={window.innerWidth <= 768 ? '95%' : 400}
        style={{ maxWidth: window.innerWidth <= 768 ? '100vw' : '400px' }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              成员姓名 *
            </label>
            <Input
              placeholder="请输入成员姓名"
              value={newMemberName}
              onChange={val => setNewMemberName(val)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button onClick={() => setMemberModalVisible(false)}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={saveMember}
              disabled={!newMemberName.trim()}
            >
              {editingMemberIndex >= 0 ? '更新' : '添加'}
            </Button>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default GroupPage;