import React from 'react'
import { Spin } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import './LoadingState.css'

interface LoadingStateProps {
  tip?: string
  size?: 'small' | 'default' | 'large'
  fullscreen?: boolean
}

export default function LoadingState({ tip = '加载中...', size = 'default', fullscreen = false }: LoadingStateProps) {
  const spinner = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : size === 'small' ? 24 : 32 }} spin />

  if (fullscreen) {
    return (
      <div className="loading-state-fullscreen">
        <Spin indicator={spinner} tip={tip} size={size} />
      </div>
    )
  }

  return (
    <div className="loading-state-container">
      <Spin indicator={spinner} tip={tip} size={size} />
    </div>
  )
}
