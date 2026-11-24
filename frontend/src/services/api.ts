/**
 * API 服务接口文件（占位）
 * 用于前后端通信
 *
 * TODO: 根据 OpenWorkBuddy 后端 API 规范进行配置
 */

import axios from 'axios';

// 创建 axios 实例
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // TODO: 添加认证 token
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // TODO: 统一错误处理
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// API 接口示例（占位）
export const api = {
  // TODO: 根据实际业务需求添加 API 方法

  // 示例：获取用户信息
  // getUser: () => apiClient.get('/user'),

  // 示例：获取任务列表
  // getTasks: () => apiClient.get('/tasks'),
};

export default api;
