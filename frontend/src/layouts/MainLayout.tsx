import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Badge, Tabs, Tooltip, Modal, Input, Button, message } from 'antd'
import {
  MessageOutlined,
  TeamOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  MobileOutlined,
  SettingOutlined,
  UserOutlined,
  EllipsisOutlined,
  BgColorsOutlined,
  ShoppingCartOutlined,
  BookOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import './MainLayout.css'

const { Sider, Content } = Layout
const { TextArea } = Input

export default function MainLayout() {
  const location = useLocation()
  const [expertTabKey, setExpertTabKey] = useState<'expert' | 'group'>('expert')
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareContent, setShareContent] = useState('')

  const menuItems: MenuProps['items'] = [
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: <Link to="/chat">新任务</Link>
    },
    {
      key: '/experts',
      icon: <TeamOutlined />,
      label: (
        <div className="menu-item-with-badge">
          <Link to="/experts">专家</Link>
          <span className="new-badge">新</span>
        </div>
      )
    },
    {
      key: '/plugins',
      icon: <AppstoreOutlined />,
      label: <Link to="/plugins">插件</Link>
    },
    {
      key: '/tasks',
      icon: <ClockCircleOutlined />,
      label: <Link to="/tasks">定时任务</Link>
    },
    {
      key: '/remote',
      icon: <MobileOutlined />,
      label: <Link to="/remote">手机遥控</Link>
    },
    {
      key: 'more',
      icon: <EllipsisOutlined />,
      label: '更多',
      children: [
        {
          key: '/design',
          icon: <BgColorsOutlined />,
          label: <Link to="/design">设计</Link>
        },
        {
          key: '/procurement',
          icon: <ShoppingCartOutlined />,
          label: <Link to="/procurement">采购</Link>
        },
        {
          key: '/knowledge',
          icon: <BookOutlined />,
          label: <Link to="/knowledge">知识库</Link>
        },
        {
          key: '/lawyer',
          icon: <SafetyOutlined />,
          label: <Link to="/lawyer">律师通道</Link>
        }
      ]
    }
  ]

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => window.location.hash = '/settings'
    }
  ]

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const handleShareSubmit = () => {
    if (!shareContent.trim()) {
      message.warning('请输入分享内容')
      return
    }
    message.success('分享成功！')
    setShareContent('')
    setShareModalOpen(false)
  }

  const handleExpertTabChange = (key: string) => {
    setExpertTabKey(key as 'expert' | 'group')
    if (key === 'expert') {
      window.location.hash = '/experts'
    } else {
      window.location.hash = '/expert-groups'
    }
  }

  return (
    <Layout className="main-layout">
      {/* 左侧边栏 - 260px 带文字 */}
      <Sider
        width={260}
        className="main-sider"
      >
        {/* Logo */}
        <div className="sider-logo">
          <div className="logo-icon">A</div>
          <span className="logo-text">Accio Work</span>
        </div>

        {/* 主菜单 */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="sider-menu"
        />

        {/* 底部专家/专家组切换 */}
        <div className="sider-expert-tabs">
          <Tabs
            activeKey={expertTabKey}
            onChange={handleExpertTabChange}
            items={[
              {
                key: 'expert',
                label: (
                  <span>
                    <TeamOutlined /> 专家
                  </span>
                )
              },
              {
                key: 'group',
                label: (
                  <span>
                    <UsergroupAddOutlined /> 专家组
                  </span>
                )
              }
            ]}
            className="expert-tabs"
          />
          {expertTabKey === 'expert' && (
            <div className="empty-tasks-hint">
              <span>无活跃任务</span>
            </div>
          )}
        </div>

        {/* 分享按钮 */}
        <div className="sider-share">
          <Tooltip title="分享到工作区" placement="top">
            <Button
              type="text"
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              className="share-button"
            >
              分享
            </Button>
          </Tooltip>
        </div>

        {/* 底部用户 */}
        <div className="sider-footer">
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <div className="user-item">
              <Avatar icon={<UserOutlined />} size={32} />
              <span>Accio User</span>
            </div>
          </Dropdown>
        </div>
      </Sider>

      {/* 主内容区 - 不含Header */}
      <Layout className="main-content-layout">
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>

      {/* 分享提示框 */}
      <Modal
        title="分享到工作区"
        open={shareModalOpen}
        onOk={handleShareSubmit}
        onCancel={() => {
          setShareModalOpen(false)
          setShareContent('')
        }}
        okText="分享"
        cancelText="取消"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 8, color: 'var(--color-text-secondary)' }}>
            分享您的想法、文档或链接到工作区
          </p>
          <TextArea
            value={shareContent}
            onChange={(e) => setShareContent(e.target.value)}
            placeholder="输入分享内容..."
            rows={6}
            maxLength={500}
            showCount
          />
        </div>
      </Modal>
    </Layout>
  )
}
