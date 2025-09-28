import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Row, Col, Modal, Form, Input, DatePicker, Notification, Upload, Tag } from '@douyinfe/semi-ui';
import { IconPlus, IconCalendar, IconMapPin, IconClock, IconUser, IconChevronLeft, IconChevronRight, IconClose, IconUpload, IconImage } from '@douyinfe/semi-icons';
import { getCurrentDomainConfig } from '../config';
import config from '../config';
import './CalendarPage.css';

const { Title, Text } = Typography;

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', date: null, location: '', city: '', groups: [], images: [] });
  const [editingId, setEditingId] = useState(null);
  const [imagePreviewVisible, setImagePreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  // 获取编辑者模式状态
  const domainConfig = getCurrentDomainConfig();
  const isEditorMode = domainConfig?.editorMode ?? true;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 将中文标点转换为英文标点
  const convertChinesePunctuation = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    return text
      .replace(/，/g, ',')     // 中文逗号 -> 英文逗号
      .replace(/。/g, '.')     // 中文句号 -> 英文句号
      .replace(/；/g, ';')     // 中文分号 -> 英文分号
      .replace(/：/g, ':')     // 中文冒号 -> 英文冒号
      .replace(/？/g, '?')    // 中文问号 -> 英文问号
      .replace(/！/g, '!')    // 中文感叹号 -> 英文感叹号
      .replace(/"/g, '"')     // 中文左双引号 -> 英文双引号
      .replace(/"/g, '"')     // 中文右双引号 -> 英文双引号
      .replace(/'/g, "'")     // 中文左单引号 -> 英文单引号
      .replace(/'/g, "'")     // 中文右单引号 -> 英文单引号
      .replace(/（/g, '(')     // 中文左括号 -> 英文左括号
      .replace(/）/g, ')')     // 中文右括号 -> 英文右括号
      .replace(/【/g, '[')     // 中文左方括号 -> 英文左方括号
      .replace(/】/g, ']')     // 中文右方括号 -> 英文右方括号
      .replace(/《/g, '<')     // 中文左书名号 -> 英文小于号
      .replace(/》/g, '>')     // 中文右书名号 -> 英文大于号
      .replace(/、/g, ',')     // 中文顿号 -> 英文逗号
      .replace(/…/g, '...')    // 中文省略号 -> 英文省略号
      .replace(/—/g, '-')     // 中文破折号 -> 英文连字符
      .replace(/～/g, '~')     // 中文波浪号 -> 英文波浪号
      .replace(/￥/g, '$')     // 中文人民币符号 -> 英文美元符号
      .replace(/％/g, '%')     // 中文百分号 -> 英文百分号
      .replace(/＋/g, '+')     // 中文加号 -> 英文加号
      .replace(/－/g, '-')     // 中文减号 -> 英文减号
      .replace(/＝/g, '=')     // 中文等号 -> 英文等号
      .replace(/×/g, '*')     // 中文乘号 -> 英文星号
      .replace(/÷/g, '/')     // 中文除号 -> 英文斜杠
      .replace(/＜/g, '<')     // 中文小于号 -> 英文小于号
      .replace(/＞/g, '>')     // 中文大于号 -> 英文大于号
      .replace(/｜/g, '|')     // 中文竖线 -> 英文竖线
      .replace(/＼/g, '\\')    // 中文反斜杠 -> 英文反斜杠
      .replace(/／/g, '/')     // 中文斜杠 -> 英文斜杠
      .replace(/＃/g, '#')     // 中文井号 -> 英文井号
      .replace(/＠/g, '@')     // 中文艾特符号 -> 英文艾特符号
      .replace(/＆/g, '&')     // 中文和号 -> 英文和号
      .replace(/＾/g, '^')     // 中文脱字符 -> 英文脱字符
      .replace(/｛/g, '{')     // 中文左花括号 -> 英文左花括号
      .replace(/｝/g, '}')     // 中文右花括号 -> 英文右花括号
      .replace(/｀/g, '`')     // 中文反引号 -> 英文反引号
      .replace(/～/g, '~');    // 中文波浪号 -> 英文波浪号
  };
  
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

  // 按月份获取演出
  const fetchSchedulesByMonth = async (year, month) => {
    const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
    
    // 检查缓存中是否已有该月份的数据
    if (monthCache.has(yearMonth)) {
      const cachedData = monthCache.get(yearMonth);
      setEvents(cachedData);
      return;
    }

    setLoading(true);
    try {
      const data = await apiCall(`/month/?month=${yearMonth}`);
      
      // 直接使用后端数据，不进行转换
      const formatTimeFromBackend = (timeValue) => {
        
        if (!timeValue) return '';
        return String(timeValue);
      };

      const formattedEvents = (data || []).map(event => ({
        _id: event._id || event.id,
        location: event.location,
        city: event.city,
        date: event.date,
        title: event.title,
        groups: event.groups || [],
        imgs: event.imgs || [],
        timeTable: (event.timetable || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time), // 确保是"14:00"格式
          endTime: formatTimeFromBackend(item.end_time),     // 确保是"14:00"格式
          bonusTime: item.bonus_time || '',                 // 特典时间字符串
          selectedTypes: item.bonus_time ? item.bonus_time.split('-').filter(Boolean) : [] // 特典类型数组
        })),
        updateTime: event.updated_at || event.created_at
      }));
      
      // 将数据存入缓存
      setMonthCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.set(yearMonth, formattedEvents);
        return newCache;
      });
      
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
  const createSchedule = async (formData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/schedule/create/`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.detail || '创建演出失败');
      }

      const data = await response.json();
      
      // 直接使用后端数据，不进行转换
      const formatTimeFromBackend = (timeValue) => {
        if (!timeValue) return '';
        return String(timeValue);
      };

      const formattedEvent = {
        _id: data._id || data.id,
        location: data.location,
        city: data.city,
        date: data.date,
        title: data.title,
        groups: data.groups || [],
        imgs: data.imgs || [],
        timeTable: (data.timetable || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time),
          endTime: formatTimeFromBackend(item.end_time),
          bonusTime: item.bonus_time || '',
          selectedTypes: item.bonus_time ? item.bonus_time.split('-').filter(Boolean) : []
        })),
        updateTime: data.updated_at || data.created_at
      };
      
      setEvents(prev => [...prev, formattedEvent]);
      
      // 清除相关月份的缓存
      const eventDate = new Date(formattedEvent.date);
      const eventYearMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      setMonthCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.delete(eventYearMonth);
        return newCache;
      });
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
  const updateSchedule = async (scheduleId, formData) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/schedule/update/${scheduleId}/`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '更新演出失败');
      }

      const data = await response.json();
      
      // 直接使用后端数据，不进行转换FormData contents
      const formatTimeFromBackend = (timeValue) => {
        if (!timeValue) return '';
        return String(timeValue);
      };

      const formattedEvent = {
        _id: data._id || data.id,
        location: data.location,
        city: data.city,
        date: data.date,
        title: data.title,
        groups: data.groups || [],
        imgs: data.imgs || [],
        timeTable: (data.timetable || []).map(item => ({
          group: item.group,
          startTime: formatTimeFromBackend(item.start_time),
          endTime: formatTimeFromBackend(item.end_time),
          bonusTime: item.bonus_time || '',
          selectedTypes: item.bonus_time ? item.bonus_time.split('-').filter(Boolean) : []
        })),
        updateTime: data.updated_at || data.created_at
      };
      
      setEvents(prev => prev.map(event => event._id === scheduleId ? formattedEvent : event));
      
      // 清除相关月份的缓存
      const eventDate = new Date(formattedEvent.date);
      const eventYearMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
      setMonthCache(prevCache => {
        const newCache = new Map(prevCache);
        newCache.delete(eventYearMonth);
        return newCache;
      });
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
      // 先获取要删除的演出信息，用于清除缓存
      const eventToDelete = events.find(event => event._id === scheduleId);
      
      await apiCall(`/delete/${scheduleId}/`, 'DELETE');
      setEvents(prev => prev.filter(event => event._id !== scheduleId));
      
      // 清除相关月份的缓存
      if (eventToDelete) {
        const eventDate = new Date(eventToDelete.date);
        const eventYearMonth = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
        setMonthCache(prevCache => {
          const newCache = new Map(prevCache);
          newCache.delete(eventYearMonth);
          return newCache;
        });
      }
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

  // 当前显示的月份状态
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // 月份数据缓存
  const [monthCache, setMonthCache] = useState(new Map());

  // 组件挂载时获取数据
  useEffect(() => {
    fetchSchedulesByMonth(currentMonth.year, currentMonth.month);
  }, [currentMonth]);

  // 页面卸载时清除缓存和ObjectURL
  useEffect(() => {
    return () => {
      setMonthCache(new Map());
      
      // 清理所有ObjectURL
      if (newEvent.images) {
        newEvent.images.forEach(img => {
          if (img.url && img.url.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(img.url);
            } catch (error) {
            }
          }
        });
      }
    };
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
    setSelectedDate(date);
  };

  // 处理演出点击
  const handleEventClick = (event) => {
    setViewEvent(event);
    setViewModalVisible(true);
  };

  // 处理图片点击
  const handleImageClick = (img) => {
    setPreviewImage(img);
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
    setImagePreviewVisible(true);
  };

  // 处理图片点击切换缩放
  const handleImageToggleZoom = (e) => {
    e.stopPropagation();
    if (imageScale === 1) {
      setImageScale(2);
      setImagePosition({ x: 0, y: 0 });
    } else {
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // 处理滚轮滚动
  const handleWheel = (e) => {
    e.preventDefault();
    if (imageScale > 1) {
      const deltaY = e.deltaY;
      const newY = imagePosition.y - deltaY * 0.5;
      
      // 获取图片元素（通过查询选择器）
      const imageElement = document.querySelector('img[src*="' + previewImage.url + '"]');
      if (imageElement) {
        const imageHeight = imageElement.naturalHeight * imageScale;
        const viewportHeight = window.innerHeight;
        
        // 限制滚动范围，不超出图片上下边界
        const maxY = Math.max(0, (imageHeight - viewportHeight) / 2);
        const minY = -maxY;
        
        setImagePosition(prev => ({
          x: prev.x,
          y: Math.max(minY, Math.min(maxY, newY))
        }));
      }
    }
  };

  // 设置滚轮事件监听器
  useEffect(() => {
    if (imagePreviewVisible && imageScale > 1) {
      const handleWheelPassive = (e) => {
        handleWheel(e);
      };
      
      // 添加非被动事件监听器
      document.addEventListener('wheel', handleWheelPassive, { passive: false });
      
      return () => {
        document.removeEventListener('wheel', handleWheelPassive);
      };
    }
  }, [imagePreviewVisible, imageScale, imagePosition.y]);

  // 处理拖拽
  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX - imagePosition.x;
    const startY = e.clientY - imagePosition.y;

    const handleMouseMove = (e) => {
      const newX = e.clientX - startX;
      const newY = e.clientY - startY;
      
      // 获取图片元素（通过查询选择器）
      const imageElement = document.querySelector('img[src*="' + previewImage.url + '"]');
      if (imageElement) {
        const imageWidth = imageElement.naturalWidth * imageScale;
        const imageHeight = imageElement.naturalHeight * imageScale;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        const maxX = Math.max(0, (imageWidth - viewportWidth) / 2);
        const minX = -maxX;
        const maxY = Math.max(0, (imageHeight - viewportHeight) / 2);
        const minY = -maxY;
        
        setImagePosition({
          x: Math.max(minX, Math.min(maxX, newX)),
          y: Math.max(minY, Math.min(maxY, newY))
        });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // 添加演出团体
  const addGroup = () => {
    setNewEvent(prev => ({
      ...prev,
      groups: [...prev.groups, { name: '' }]
    }));
  };

  // 删除演出团体
  const removeGroup = (index) => {
    setNewEvent(prev => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== index)
    }));
  };

  // 更新演出团体
  const updateGroup = (index, field, value) => {
    setNewEvent(prev => ({
      ...prev,
      groups: (prev.groups || []).map((group, i) =>
        i === index ? { ...group, [field]: value } : group
      )
    }));
  };

  // 创建图片对象的通用函数
  const createImageObject = (file, fileObj, previewUrl, isExisting = false) => {
    return {
      name: file.name || file.filename,
      url: previewUrl || '',
      file: fileObj,
      content_type: file.type || 'image/jpeg',
      status: file.status || 'done',
      isExisting: isExisting
    };
  };

  // 提取文件对象和预览URL的通用函数
  const extractFileObject = (file) => {
    let fileObj = null;
    let previewUrl = '';
    
    // 方式1: 从 currentFile.fileInstance 获取
    if (file.currentFile && file.currentFile.fileInstance) {
      fileObj = file.currentFile.fileInstance;
      previewUrl = file.currentFile.url || '';
    }
    // 方式2: 从 originFileObj 获取
    else if (file.originFileObj) {
      fileObj = file.originFileObj;
    }
    // 方式3: 从 file 属性获取
    else if (file.file) {
      fileObj = file.file;
    }
    // 方式4: 直接使用 file
    else if (file instanceof File) {
      fileObj = file;
    }
    // 方式5: 从 currentFile 直接获取
    else if (file.currentFile) {
      fileObj = file.currentFile;
      previewUrl = file.currentFile.url || '';
    }
    
    // 方式6: 如果还是没有文件对象，尝试从其他属性获取
    if (!fileObj) {
      // 检查所有可能的文件属性
      const possibleFileProps = ['fileInstance', 'raw', 'originFile', 'fileObj', 'fileData'];
      for (const prop of possibleFileProps) {
        if (file[prop] && (file[prop] instanceof File || file[prop] instanceof Blob)) {
          fileObj = file[prop];
          break;
        }
      }
    }
    
    // 如果没有获取到文件对象，尝试创建预览URL
    if (!previewUrl && fileObj && (fileObj instanceof File || fileObj instanceof Blob)) {
      try {
        previewUrl = URL.createObjectURL(fileObj);
      } catch (error) {
        previewUrl = '';
      }
    }
    
    // 如果还是没有预览URL，使用文件自带的URL
    if (!previewUrl && file.url) {
      previewUrl = file.url;
    }
    
    return {
      fileObj,
      previewUrl
    };
  };

  // 处理图片上传
  const handleImageUpload = (fileList) => {
    // 处理 Semi UI 的文件列表结构
    let files = [];
    
    if (fileList && typeof fileList === 'object') {
      // 如果 fileList 有 fileList 属性，使用它
      if (fileList.fileList && Array.isArray(fileList.fileList)) {
        files = fileList.fileList;
      }
      // 如果 fileList 有 currentFile 属性，使用它
      else if (fileList.currentFile) {
        files = [fileList.currentFile];
      }
      // 如果 fileList 本身就是数组
      else if (Array.isArray(fileList)) {
        files = fileList;
      }
    }
    
    // 获取当前已存在的图片
    const existingImages = (newEvent.images || []).filter(img => img.isExisting);
    
    // 如果是创建模式（没有已存在的图片），直接处理所有文件
    if (existingImages.length === 0) {
      const convertedImages = files.map((file) => {
        const { fileObj, previewUrl } = extractFileObject(file);
        return createImageObject(file, fileObj, previewUrl, false);
      });
      
      setNewEvent(prev => ({
        ...prev,
        images: convertedImages
      }));
      return;
    }
    
    // 更新模式：只处理新文件
    const currentNewImages = (newEvent.images || []).filter(img => !img.isExisting);
    const currentNewFileNames = currentNewImages.map(img => img.name);
    
    const trulyNewFiles = files.filter(file => {
      const fileName = file.name || file.filename;
      return !currentNewFileNames.includes(fileName);
    });
    
    if (trulyNewFiles.length === 0) {
      return;
    }
    
    const newConvertedImages = trulyNewFiles.map((file) => {
      const { fileObj, previewUrl } = extractFileObject(file);
      return createImageObject(file, fileObj, previewUrl, false);
    });
    
    // 合并所有图片
    const allImages = [...existingImages, ...currentNewImages, ...newConvertedImages];
    
    setNewEvent(prev => ({
      ...prev,
      images: allImages
    }));
  };

  // 删除演出图片
  const deleteScheduleImage = async (scheduleId, imageName) => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/schedule/${scheduleId}/imageDelete/${imageName}/`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除图片失败');
      }

      Notification.success({
        title: '删除成功',
        content: '图片已删除',
        duration: 3,
      });
    } catch (error) {
      Notification.error({
        title: '删除失败',
        content: error.message || '未知错误',
        duration: 3,
      });
      throw error;
    }
  };

  // 删除图片
  const removeImage = async (index) => {
    const removedImage = newEvent.images[index];
    
    // 如果是更新模式且删除的是已存在的图片，需要调用后端API删除
    if (editingId && removedImage && removedImage.isExisting) {
      try {
        await deleteScheduleImage(editingId, removedImage.filename || removedImage.name);
      } catch (error) {
        // 如果API调用失败，不删除本地图片
        return;
      }
    }
    
    setNewEvent(prev => {
      const newImages = [...prev.images];
      
      // 释放ObjectURL避免内存泄漏（仅对新上传的图片）
      if (removedImage && !removedImage.isExisting && removedImage.url && removedImage.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(removedImage.url);
        } catch (error) {
        }
      }
      
      return {
        ...prev,
        images: newImages.filter((_, i) => i !== index)
      };
    });
  };

  // 添加新演出
  const handleAddEvent = async (values) => {
    try {
      // 处理日期格式，统一为 YYYY-MM-DD
      const dateStr = formatDateToYMD(values.date);
      if (!dateStr) throw new Error('日期字段不能为空');
      
      // 统一时间格式为 HH:mm
      const formatTime = (timeValue) => {
        const v = formatToHHmm(timeValue);
        return v;
      };
      
      // 创建 FormData 对象
      const formData = new FormData();
      
      // 添加基本字段
      formData.append('city', String(convertChinesePunctuation(String(values.city || '上海'))));
      formData.append('location', String(convertChinesePunctuation(String(values.location || ''))));
      formData.append('date', String(dateStr));
      formData.append('title', String(convertChinesePunctuation(String(values.title || ''))));
      
      // 添加演出团体 - 允许为空数组，直接传递团体名字符串数组
      const groups = (values.groups || []).map(group => 
        convertChinesePunctuation(String(group.name || ''))
      ).filter(name => name.trim() !== ''); // 过滤掉空字符串
      
      // groups可以为空数组，直接发送字符串数组
      groups.forEach(group => {
        formData.append('groups', group);
      });
      
      // 添加图片文件 - 后端从 request.FILES.getlist("imgs") 获取
      (newEvent.images || []).forEach((img) => {
        // 只处理有文件对象的图片（新上传的图片）
        if (img.file && (img.file instanceof File || img.file instanceof Blob)) {
          const fileName = img.name || img.filename || `file_${Date.now()}`;
          formData.append('imgs', img.file, fileName);
        }
      });
      
      // 添加所有图片的完整信息（包括已存在的和新上传的）
      const allImages = (newEvent.images || []).map(img => ({
        filename: img.filename || img.name || `file_${Date.now()}`, // 确保有文件名
        url: img.isExisting ? img.originalUrl : img.url, // 新上传的图片使用预览URL
        isExisting: img.isExisting,
        content_type: img.content_type
      }));
      
      formData.append('images_info', JSON.stringify(allImages));
      
      if (editingId) {
        await updateSchedule(editingId, formData);
      } else {
        await createSchedule(formData);
      }
      setModalVisible(false);
      setEditingId(null);
      
      // 清空表单状态
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
                    setNewEvent({ title: '', date: formatDateToYMD(selectedDate), location: '', city: '', groups: [], images: [] });
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
                      onClick={() => {
                        const now = new Date();
                        setSelectedDate(now);
                        setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
                      }}
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
                    setCurrentMonth({ year: newDate.getFullYear(), month: newDate.getMonth() + 1 });
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
                    setCurrentMonth({ year: newDate.getFullYear(), month: newDate.getMonth() + 1 });
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
                        <IconCalendar /> {event.date}
                      </div>
                      <div className="event-detail">
                        <IconMapPin /> {event.location}
                      </div>
                      <div className="event-detail">
                        <IconUser /> {event.groups ? event.groups.length : 0} 个团体
                      </div>
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
            setNewEvent({ title: '', date: null, location: '', city: '', groups: [], images: [] });
            setEditingId(null);
          }}
          footer={null}
          width={800}
        >
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
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>演出地点 *</label>
          </div>
          <Input
            placeholder="请输入演出地点"
            value={newEvent.location}
            onChange={val => setNewEvent(prev => ({ ...prev, location: val }))}
            style={{ marginBottom: '16px' }}
          />
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontWeight: 600, color: 'var(--semi-color-text-0)' }}>城市</label>
            <span style={{ fontSize: '12px', color: 'var(--semi-color-text-2)', marginLeft: '4px' }}>（可选）</span>
          </div>
          <Input
            placeholder="请输入城市"
            value={newEvent.city}
            onChange={val => setNewEvent(prev => ({ ...prev, city: val }))}
            style={{ marginBottom: '20px' }}
          />
          
          {/* 演出团体 */}
          <div style={{ fontWeight: 600, margin: '8px 0' }}>演出团体 <span style={{ fontSize: '12px', color: 'var(--semi-color-text-2)', marginLeft: '4px' }}>（可选）</span></div>
            <div style={{ marginBottom: '16px' }}>
              <Space vertical style={{ width: '100%' }}>
              {(newEvent.groups || []).map((group, index) => (
                <Card key={index} size="small" style={{ backgroundColor: 'var(--semi-color-fill-0)', width: '100%' }}>
                 <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                     <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '4px' }}>团体名称</label>
                      <Input
                       placeholder="请输入团体名称"
                       style={{ width: '300px' }}
                       value={group.name}
                       onChange={val => updateGroup(index, 'name', val)}
                     />
                   </div>
                      <Button
                        type="tertiary"
                        icon={<IconClose />}
                        size="small"
                     onClick={() => removeGroup(index)}
                     style={{ marginTop: '20px' }}
                      />
                    </Space>
                  </Card>
                ))}
                <Button
                  type="tertiary"
                  icon={<IconPlus />}
                onClick={addGroup}
                  style={{ width: '100%' }}
                >
                添加演出团体
                </Button>
              </Space>
            </div>
          
          {/* 演出图片 */}
          <div style={{ fontWeight: 600, margin: '8px 0' }}>演出图片</div>
          
          {/* 显示已存在的图片 */}
          {newEvent.images && newEvent.images.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--semi-color-text-1)', marginBottom: '8px' }}>
                当前图片 ({newEvent.images.length}张)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                {newEvent.images.map((img, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img 
                      src={img.url}
                      alt={img.name}
                      style={{ 
                        width: '100%', 
                        height: '100px', 
                        objectFit: 'cover', 
                        borderRadius: '4px',
                        border: '1px solid var(--semi-color-border)'
                      }}
                    />
                    <Button
                      type="tertiary"
                      icon={<IconClose />}
                      size="small"
                      onClick={() => removeImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        border: 'none',
                        minWidth: '20px',
                        height: '20px',
                        padding: '0'
                      }}
                    />
                    {img.isExisting && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 4px',
                        borderRadius: '2px'
                      }}>
                        已存在
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 上传新图片 */}
          <div style={{ marginBottom: '16px' }}>
            <Upload
              accept="image/*"
              multiple
              action=""
              showUploadList={{
                showRemoveIcon: true,
                showPreviewIcon: true,
                showDownloadIcon: false
              }}
              beforeUpload={() => false}
              onChange={(fileList, file) => {
                handleImageUpload(fileList);
              }}
              onFileChange={(fileList, file) => {
                handleImageUpload(fileList);
              }}
            >
              <div style={{ 
                border: '2px dashed var(--semi-color-border)',
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                <IconUpload size="large" style={{ color: 'var(--semi-color-primary)', marginBottom: '8px' }} />
                <div>
                  <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                    点击或拖拽上传演出图片
                  </Text>
                  <Text type="tertiary" style={{ fontSize: '12px' }}>
                    支持 JPG、PNG、GIF 格式，可上传多张图片
                  </Text>
                </div>
              </div>
            </Upload>
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
                  await handleAddEvent({ ...newEvent });
                  setNewEvent({ title: '', date: null, location: '', city: '', groups: [], images: [] });
                }}
              >
                {editingId ? '更新' : '添加'}
              </Button>
              
            </Space>
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
          width={600}
        >
          <div>
            <p><IconCalendar /> 日期: {viewEvent.date}</p>
            <p><IconMapPin /> 地点: {viewEvent.location}</p>
            {viewEvent.city && <p><IconMapPin /> 城市: {viewEvent.city}</p>}
            
            {/* 演出团体 */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>演出团体:</div>
              {viewEvent.groups && viewEvent.groups.length > 0 ? (
                <Space wrap>
                  {viewEvent.groups.map((group, index) => (
                    <Tag key={index} color="blue" size="large">
                      {typeof group === 'string' ? group : group.name}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="tertiary">暂无演出团体</Text>
              )}
            </div>
            
            {/* 演出图片 */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>演出图片:</div>
              {viewEvent.imgs && viewEvent.imgs.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {viewEvent.imgs.map((img, index) => (
                    <div key={index} style={{ position: 'relative' }}>
                      {img.url ? (
                        <img 
                          src={`${config.API_BASE_URL}${img.url}`}
                          alt={img.filename}
                          onClick={() => handleImageClick(img)}
                          style={{ 
                            width: '100%', 
                            height: '120px', 
                            objectFit: 'cover', 
                            borderRadius: '8px',
                            border: '1px solid var(--semi-color-border)',
                            cursor: 'pointer'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '120px',
                          backgroundColor: 'var(--semi-color-fill-0)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1px solid var(--semi-color-border)'
                        }}>
                          <IconImage size="large" style={{ color: 'var(--semi-color-text-2)' }} />
                        </div>
                      )}
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        textAlign: 'center',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {img.filename}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Text type="tertiary">暂无演出图片</Text>
              )}
            </div>
            
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
                        location: viewEvent.location || '',
                        city: viewEvent.city || '',
                        groups: (viewEvent.groups || []).map(group => ({
                          name: typeof group === 'string' ? group : group.name
                        })),
                        images: (viewEvent.imgs || []).map(img => ({
                          name: img.filename,
                          url: `${config.API_BASE_URL}${img.url}`,
                          content_type: img.content_type,
                          status: 'done',
                          isExisting: true, // 标记为已存在的图片
                          originalUrl: img.url, // 保存原始URL用于更新
                          filename: img.filename // 保存文件名
                        }))
                      });
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

      {/* 图片预览层 - 支持放大和滚动 */}
      {imagePreviewVisible && previewImage && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            overflow: 'hidden'
          }}
          onClick={() => {
            setImagePreviewVisible(false);
            setPreviewImage(null);
          }}
        >
          <img 
            src={`${config.API_BASE_URL}${previewImage.url}`}
            alt={previewImage.filename}
            style={{ 
              maxWidth: '100vw',
              maxHeight: '100vh',
              objectFit: 'contain',
              cursor: imageScale === 1 ? 'zoom-in' : 'grab',
              transform: `scale(${imageScale}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s ease-out'
            }}
            onClick={handleImageToggleZoom}
            onMouseDown={imageScale > 1 ? handleMouseDown : undefined}
            draggable={false}
          />
        </div>
      )}
    </div>
  );
};

export default CalendarPage;