// src/config.js

// const ENV = "dev"; // 切换成 "prod" 使用服务器地址
const ENV = "prod"; 

// 获取当前域名
const getCurrentDomain = () => {
  return window.location.hostname;
};

// 域名配置
const DOMAIN_CONFIG = {
  'aidoru.tool4me.cn': {
    name: 'box',
    editorMode: true,
    theme: 'default'
  },
  'diobox.chikaaidoru.cn': {
    name: 'chikaaidoru', 
    editorMode: false,
    theme: 'chika'
  },
  'localhost:5050': {
    name: 'localhost',
    editorMode: true,
    theme: 'default'
  },
};

// 获取当前域名配置
const getCurrentDomainConfig = () => {
  const currentDomain = getCurrentDomain();
  return DOMAIN_CONFIG[currentDomain] || {
    name: 'default',
    editorMode: true,
    theme: 'default'
  }; // 默认配置
};

const config = {
  dev: {
    API_BASE_URL: "http://localhost:5050",
    domainConfig: {
      name: 'dev',
      editorMode: true,
      theme: 'default'
    }
  },
  prod: {
    API_BASE_URL: "https://ttapi.tool4me.cn",
    domainConfig: getCurrentDomainConfig()
  }
};

export default config[ENV];
export { getCurrentDomainConfig, DOMAIN_CONFIG };

