/**
 * 插件OAuth授权按钮组件
 */
import React, { useState } from 'react'
import { Button, message } from 'antd'
import { ApiOutlined, LoadingOutlined } from '@ant-design/icons'
import type { Plugin } from '@/stores/usePluginsStore'
import * as alibabaOAuth from '@/services/alibaba-oauth'

interface PluginAuthButtonProps {
  plugin: Plugin
  onAuthComplete: (token: any) => void
  onAuthError?: (error: Error) => void
}

export default function PluginAuthButton({
  plugin,
  onAuthComplete,
  onAuthError
}: PluginAuthButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleAuthorize = async () => {
    setLoading(true)

    try {
      // 根据插件类型选择不同的OAuth流程
      if (plugin.id === 'alibaba-international' || plugin.id.includes('alibaba')) {
        // 阿里巴巴OAuth流程
        const code = await alibabaOAuth.startOAuth()
        const token = await alibabaOAuth.exchangeToken(code)

        // 保存token
        alibabaOAuth.saveToken(token)

        message.success('授权成功！')
        onAuthComplete(token)
      } else {
        // 其他OAuth提供商
        throw new Error(`暂不支持 ${plugin.name} 的授权`)
      }
    } catch (error) {
      console.error('授权失败:', error)
      message.error(error instanceof Error ? error.message : '授权失败')
      onAuthError?.(error instanceof Error ? error : new Error('授权失败'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="primary"
      icon={loading ? <LoadingOutlined /> : <ApiOutlined />}
      onClick={handleAuthorize}
      disabled={loading}
      block
    >
      {loading ? '授权中...' : '授权账号'}
    </Button>
  )
}

/**
 * 撤销OAuth授权
 */
export async function revokeOAuth(pluginId: string): Promise<void> {
  if (pluginId === 'alibaba-international' || pluginId.includes('alibaba')) {
    alibabaOAuth.clearToken()
    message.success('已撤销授权')
  } else {
    // 其他OAuth提供商的撤销逻辑
    message.info('已清除本地授权信息')
  }
}
