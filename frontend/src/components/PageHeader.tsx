import React from 'react'
import { Button, Input } from 'antd'
import { PlusOutlined, TeamOutlined, PlayCircleOutlined } from '@ant-design/icons'
import './PageHeader.css'

const { Search } = Input

interface PageHeaderProps {
  title: string
  showTutorial?: boolean
  searchPlaceholder?: string
  onSearch?: (value: string) => void
  primaryAction?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    icon?: React.ReactNode
    onClick: () => void
  }
}

export default function PageHeader({
  title,
  showTutorial = false,
  searchPlaceholder = '搜索',
  onSearch,
  primaryAction,
  secondaryAction
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-container">
        {/* 左侧 */}
        <div className="page-header-left">
          <h1 className="page-header-title">{title}</h1>
          {showTutorial && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              className="page-header-tutorial"
            >
              观看教程
            </Button>
          )}
        </div>

        {/* 右侧 */}
        <div className="page-header-right">
          <Search
            placeholder={searchPlaceholder}
            className="page-header-search"
            onSearch={onSearch}
            allowClear
          />

          {secondaryAction && (
            <Button
              icon={secondaryAction.icon}
              onClick={secondaryAction.onClick}
              className="page-header-btn-secondary"
            >
              {secondaryAction.label}
            </Button>
          )}

          {primaryAction && (
            <Button
              type="primary"
              icon={primaryAction.icon}
              onClick={primaryAction.onClick}
              className="page-header-btn-primary"
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
