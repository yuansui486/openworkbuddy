import React from 'react'
import { Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  PlusOutlined,
  ApiOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  AudioOutlined
} from '@ant-design/icons'
import './ChatInputToolbar.css'

interface ChatInputToolbarProps {
  onAddFile?: () => void
  onPluginSelect?: (pluginId: string) => void
  onPermissionChange?: (level: string) => void
  onAutoComplete?: () => void
  onVoiceInput?: () => void
}

export default function ChatInputToolbar({
  onAddFile,
  onPluginSelect,
  onPermissionChange,
  onAutoComplete,
  onVoiceInput
}: ChatInputToolbarProps) {
  const pluginMenuItems: MenuProps['items'] = [
    {
      key: 'sourcing',
      label: '采购工具',
      icon: <ApiOutlined />
    },
    {
      key: 'analytics',
      label: '数据分析',
      icon: <ApiOutlined />
    },
    {
      key: 'content',
      label: '文案生成',
      icon: <ApiOutlined />
    }
  ]

  const permissionMenuItems: MenuProps['items'] = [
    {
      key: 'full',
      label: '完全权限'
    },
    {
      key: 'limited',
      label: '受限权限'
    },
    {
      key: 'readonly',
      label: '只读模式'
    }
  ]

  const autoMenuItems: MenuProps['items'] = [
    {
      key: 'autocomplete',
      label: '智能补全'
    },
    {
      key: 'suggestions',
      label: '智能建议'
    }
  ]

  return (
    <div className="chat-input-toolbar">
      <div className="toolbar-left">
        <Button
          type="text"
          icon={<PlusOutlined />}
          className="toolbar-btn"
          onClick={onAddFile}
          title="添加附件"
        />
        <Dropdown
          menu={{
            items: pluginMenuItems,
            onClick: ({ key }) => onPluginSelect?.(key)
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<ApiOutlined />}
            className="toolbar-btn"
            title="插件"
          />
        </Dropdown>
        <Dropdown
          menu={{
            items: permissionMenuItems,
            onClick: ({ key }) => onPermissionChange?.(key)
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<SafetyOutlined />}
            className="toolbar-btn"
            title="权限控制"
          />
        </Dropdown>
      </div>
      <div className="toolbar-right">
        <Dropdown
          menu={{
            items: autoMenuItems,
            onClick: ({ key }) => {
              if (key === 'autocomplete') onAutoComplete?.()
            }
          }}
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<ThunderboltOutlined />}
            className="toolbar-btn"
            title="自动补全"
          />
        </Dropdown>
        <Button
          type="text"
          icon={<AudioOutlined />}
          className="toolbar-btn"
          onClick={onVoiceInput}
          title="语音输入"
        />
      </div>
    </div>
  )
}
