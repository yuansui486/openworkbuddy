import React from 'react'
import { Button } from 'antd'
import './EmptyState.css'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    text: string
    onClick: () => void
  }
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state-container">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {action && (
        <Button
          type="primary"
          size="large"
          className="empty-state-action"
          onClick={action.onClick}
        >
          {action.text}
        </Button>
      )}
    </div>
  )
}
