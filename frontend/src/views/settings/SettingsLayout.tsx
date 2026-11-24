import React from 'react'
import { Layout, Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  UserOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  ApiOutlined,
  GlobalOutlined,
  MobileOutlined,
  ShopOutlined
} from '@ant-design/icons'
import './SettingsLayout.css'

const { Sider, Content } = Layout

export default function SettingsLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/settings/profile',
      icon: <UserOutlined />,
      label: '个人资料'
    },
    {
      key: '/settings/preferences',
      icon: <SettingOutlined />,
      label: '偏好设置'
    },
    {
      key: '/settings/shortcuts',
      icon: <ThunderboltOutlined />,
      label: '快捷键'
    },
    {
      key: '/settings/system',
      icon: <DesktopOutlined />,
      label: '系统设置'
    },
    {
      key: '/settings/mcp',
      icon: <ApiOutlined />,
      label: 'MCP'
    },
    {
      key: '/settings/browser',
      icon: <GlobalOutlined />,
      label: '浏览器'
    },
    {
      key: '/settings/remote',
      icon: <MobileOutlined />,
      label: '手机遥控'
    },
    {
      key: '/settings/shop',
      icon: <ShopOutlined />,
      label: '店铺管理'
    }
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
  }

  return (
    <Layout className="settings-layout">
      <Sider width={200} className="settings-sider">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Content className="settings-content">
        <div className="settings-content-wrapper">
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
}
