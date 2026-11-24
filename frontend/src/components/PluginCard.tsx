/**
 * 插件卡片组件
 */
import React from 'react'
import { Card, Button, Tag, Space, Tooltip } from 'antd'
import {
  CheckCircleOutlined,
  DownloadOutlined,
  SettingOutlined,
  DeleteOutlined,
  SafetyOutlined,
  ApiOutlined
} from '@ant-design/icons'
import type { Plugin } from '@/stores/usePluginsStore'
import './PluginCard.css'

interface PluginCardProps {
  plugin: Plugin
  onInstall?: (pluginId: string) => void
  onUninstall?: (pluginId: string) => void
  onConfigure?: (pluginId: string) => void
  onAuthorize?: (pluginId: string) => void
}

export default function PluginCard({
  plugin,
  onInstall,
  onUninstall,
  onConfigure,
  onAuthorize
}: PluginCardProps) {
  const renderIcon = () => {
    if (plugin.iconUrl) {
      return (
        <img
          src={plugin.iconUrl}
          alt={plugin.name}
          className="plugin-card-icon-img"
        />
      )
    }

    return (
      <div
        className="plugin-card-icon-text"
        style={{ backgroundColor: plugin.iconColor || '#1890ff' }}
      >
        {plugin.iconText || plugin.name.charAt(0)}
      </div>
    )
  }

  const renderAuthStatus = () => {
    if (plugin.authStatus === 'none') return null

    if (plugin.authStatus === 'authorized') {
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          已授权
        </Tag>
      )
    }

    return (
      <Tag icon={<ApiOutlined />} color="warning">
        需授权
      </Tag>
    )
  }

  const renderActions = () => {
    if (!plugin.installed) {
      return (
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          block
          onClick={() => onInstall?.(plugin.id)}
        >
          安装
        </Button>
      )
    }

    return (
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {plugin.authStatus === 'unauthorized' && (
          <Button
            type="primary"
            icon={<ApiOutlined />}
            block
            onClick={() => onAuthorize?.(plugin.id)}
          >
            授权
          </Button>
        )}

        <Space style={{ width: '100%' }}>
          <Button
            icon={<SettingOutlined />}
            onClick={() => onConfigure?.(plugin.id)}
            style={{ flex: 1 }}
          >
            配置
          </Button>
          <Tooltip title="卸载插件">
            <Button
              icon={<DeleteOutlined />}
              danger
              onClick={() => onUninstall?.(plugin.id)}
            />
          </Tooltip>
        </Space>
      </Space>
    )
  }

  return (
    <Card
      hoverable
      className="plugin-card"
      bodyStyle={{ padding: 16 }}
    >
      <div className="plugin-card-header">
        {renderIcon()}
        <div className="plugin-card-info">
          <div className="plugin-card-title">
            {plugin.name}
            {plugin.featured && (
              <Tag color="gold" style={{ marginLeft: 8 }}>精选</Tag>
            )}
          </div>
          <div className="plugin-card-publisher">
            {plugin.publisherIcon && (
              <img
                src={plugin.publisherIcon}
                alt={plugin.publisher}
                className="plugin-card-publisher-icon"
              />
            )}
            {plugin.publisher}
            {plugin.source === 'official' && (
              <Tooltip title="官方插件">
                <SafetyOutlined style={{ marginLeft: 4, color: '#52c41a' }} />
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <div className="plugin-card-description">
        {plugin.description}
      </div>

      <div className="plugin-card-footer">
        {renderAuthStatus()}
        {plugin.tags && plugin.tags.length > 0 && (
          <Space size={4} wrap>
            {plugin.tags.map(tag => (
              <Tag key={tag} style={{ fontSize: 11 }}>
                {tag}
              </Tag>
            ))}
          </Space>
        )}
      </div>

      <div className="plugin-card-actions">
        {renderActions()}
      </div>
    </Card>
  )
}
