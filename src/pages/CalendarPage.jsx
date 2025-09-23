import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Row, Col, Modal, Form, Input, DatePicker, TimePicker, Notification } from '@douyinfe/semi-ui';
import { IconPlus, IconCalendar, IconMapPin, IconClock, IconUser, IconChevronLeft, IconChevronRight, IconClose } from '@douyinfe/semi-icons';
import { getCurrentDomainConfig } from '../config';
import config from '../config';
import './CalendarPage.css';

const { Title, Text } = Typography;

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [timeTableItems, setTimeTableItems] = useState([]);
  const [specialEventsItems, setSpecialEventsItems] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: null, entryTime: '', startTime: '', location: '' });
  const [editingId, setEditingId] = useState(null);
  
  // 获取编辑者模式状态
  const domainConfig = getCurrentDomainConfig();
  const isEditorMode = domainConfig.editorMode;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formApi, setFormApi] = useState(null);
  
  // 将任意时间值格式化为 HH:mm 字符串
  const formatToHHmm = (timeValue) => {
    if (!timeValue) return '';
    // 已经是 HH:mm
    if (typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue)) {
      return timeValue;
    }
    // 字符串形态的日期
    if (typeof timeValue === 'string' && (timeValue.includes('GMT') || timeValue.includes('Mon') || timeValue.includes('Tue') || timeValue.includes('Wed') || timeValue.includes('Thu') || timeValue.includes('Fri') || timeValue.includes('Sat') || timeValue.includes('Sun'))) {
      try {
        const d = new Date(timeValue);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      } catch (e) {
        return String(timeValue);
      }
    }
    // Date 对象
    if (typeof timeValue === 'object' && typeof timeValue.getHours === 'function') {
      const hh = String(timeValue.getHours()).padStart(2, '0');
      const mm = String(timeValue.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return String(timeValue);
  };

  // 将日期值格式化为 YYYY-MM-DD 字符串
  const formatDateToYMD = (dateValue) => {
    if (!dateValue) return '';
    // 已经是 YYYY-MM-DD
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    // dayjs/moment-like 对象
    if (typeof dateValue === 'object' && typeof dateValue.format === 'function') {
      return dateValue.format('YYYY-MM-DD');
    }
    // 字符串形态的日期
    if (typeof dateValue === 'string') {
      try {
        const d = new Date(dateValue);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      } catch (e) {
        return String(dateValue);
      }
    }
    // Date 对象
    if (typeof dateValue === 'object' && typeof dateValue.getFullYear === 'function') {
      const y = dateValue.getFullYear();
      const m = String(dateValue.getMonth() + 1).padStart(2, '0');
      const da = String(dateValue.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    }
    return String(dateValue);
  };

  // API调用函数
  const apiCall = async (endpoint, method = 'GET', data = null) => {
    const url = `${config.API_BASE_URL}/schedule${endpoint}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // 处理无内容响应（如 204 No Content）或非 JSON 响应
      const contentType = response.headers.get('content-type') || '';
      if (response.status === 204 || response.status === 205) {
        return null;
      }
      const text = await response.text();
      if (!text) {
        return null;
      }
      if (!contentType.includes('application/json')) {
        return null;
      }
      return JSON.parse(text);
    } catch (error) {
      // 交由调用方处理
      throw error;
    }
  };

  // 获取所有演出
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/');
      
      // 直接使用后端数据，不进行转换
      const formatTimeFromBackend = (timeValue) => {
        
        if (!timeValue) return '';
        return String(timeValue);
      };

      const formattedEvents = data.map(event => ({
        _id: event._id || event.id,
        location: event.location,
        date: event.date,
        entryTime: formatTimeFromBackend(event.entry_time), // 确保是"14:00"格式
        startTime: formatTimeFromBackend(event.start_time), // 确保是"14:00"格式
        title: event.title,
        timeTable: (event.timetable || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time)      // 确保是"14:00"格式
        })),
        specialEvents: (event.special_events || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time)      // 确保是"14:00"格式
        })),
        updateTime: event.updated_at || event.created_at
      }));
      
      
      setEvents(formattedEvents);
    } catch (error) {
      Notification.error({
        title: '获取演出列表失败',
        content: error.message,
        duration: 3,
      });
    } finally {
      setLoading(false);
    }
  };

  // 创建演出
  const createSchedule = async (scheduleData) => {
    try {
      const data = await apiCall('/create/', 'POST', scheduleData);
      
      // 直接使用后端数据，不进行转换
      const formatTimeFromBackend = (timeValue) => {
        if (!timeValue) return '';
        return String(timeValue);
      };

      const formattedEvent = {
        _id: data._id || data.id,
        location: data.location,
        date: data.date,
        entryTime: formatTimeFromBackend(data.entry_time), // 确保是"14:00"格式
        startTime: formatTimeFromBackend(data.start_time), // 确保是"14:00"格式
        title: data.title,
        timeTable: (data.timetable || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time)      // 确保是"14:00"格式
        })),
        specialEvents: (data.special_events || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time)      // 确保是"14:00"格式
        })),
        updateTime: data.updated_at || data.created_at
      };
      
      console.log('转换后的新演出数据:', formattedEvent);
      setEvents(prev => [...prev, formattedEvent]);
      Notification.success({
        title: '创建成功',
        content: '演出已成功添加到日历',
        duration: 3,
      });
    } catch (error) {
      Notification.error({
        title: '创建失败',
        content: error.message,
        duration: 3,
      });
      throw error;
    }
  };

  // 更新演出
  const updateSchedule = async (scheduleId, scheduleData) => {
    try {
      const data = await apiCall(`/update/${scheduleId}/`, 'PUT', scheduleData);
      
      // 直接使用后端数据，不进行转换
      const formatTimeFromBackend = (timeValue) => {
        console.log('formatTimeFromBackend 输入:', timeValue, '类型:', typeof timeValue);
        if (!timeValue) return '';
        return String(timeValue);
      };

      const formattedEvent = {
        _id: data._id || data.id,
        location: data.location,
        date: data.date,
        entryTime: formatTimeFromBackend(data.entry_time), // 确保是"14:00"格式
        startTime: formatTimeFromBackend(data.start_time), // 确保是"14:00"格式
        title: data.title,
        timeTable: (data.timetable || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time)      // 确保是"14:00"格式
        })),
        specialEvents: (data.special_events || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time)      // 确保是"14:00"格式
        })),
        updateTime: data.updated_at || data.created_at
      };
      
      setEvents(prev => prev.map(event => event._id === scheduleId ? formattedEvent : event));
      Notification.success({
        title: '更新成功',
        content: '演出信息已更新',
        duration: 3,
      });
    } catch (error) {
      Notification.error({
        title: '更新失败',
        content: error.message,
        duration: 3,
      });
      throw error;
    }
  };

  // 删除演出
  const deleteSchedule = async (scheduleId) => {
    try {
      await apiCall(`/delete/${scheduleId}/`, 'DELETE');
      setEvents(prev => prev.filter(event => event._id !== scheduleId));
      Notification.success({
        title: '删除成功',
        content: '演出已从日历中删除',
        duration: 3,
      });
    } catch (error) {
      Notification.error({
        title: '删除失败',
        content: error.message,
        duration: 3,
      });
      throw error;
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchSchedules();
  }, []);

  // 获取指定日期的演出
  const getEventsForDate = (date) => {
    // 使用本地时间生成 YYYY-MM-DD，避免 toISOString 的时区偏移导致日期+1/-1
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    return events.filter(event => event.date === dateStr);
  };

  // 生成当月日历数据
  const generateCalendarData = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    // 只生成35个日期（5行 x 7列）
    for (let i = 0; i < 35; i++) {
      calendar.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return calendar;
  };

  // 处理日期点击
  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
    setSelectedDate(date);
  };

  // 处理演出点击
  const handleEventClick = (event) => {
    setViewEvent(event);
    setViewModalVisible(true);
  };

  // 添加演出时间表项目
  const addTimeTableItem = () => {
    setTimeTableItems([...timeTableItems, { group: '', startTime: '', endTime: '' }]);
  };

  // 删除演出时间表项目
  const removeTimeTableItem = (index) => {
    const newItems = timeTableItems.filter((_, i) => i !== index);
    setTimeTableItems(newItems);
  };

  // 添加特典会项目
  const addSpecialEventsItem = () => {
    setSpecialEventsItems([...specialEventsItems, { group: '', selectedTypes: [] }]);
  };

  // 删除特典会项目
  const removeSpecialEventsItem = (index) => {
    const newItems = specialEventsItems.filter((_, i) => i !== index);
    setSpecialEventsItems(newItems);
  };

  // 切换特典会类型选择
  const toggleSpecialEventType = (index, timeType) => {
    const newItems = [...specialEventsItems];
    const currentTypes = newItems[index].selectedTypes || [];
    
    if (currentTypes.includes(timeType)) {
      // 如果已选中，则取消选择
      newItems[index].selectedTypes = currentTypes.filter(type => type !== timeType);
    } else {
      // 如果未选中，则添加选择
      newItems[index].selectedTypes = [...currentTypes, timeType];
    }
    
    setSpecialEventsItems(newItems);
  };

  // 添加新演出
  const handleAddEvent = async (values) => {
    console.log('表单提交数据:', values);
    console.log('时间表项目:', timeTableItems);
    console.log('特典会项目:', specialEventsItems);
    
    try {
      // 处理特典会数据
      const processedSpecialEvents = specialEventsItems
        .filter(item => item.group && item.selectedTypes && item.selectedTypes.length > 0)
        .map(item => {
          const timeStr = item.selectedTypes.join('-');
          return {
            group: item.group,
            startTime: timeStr,
            endTime: timeStr
          };
        });
      
      // 处理日期格式，统一为 YYYY-MM-DD
      const dateStr = formatDateToYMD(values.date);
      if (!dateStr) throw new Error('日期字段不能为空');
      
      // 统一时间格式为 HH:mm
      const formatTime = (timeValue) => {
        const v = formatToHHmm(timeValue);
        return v;
      };
      
      const entryTimeFormatted = formatTime(values.entryTime);
      const startTimeFormatted = formatTime(values.startTime);
      
      const scheduleData = {
        location: String(values.location || ''),
        date: String(dateStr),
        entry_time: entryTimeFormatted, // 确保是字符串
        start_time: startTimeFormatted, // 确保是字符串
        title: String(values.title || ''),
        timetable: timeTableItems.filter(item => item.group && item.startTime && item.endTime).map(item => ({
          group: String(item.group),
          start_time: formatTime(item.startTime),
          end_time: formatTime(item.endTime)
        })),
        special_events: processedSpecialEvents.map(item => ({
          group: String(item.group),
          start_time: formatTime(item.startTime),
          end_time: formatTime(item.endTime)
        }))
      };
      
      if (editingId) {
        await updateSchedule(editingId, scheduleData);
      } else {
        await createSchedule(scheduleData);
      }
      setModalVisible(false);
      setEditingId(null);
      
      // 清空表单状态
      setTimeTableItems([]);
      setSpecialEventsItems([]);
    } catch (error) {
      Notification.error({
        title: '添加失败',
        content: error.message || '未知错误',
        duration: 3,
      });
    }
  };

  // 渲染日期单元格
  const renderDateCell = (date) => {
    const dayEvents = getEventsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    const isCurrentMonth = date.getMonth() === selectedDate.getMonth();
    
    return (
      <div 
        className={`calendar-date-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${!isCurrentMonth ? 'other-month' : ''}`}
        onClick={() => handleDateClick(date)}
      >
        {/* 日期数字 */}
        <div className="date-number">
          {date.getDate()}
        </div>
        
        {/* 演出数量徽章 */}
        {dayEvents.length > 0 && (
          <div className="event-badge">
            {dayEvents.length}
          </div>
        )}
        
        {/* 演出地点信息 */}
        <div className="event-locations">
          {dayEvents.slice(0, 2).map(event => (
            <div 
              key={event._id}
              className="location-item"
              title={`${event.title} - ${event.location}`}
            >
              {event.location}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="more-events">
              +{dayEvents.length - 2} 更多
            </div>
          )}
        </div>
      </div>
    );
  };

  const calendarData = generateCalendarData();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <Title heading={2} style={{ margin: 0 }}>
          演出日历
        </Title>
            <Space>
              {isEditorMode && (
                <Button 
                  type="primary" 
                  icon={<IconPlus />}
                  onClick={() => {
                    setNewEvent({ title: '', date: formatDateToYMD(selectedDate), entryTime: '', startTime: '', location: '' });
                    setTimeTableItems([]);
                    setSpecialEventsItems([]);
                    setModalVisible(true);
                  }}
                  size="large"
                >
                  添加演出
                </Button>
              )}
            </Space>
      </div>
      
      <Row gutter={[24, 24]} style={{ minHeight: '700px' }}>
            {/* 大日历区域 */}
            <Col span={18}>
              <Card 
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>演出日程</span>
                    <Button 
                      size="small" 
                      type="tertiary"
                      onClick={() => setSelectedDate(new Date())}
                      style={{ marginLeft: 'auto' }}
                    >
                      回到本月
                    </Button>
                  </div>
                }
                className="calendar-container"
                loading={loading}
              >
            <div className="calendar-wrapper">
              {/* 月份导航 */}
              <div className="calendar-month-header">
                <Button 
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() - 1);
                    setSelectedDate(newDate);
                  }}
                >
                  ←
                </Button>
                <Title heading={3} style={{ margin: '0 20px' }}>
                  {selectedDate.getFullYear()}年{selectedDate.getMonth() + 1}月
                </Title>
                <Button 
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(newDate.getMonth() + 1);
                    setSelectedDate(newDate);
                  }}
                >
                  →
                </Button>
              </div>

              {/* 星期标题 */}
              <div className="calendar-weekdays">
                {weekDays.map(day => (
                  <div key={day} className="weekday-header">
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="calendar-grid">
                {calendarData.map((date, index) => (
                  <div key={index} className="calendar-cell">
                    {renderDateCell(date)}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>

        {/* 侧边栏 */}
        <Col span={6}>
          <div className="sidebar">
            {/* 选中日期演出详情 */}
            <Card title={`${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日演出详情`} className="today-events">
              {getEventsForDate(selectedDate).length > 0 ? (
                <Space vertical style={{ width: '100%' }}>
                  {getEventsForDate(selectedDate).map(event => (
                    <Card 
                      key={event._id}
                      size="small"
                      className="event-card"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="event-title">{event.title}</div>
                          <div className="event-detail">
                            <IconClock /> {event.entryTime ? `入场: ${event.entryTime} | ` : ''}开始: {event.startTime}
                          </div>
                      <div className="event-detail">
                        <IconMapPin /> {event.location}
                      </div>
                      <div className="event-detail">
                        <IconUser /> {event.timeTable.length} 个团体
                      </div>
                      {event.specialEvents && event.specialEvents.length > 0 && (
                        <div className="event-detail" style={{ color: 'var(--semi-color-warning)' }}>
                          ⭐ {event.specialEvents.length} 个特典会
                        </div>
                      )}
                    </Card>
                  ))}
                </Space>
              ) : (
                <Text type="tertiary">该日期无演出安排</Text>
              )}
            </Card>

            {/* 统计信息 */}
            <Card title="统计信息" className="stats-card">
              <div className="stat-item">
                <span className="stat-label">本月演出</span>
                <span className="stat-value">{events.length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">已参加</span>
                <span className="stat-value">{events.filter(event => {
                  const eventDate = new Date(event.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // 重置时间到当天开始
                  return eventDate < today;
                }).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">待参加</span>
                <span className="stat-value">{events.filter(event => {
                  const eventDate = new Date(event.date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0); // 重置时间到当天开始
                  return eventDate >= today;
                }).length}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">选中日期演出</span>
                <span className="stat-value">{getEventsForDate(selectedDate).length}</span>
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* 添加演出模态框 */}
      {isEditorMode && (
        <Modal
          title={editingId ? '更新演出' : '添加演出'}
          visible={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setTimeTableItems([]);
            setSpecialEventsItems([]);
            setNewEvent({ title: '', date: null, entryTime: '', startTime: '', location: '' });
            setEditingId(null);
          }}
          footer={null}
          width={800}
        >
        <div>
          {/* 基本信息 */}
          <div style={{ fontWeight: 600, margin: '8px 0' }}>基本信息</div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>演出名称 *</label>
          </div>
          <Input
            placeholder="请输入演出名称"
            value={newEvent.title}
            onChange={val => setNewEvent(prev => ({ ...prev, title: val }))}
            style={{ marginBottom: '16px' }}
          />
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>演出日期 *</label>
          </div>
          <DatePicker
            placeholder="请选择演出日期"
            value={newEvent.date || undefined}
            onChange={val => setNewEvent(prev => ({ ...prev, date: formatDateToYMD(val) }))}
            style={{ width: '100%', marginBottom: '16px' }}
          />
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>入场时间</label>
            <span style={{ fontSize: '12px', color: 'var(--semi-color-text-2)', marginLeft: '4px' }}>（可选）</span>
          </div>
          <TimePicker
            format="HH:mm"
            placeholder="请选择入场时间"
            value={newEvent.entryTime || undefined}
            onChange={val => setNewEvent(prev => ({ ...prev, entryTime: formatToHHmm(val) }))}
            style={{ width: '100%', marginBottom: '16px' }}
          />
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>开始时间 *</label>
          </div>
          <TimePicker
            format="HH:mm"
            placeholder="请选择开始时间"
            value={newEvent.startTime || undefined}
            onChange={val => setNewEvent(prev => ({ ...prev, startTime: formatToHHmm(val) }))}
            style={{ width: '100%', marginBottom: '16px' }}
          />
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>演出地点 *</label>
          </div>
          <Input
            placeholder="请输入演出地点"
            value={newEvent.location}
            onChange={val => setNewEvent(prev => ({ ...prev, location: val }))}
            style={{ marginBottom: '20px' }}
          />
          
          {/* 演出时间表 */}
          <div style={{ fontWeight: 600, margin: '8px 0' }}>演出时间表</div>
            <div style={{ marginBottom: '16px' }}>
              <Space vertical style={{ width: '100%' }}>
                {timeTableItems.map((item, index) => (
                  <Card key={index} size="small" style={{ backgroundColor: 'var(--semi-color-fill-0)', width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '4px' }}>团体名称</label>
                        <Input
                          placeholder="团体名称"
                          style={{ width: '150px' }}
                          value={item.group}
                          onChange={val => {
                            const newItems = [...timeTableItems];
                            newItems[index].group = val;
                            setTimeTableItems(newItems);
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '4px' }}>开始时间</label>
                        <TimePicker
                          placeholder="开始时间"
                          style={{ width: '120px' }}
                          format="HH:mm"
                          value={item.startTime || undefined}
                          onChange={val => {
                            const newItems = [...timeTableItems];
                            newItems[index].startTime = formatToHHmm(val);
                            setTimeTableItems(newItems);
                          }}
                          type="time"
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '4px' }}>结束时间</label>
                        <TimePicker
                          placeholder="结束时间"
                          style={{ width: '120px' }}
                          format="HH:mm"
                          value={item.endTime || undefined}
                          onChange={val => {
                            const newItems = [...timeTableItems];
                            newItems[index].endTime = formatToHHmm(val);
                            setTimeTableItems(newItems);
                          }}
                          type="time"
                        />
                      </div>
                      <Button
                        type="tertiary"
                        icon={<IconClose />}
                        size="small"
                        onClick={() => removeTimeTableItem(index)}
                        style={{ marginTop: '20px' }}
                      />
                    </Space>
                  </Card>
                ))}
                <Button
                  type="tertiary"
                  icon={<IconPlus />}
                  onClick={addTimeTableItem}
                  style={{ width: '100%' }}
                >
                  添加演出时间
                </Button>
              </Space>
            </div>
          

          {/* 特典会 */}
          <div style={{ fontWeight: 600, margin: '8px 0' }}>特典会</div>
            <div style={{ marginBottom: '16px' }}>
              <Space vertical style={{ width: '100%' }}>
                {specialEventsItems.map((item, index) => (
                  <Card key={index} size="small" style={{ backgroundColor: 'var(--semi-color-warning-light)', width: '100%' }}>
                    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '4px' }}>团体名称</label>
                        <Input
                          placeholder="团体名称"
                          style={{ width: '150px' }}
                          value={item.group}
                          onChange={val => {
                            const newItems = [...specialEventsItems];
                            newItems[index].group = val;
                            setSpecialEventsItems(newItems);
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '4px' }}>特典类型</label>
                        <Space>
                          <Button
                            size="small"
                            type={item.selectedTypes?.includes('前特') ? 'primary' : 'tertiary'}
                            onClick={() => toggleSpecialEventType(index, '前特')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            前特
                          </Button>
                          <Button
                            size="small"
                            type={item.selectedTypes?.includes('平特') ? 'primary' : 'tertiary'}
                            onClick={() => toggleSpecialEventType(index, '平特')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            平特
                          </Button>
                          <Button
                            size="small"
                            type={item.selectedTypes?.includes('终特') ? 'primary' : 'tertiary'}
                            onClick={() => toggleSpecialEventType(index, '终特')}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            终特
                          </Button>
                        </Space>
                      </div>
                      <Button
                        type="tertiary"
                        icon={<IconClose />}
                        size="small"
                        onClick={() => removeSpecialEventsItem(index)}
                        style={{ marginTop: '20px' }}
                      />
                    </Space>
                  </Card>
                ))}
                <Button
                  type="tertiary"
                  icon={<IconPlus />}
                  onClick={addSpecialEventsItem}
                  style={{ width: '100%' }}
                >
                  添加特典会
                </Button>
              </Space>
            </div>
          

          <div>
            <Space style={{ width: '100%', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                onClick={async () => {
                  if (!newEvent.title) {
                    Notification.warning({ title: '请填写演出名称', duration: 3 });
                    return;
                  }
                  if (!newEvent.date) {
                    Notification.warning({ title: '请选择演出日期', duration: 3 });
                    return;
                  }
                  if (!newEvent.startTime) {
                    Notification.warning({ title: '请选择开始时间', duration: 3 });
                    return;
                  }
                  if (!newEvent.location) {
                    Notification.warning({ title: '请填写演出地点', duration: 3 });
                    return;
                  }
                  await handleAddEvent({ ...newEvent });
                  setNewEvent({ title: '', date: null, entryTime: '', startTime: '', location: '' });
                }}
              >
                {editingId ? '更新' : '添加'}
              </Button>
              
            </Space>
          </div>
        </div>
        </Modal>
      )}

      {/* 查看演出详情模态框（受控，不使用静态 API） */}
      {viewEvent && (
        <Modal
          title={viewEvent.title}
          visible={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={null}
          width={500}
        >
          <div>
            {viewEvent.entryTime && <p><IconClock /> 入场时间: {viewEvent.entryTime}</p>}
            <p><IconCalendar /> 日期: {viewEvent.date}</p>
            <p><IconClock /> 开始时间: {viewEvent.startTime}</p>
            <p><IconMapPin /> 地点: {viewEvent.location}</p>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>演出时间表:</div>
              {viewEvent.timeTable.map((item, index) => (
                <div key={index} style={{ 
                  marginBottom: '8px', 
                  padding: '8px', 
                  backgroundColor: 'var(--semi-color-fill-0)', 
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 'bold' }}>{item.group}</div>
                  <div style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
                    {item.startTime} - {item.endTime}
                  </div>
                </div>
              ))}
            </div>
            {viewEvent.specialEvents && viewEvent.specialEvents.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--semi-color-warning)' }}>特典会:</div>
                {viewEvent.specialEvents.map((item, index) => {
                  const isTimeFormat = /^\d{2}:\d{2}$/.test(item.startTime) && /^\d{2}:\d{2}$/.test(item.endTime);
                  const timeDisplay = isTimeFormat ? `${item.startTime} - ${item.endTime}` : item.startTime;
                  return (
                    <div key={index} style={{ 
                      marginBottom: '8px', 
                      padding: '8px', 
                      backgroundColor: 'var(--semi-color-warning-light)', 
                      borderRadius: '4px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>{item.group}</div>
                      <div style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
                        {timeDisplay}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {isEditorMode && (
              <div style={{ marginTop: '16px', textAlign: 'center', paddingBottom: '16px' }}>
                <Space>
                  <Button 
                    type="primary"
                    onClick={() => {
                      // 预填充编辑数据
                      setNewEvent({
                        title: viewEvent.title || '',
                        date: formatDateToYMD(viewEvent.date),
                        entryTime: formatToHHmm(viewEvent.entryTime),
                        startTime: formatToHHmm(viewEvent.startTime),
                        location: viewEvent.location || ''
                      });
                      setTimeTableItems((viewEvent.timeTable || []).map(it => ({
                        group: it.group || '',
                        startTime: formatToHHmm(it.startTime),
                        endTime: formatToHHmm(it.endTime)
                      })));
                      setSpecialEventsItems((viewEvent.specialEvents || []).map(it => ({
                        group: it.group || '',
                        selectedTypes: typeof it.startTime === 'string' ? (it.startTime.split('-').filter(Boolean)) : []
                      })));
                      setEditingId(viewEvent._id);
                      setViewModalVisible(false);
                      setModalVisible(true);
                    }}
                  >
                    更新演出
                  </Button>
                  <Button 
                    type="danger"
                    onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: '确定要删除这个演出吗？此操作不可撤销。',
                        onOk: async () => {
                          try {
                            await deleteSchedule(viewEvent._id);
                            setViewModalVisible(false);
                          } catch (error) {
                          }
                        }
                      });
                    }}
                  >
                    删除演出
                  </Button>
                </Space>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CalendarPage;