import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import router from './router'
import './styles/index.css'

// Ant Design 主题配置（Accio Work 风格）
const accioTheme = {
  token: {
    colorPrimary: '#1ead6f',
    colorSuccess: '#22891f',
    colorWarning: '#ff8800',
    colorError: '#e52828',
    colorInfo: '#5341e3',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Noto Sans, -apple-system, BlinkMacSystemFont, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif',
  },
  algorithm: theme.defaultAlgorithm,
}

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <React.StrictMode>
    <ConfigProvider theme={accioTheme} locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </React.StrictMode>
)
