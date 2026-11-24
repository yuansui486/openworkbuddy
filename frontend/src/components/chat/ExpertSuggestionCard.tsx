import React, { useState } from 'react'
import { Button } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import './ExpertSuggestionCard.css'

interface ExpertSuggestionCardProps {
  onStart: () => void
}

export default function ExpertSuggestionCard({ onStart }: ExpertSuggestionCardProps) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="expert-suggestion-card">
      <div className="expert-content">
        <div className="expert-icon">
          🚀
        </div>
        <div className="expert-text">
          <p className="expert-message">从推荐任务开始，查看 AI 专家能为你做什么。</p>
        </div>
      </div>
      <Button
        type="primary"
        size="large"
        className="expert-start-btn"
        onClick={onStart}
      >
        立即开始
      </Button>
      <Button
        type="text"
        size="small"
        icon={<CloseOutlined />}
        className="expert-close-btn"
        onClick={() => setVisible(false)}
      />
    </div>
  )
}
