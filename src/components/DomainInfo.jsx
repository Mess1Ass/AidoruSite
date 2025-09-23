import React from 'react';
import { getCurrentDomainConfig } from '../config';

const DomainInfo = () => {
  const domainConfig = getCurrentDomainConfig();
  
  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      left: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      display: process.env.NODE_ENV === 'development' ? 'block' : 'none'
    }}>
      <div>域名: {window.location.hostname}</div>
      <div>配置: {domainConfig.name}</div>
      <div>主题: {domainConfig.theme}</div>
      <div>编辑者模式: {domainConfig.editorMode ? '是' : '否'}</div>
    </div>
  );
};

export default DomainInfo; 