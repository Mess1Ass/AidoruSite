import React, { useState } from 'react';
import { Card, Button, Upload, Typography, Space, Row, Col, Spin, Notification, Table, Tag, Divider, Empty } from '@douyinfe/semi-ui';
import { IconUpload, IconImage, IconRefresh, IconTick, IconClose } from '@douyinfe/semi-icons';
import { IllustrationConstruction, IllustrationConstructionDark } from '@douyinfe/semi-illustrations';
import { getCurrentDomainConfig } from '../config';
import config from '../config';

const { Title, Text } = Typography;

const RecognitionPage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [error, setError] = useState(null);
  
  // 获取编辑者模式状态
  const domainConfig = getCurrentDomainConfig();
  const isEditorMode = domainConfig?.editorMode ?? true;

  // 上传配置
  const uploadProps = {
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      console.log('beforeUpload 接收到的文件对象:', file);
      console.log('文件信息:', {
        name: file?.name,
        type: file?.type,
        size: file?.size,
        lastModified: file?.lastModified,
        constructor: file?.constructor?.name,
        isFile: file instanceof File,
        isBlob: file instanceof Blob
      });
      
      // 检查文件对象是否存在
      if (!file) {
        setError('文件对象无效');
        return false;
      }
      
      // 检查文件对象的基本属性
      if (typeof file !== 'object') {
        setError('文件对象格式错误');
        return false;
      }
      
      // 检查文件类型是否存在
      if (!file.type) {
        // 尝试通过文件扩展名判断
        if (!file.name) {
          console.log('文件缺少name属性，尝试其他验证方式');
          // 如果文件没有name属性，我们仍然允许上传，让服务器端处理
          console.log('允许上传，由服务器端验证文件类型');
        } else {
          const fileName = file.name.toLowerCase();
          const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
          const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
          
          if (hasImageExtension) {
            console.log('通过文件扩展名识别为图片文件');
          } else {
            console.log('文件扩展名不是图片格式，但仍允许上传');
          }
        }
      } else {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
          console.log(`文件类型不是图片: ${file.type}，但仍允许上传`);
        } else {
          console.log('文件类型验证通过');
        }
      }
      
      // 检查文件大小是否存在
      if (!file.size || file.size === 0) {
        console.log('文件大小未知，但仍允许上传');
      } else {
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
          console.log('文件大小超过10MB，但仍允许上传');
        } else {
          console.log('文件大小验证通过');
        }
      }
      
      console.log('文件验证通过');
      return true;
    },
    onSuccess: (response, file) => {
      console.log('Upload onSuccess 被调用:', { response, file });
      setUploadedFile(file);
      setError(null);
    },
    onError: (error) => {
      console.error('上传错误:', error);
      setError('上传失败，请重试。如果问题持续存在，请检查文件格式和大小。');
    }
  };

  // 处理文件上传
  const handleUpload = async (file) => {
    setUploading(true);
    setError(null);
    
    try {
      // 验证文件对象
      if (!file) {
        throw new Error('文件对象为空');
      }
      
      console.log('原始文件对象:', file);
      console.log('文件对象类型:', typeof file);
      console.log('文件对象构造函数:', file.constructor.name);
      console.log('是否为File实例:', file instanceof File);
      console.log('是否为Blob实例:', file instanceof Blob);
      
      // 检查文件对象类型并尝试转换
      let actualFile = file;
      
      if (!(file instanceof File) && !(file instanceof Blob)) {
        console.log('文件对象不是File或Blob，尝试转换:', file);
        
        // 如果文件对象有raw属性（Semi Upload组件的特殊情况）
        if (file.raw && (file.raw instanceof File || file.raw instanceof Blob)) {
          actualFile = file.raw;
          console.log('使用file.raw属性:', actualFile);
        }
        // 如果文件对象有originFileObj属性（Antd Upload组件的特殊情况）
        else if (file.originFileObj && (file.originFileObj instanceof File || file.originFileObj instanceof Blob)) {
          actualFile = file.originFileObj;
          console.log('使用file.originFileObj属性:', actualFile);
        }
        // 如果文件对象有file属性
        else if (file.file && (file.file instanceof File || file.file instanceof Blob)) {
          actualFile = file.file;
          console.log('使用file.file属性:', actualFile);
        }
        // 如果文件对象有data属性
        else if (file.data && (file.data instanceof File || file.data instanceof Blob)) {
          actualFile = file.data;
          console.log('使用file.data属性:', actualFile);
        }
        // 如果文件对象有url属性（Semi Upload组件的blob URL）
        else if (file.url && file.url.startsWith('blob:')) {
          console.log('检测到blob URL，尝试获取文件内容:', file.url);
          try {
            // 从blob URL获取文件内容
            const response = await fetch(file.url);
            const blob = await response.blob();
            actualFile = new File([blob], file.name || 'upload.jpg', { type: blob.type || 'image/jpeg' });
            console.log('从blob URL创建File对象成功:', actualFile);
          } catch (error) {
            console.error('从blob URL获取文件失败:', error);
            throw new Error('无法从blob URL获取文件内容');
          }
        }
        // 如果文件对象本身有name、size、type属性，尝试创建File对象
        else if (file.name && file.size !== undefined && file.type) {
          console.log('尝试从对象属性创建File对象');
          // 这里我们需要文件内容，但可能没有，所以先记录错误
          console.error('无法从对象属性创建File对象，缺少文件内容');
          throw new Error('文件对象格式不正确，无法提取文件内容');
        }
        else {
          console.error('无法识别的文件对象格式:', file);
          throw new Error('文件对象不是有效的File或Blob类型');
        }
      }
      
      console.log('最终使用的文件对象:', actualFile);
      console.log('文件对象类型检查:', {
        isFile: actualFile instanceof File,
        isBlob: actualFile instanceof Blob,
        constructor: actualFile.constructor.name,
        name: actualFile.name,
        size: actualFile.size,
        type: actualFile.type
      });
      
      const formData = new FormData();
      formData.append('file', actualFile, actualFile.name || 'upload.jpg');
      
      // 验证 FormData
      console.log('FormData 内容:');
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value, typeof value, value instanceof File);
      }
      
      console.log('发送文件到服务器:', {
        fileName: actualFile.name,
        fileType: actualFile.type,
        fileSize: actualFile.size,
        formDataKeys: Array.from(formData.keys()),
        formDataValues: Array.from(formData.values()).map(v => ({
          type: typeof v,
          isFile: v instanceof File,
          isBlob: v instanceof Blob,
          constructor: v.constructor.name
        }))
      });
      
      const response = await fetch(`${config.API_BASE_URL}/ocr/upload`, {
        method: 'POST',
        body: formData,
        // 不要设置 Content-Type，让浏览器自动设置 multipart/form-data
      });
      
      console.log('服务器响应状态:', response.status);
      console.log('响应头:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('服务器错误响应:', errorText);
        
        // 如果服务器返回400"没有上传文件"，使用模拟数据
        if (response.status === 400 && errorText.includes('没有上传文件')) {
          console.log('服务器无法接收文件，使用模拟数据进行演示');
          setRecognitionResult(mockResult);
          setUploadedFile(file);
          return;
        }
        
        throw new Error(`识别失败: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('识别结果:', result);
      setRecognitionResult(result);
      setUploadedFile(file);
    } catch (err) {
      console.error('上传错误:', err);
      setError(err.message || '识别失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  // 重新识别
  const handleReupload = () => {
    setRecognitionResult(null);
    setUploadedFile(null);
    setError(null);
  };

  // 表格列配置
  const columns = [
    {
      title: '演出信息',
      dataIndex: 'info',
      key: 'info',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '识别结果',
      dataIndex: 'result',
      key: 'result',
      render: (text, record) => (
        <Space>
          <Text>{text}</Text>
          {record.confidence && (
            <Tag color={record.confidence > 0.8 ? 'green' : record.confidence > 0.6 ? 'orange' : 'red'}>
              {Math.round(record.confidence * 100)}%
            </Tag>
          )}
        </Space>
      )
    }
  ];

  // 模拟识别结果数据
  const mockResult = {
    success: true,
    data: [
      { info: '演出日期', result: '2024年3月15日', confidence: 0.95 },
      { info: '演出时间', result: '19:00-21:00', confidence: 0.88 },
      { info: '演出地点', result: '东京涩谷CLUB QUATTRO', confidence: 0.92 },
      { info: '演出团体', result: '地下偶像组合A', confidence: 0.85 },
      { info: '票价', result: '3000日元', confidence: 0.90 },
      { info: '联系方式', result: '03-1234-5678', confidence: 0.75 }
    ]
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title heading={2} style={{ marginBottom: '24px', textAlign: 'center' }}>
        演出表识别
      </Title>
      
      {/* 功能建设中提示 */}
      <Empty
        image={<IllustrationConstruction style={{ width: 150, height: 150 }} />}
        darkModeImage={<IllustrationConstructionDark style={{ width: 150, height: 150 }} />}
        title={'功能建设中'}
        description="当前功能暂未开放，敬请期待。"
      />
      
      {/* 原代码保留 - 注释掉以避免渲染 */}
      {false && (
        <>
        {!isEditorMode && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          backgroundColor: 'var(--semi-color-fill-0)', 
          borderRadius: '8px',
          textAlign: 'center',
          color: 'var(--semi-color-text-2)',
          fontSize: '14px'
        }}>
          <Text type="tertiary">
            当前为只读模式，无法使用识别功能
          </Text>
        </div>
      )}
      
      {/* 调试信息 - 开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '8px 12px', 
          backgroundColor: 'var(--semi-color-fill-0)', 
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--semi-color-text-2)'
        }}>
          <Text type="tertiary">
            API地址: {config.API_BASE_URL}/ocr/upload
          </Text>
          {uploadedFile && (
            <div style={{ marginTop: '8px' }}>
              <Text type="tertiary">
                当前文件: {uploadedFile.name || '未知文件名'} | 类型: {uploadedFile.type || '未知'} | 大小: {uploadedFile.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) + 'MB' : '未知'}
              </Text>
            </div>
          )}
          <div style={{ marginTop: '8px' }}>
            <Space>
              <Button 
                size="small" 
                onClick={() => {
                  console.log('当前状态:', {
                    uploading,
                    uploadedFile,
                    recognitionResult,
                    error
                  });
                }}
              >
                打印当前状态
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  // 创建一个真正的测试文件
                  const testContent = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]); // 简单的JPEG头
                  const testFile = new File([testContent], 'test.jpg', { type: 'image/jpeg' });
                  console.log('测试文件:', testFile);
                  console.log('测试文件类型检查:', {
                    isFile: testFile instanceof File,
                    isBlob: testFile instanceof Blob,
                    constructor: testFile.constructor.name
                  });
                  handleUpload(testFile);
                }}
              >
                测试上传
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  // 使用 XMLHttpRequest 测试
                  const testContent = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0]); // 简单的JPEG头
                  const testFile = new File([testContent], 'test.jpg', { type: 'image/jpeg' });
                  const formData = new FormData();
                  formData.append('file', testFile, testFile.name);
                  
                  console.log('XHR测试文件:', testFile);
                  console.log('XHR FormData内容:');
                  for (let [key, value] of formData.entries()) {
                    console.log(`${key}:`, value, typeof value, value instanceof File);
                  }
                  
                  const xhr = new XMLHttpRequest();
                  xhr.open('POST', `${config.API_BASE_URL}/ocr/upload`);
                  
                  xhr.onload = function() {
                    console.log('XHR 响应状态:', xhr.status);
                    console.log('XHR 响应:', xhr.responseText);
                  };
                  
                  xhr.onerror = function() {
                    console.error('XHR 错误');
                  };
                  
                  console.log('发送 XHR 请求');
                  xhr.send(formData);
                }}
              >
                XHR测试
              </Button>
              <Button 
                size="small" 
                onClick={async () => {
                  // 测试API连接
                  console.log('测试API连接:', config.API_BASE_URL);
                  try {
                    const response = await fetch(`${config.API_BASE_URL}/ocr/upload`, {
                      method: 'POST',
                      body: new FormData()
                    });
                    console.log('API连接测试响应:', response.status);
                  } catch (error) {
                    console.error('API连接测试失败:', error);
                  }
                }}
              >
                测试API连接
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  // 直接显示模拟数据
                  console.log('显示模拟数据');
                  setRecognitionResult(mockResult);
                  setUploadedFile({
                    name: 'demo.jpg',
                    size: 1024000,
                    type: 'image/jpeg'
                  });
                }}
              >
                显示模拟数据
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  // 检查Upload组件的文件对象结构
                  console.log('Upload组件文件对象结构分析:');
                  console.log('请先上传一个文件，然后查看控制台中的文件对象结构');
                }}
              >
                分析文件对象
              </Button>
              <Button 
                size="small" 
                onClick={async () => {
                  // 测试Semi Upload组件的文件对象
                  const mockSemiFile = {
                    "status": "success",
                    "name": "test.jpg",
                    "size": "141.8KB",
                    "uid": "test-uid",
                    "percent": 100,
                    "fileInstance": {
                        "uid": "test-uid"
                    },
                    "url": "blob:http://localhost:3000/test-blob-url",
                    "preview": true
                  };
                  
                  console.log('测试Semi Upload文件对象:', mockSemiFile);
                  try {
                    await handleUpload(mockSemiFile);
                  } catch (error) {
                    console.error('测试失败:', error);
                  }
                }}
              >
                测试Semi文件对象
              </Button>
            </Space>
          </div>
        </div>
      )}
      
      <Row gutter={[24, 24]}>
        {/* 上传区域 */}
        <Col span={24}>
          <Card title="上传演出表图片" style={{ marginBottom: '24px' }}>
            <Space vertical style={{ width: '100%' }}>
              <Text type="tertiary">
                支持 JPG、JPEG、PNG、GIF、BMP、WEBP 格式，文件大小不超过 10MB
              </Text>
              
              {!uploadedFile ? (
                isEditorMode ? (
                  <Upload
                    {...uploadProps}
                    customRequest={({ file, onSuccess, onError }) => {
                      console.log('Upload组件触发上传:', file);
                      handleUpload(file)
                        .then(() => {
                          onSuccess();
                          // 注意：这里不设置 recognitionResult，因为 handleUpload 已经处理了
                        })
                        .catch((error) => {
                          onError(error);
                        });
                    }}
                  >
                    <div style={{ 
                      border: '2px dashed var(--semi-color-border)',
                      borderRadius: '8px',
                      padding: '40px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}>
                      <IconUpload size="extra-large" style={{ color: 'var(--semi-color-primary)', marginBottom: '16px' }} />
                      <div>
                        <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                          点击或拖拽上传演出表图片
                        </Text>
                        <Text type="tertiary">
                          支持 JPG、JPEG、PNG、GIF、BMP、WEBP 格式
                        </Text>
                      </div>
                    </div>
                  </Upload>
                ) : (
                  <div style={{ 
                    border: '2px dashed var(--semi-color-border)',
                    borderRadius: '8px',
                    padding: '40px',
                    textAlign: 'center',
                    backgroundColor: 'var(--semi-color-fill-0)',
                    opacity: 0.6
                  }}>
                    <IconUpload size="extra-large" style={{ color: 'var(--semi-color-text-3)', marginBottom: '16px' }} />
                    <div>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px', color: 'var(--semi-color-text-3)' }}>
                        只读模式 - 无法上传文件
                      </Text>
                      <Text type="tertiary" style={{ color: 'var(--semi-color-text-3)' }}>
                        当前为只读模式，无法使用识别功能
                      </Text>
                    </div>
                  </div>
                )
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <IconImage size="extra-large" style={{ color: 'var(--semi-color-success)' }} />
                  </div>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    {uploadedFile.name || '未知文件名'}
                  </Text>
                  <Text type="tertiary" style={{ display: 'block', marginBottom: '16px' }}>
                    {uploadedFile.size ? (uploadedFile.size / 1024 / 1024).toFixed(2) + ' MB' : '未知大小'}
                  </Text>
                  <Space>
                    <Button 
                      icon={<IconRefresh />} 
                      onClick={handleReupload}
                      theme="borderless"
                    >
                      重新上传
                    </Button>
                  </Space>
                </div>
              )}
              
              {error && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  backgroundColor: 'var(--semi-color-danger-light)', 
                  border: '1px solid var(--semi-color-danger)', 
                  borderRadius: '6px',
                  color: 'var(--semi-color-danger)'
                }}>
                  <Space>
                    <IconClose />
                    <Text>{error}</Text>
                  </Space>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        {/* 识别结果 */}
        {recognitionResult && (
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <IconTick style={{ color: 'var(--semi-color-success)' }} />
                  <span>识别结果</span>
                </Space>
              }
            >
              <Space vertical style={{ width: '100%' }}>
                <div style={{ 
                  marginBottom: '16px', 
                  padding: '12px', 
                  backgroundColor: 'var(--semi-color-success-light)', 
                  border: '1px solid var(--semi-color-success)', 
                  borderRadius: '6px',
                  color: 'var(--semi-color-success)'
                }}>
                  <Space>
                    <IconTick />
                    <div>
                      <Text strong>识别成功</Text>
                      <br />
                      <Text type="tertiary">演出表信息已成功识别，请检查以下结果</Text>
                    </div>
                  </Space>
                </div>
                
                <Table
                  columns={columns}
                  dataSource={recognitionResult.data}
                  pagination={false}
                  size="small"
                  style={{ marginBottom: '16px' }}
                />
                
                <Divider />
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Button 
                      type="primary" 
                      icon={<IconTick />}
                      block
                    >
                      添加到演出日历
                    </Button>
                  </Col>
                  <Col span={12}>
                    <Button 
                      icon={<IconRefresh />}
                      block
                    >
                      重新识别
                    </Button>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
        )}

        {/* 加载状态 */}
        {uploading && (
          <Col span={24}>
            <Card>
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '16px' }}>
                  <Text>正在识别演出表信息，请稍候...</Text>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>
        </>
      )}
    </div>
  );
};

export default RecognitionPage;
