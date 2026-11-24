import React, { useState, useEffect } from 'react'
import { Card, Button, Space, Tag, Table, message, Alert, Switch } from 'antd'
import {
  MobileOutlined,
  QrcodeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  CopyOutlined
} from '@ant-design/icons'
import { remoteServer, type RemoteSession } from '@/services/remote-server'
import { sessionSync } from '@/services/session-sync'
import type { ColumnsType } from 'antd/es/table'
import './RemoteView.css'

export default function RemoteView() {
  const [serverStatus, setServerStatus] = useState<'idle' | 'starting' | 'running' | 'error'>('idle')
  const [sessionId, setSessionId] = useState<string>('')
  const [devices, setDevices] = useState<RemoteSession[]>([])
  const [autoSync, setAutoSync] = useState(true)

  useEffect(() => {
    // 检查初始状态
    const status = remoteServer.getStatus()
    if (status.running) {
      setServerStatus('running')
      setSessionId(status.sessionId)
    }

    // 监听连接状态变化
    const unsubscribe = remoteServer.onStatusChange((status) => {
      if (status === 'connected') {
        setServerStatus('running')
      } else {
        setServerStatus('error')
      }
    })

    // 定期更新设备列表
    const interval = setInterval(() => {
      if (serverStatus === 'running') {
        setDevices(remoteServer.getConnectedDevices())
      }
    }, 2000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [serverStatus])

  const handleStartServer = async () => {
    try {
      setServerStatus('starting')
      const id = await remoteServer.start()
      setSessionId(id)
      setServerStatus('running')
      message.success('服务已启动')
    } catch (error) {
      console.error('启动服务失败:', error)
      message.error('启动服务失败: ' + (error instanceof Error ? error.message : '未知错误'))
      setServerStatus('error')
    }
  }

  const handleStopServer = () => {
    remoteServer.stop()
    setServerStatus('idle')
    setSessionId('')
    setDevices([])
    message.info('服务已停止')
  }

  const handleRefresh = () => {
    setDevices(remoteServer.getConnectedDevices())
    message.success('已刷新设备列表')
  }

  const handleManualSync = async () => {
    try {
      await sessionSync.manualSync()
      message.success('同步成功')
    } catch (error) {
      message.error('同步失败')
    }
  }

  const handleAutoSyncToggle = (checked: boolean) => {
    setAutoSync(checked)
    if (checked) {
      sessionSync.initialize()
    } else {
      sessionSync.stop()
    }
  }

  const handleCopySessionId = () => {
    navigator.clipboard.writeText(sessionId)
    message.success('会话 ID 已复制到剪贴板')
  }

  const handleCopyUrl = () => {
    const url = `https://mobile.example.com/connect?session=${sessionId}`
    navigator.clipboard.writeText(url)
    message.success('连接地址已复制到剪贴板')
  }

  // 生成 QR Code API URL（使用免费在线服务）
  const getQRCodeUrl = (sessionId: string) => {
    const connectUrl = `https://mobile.example.com/connect?session=${sessionId}`
    // 使用 qrcode.react 或在线 API 生成二维码
    return `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(connectUrl)}`
  }

  const deviceColumns: ColumnsType<RemoteSession> = [
    {
      title: '设备名称',
      dataIndex: 'deviceName',
      key: 'deviceName'
    },
    {
      title: '设备类型',
      dataIndex: 'deviceType',
      key: 'deviceType',
      render: (type: string) => (
        <Tag color={type === 'mobile' ? 'blue' : 'green'}>
          {type === 'mobile' ? '手机' : '桌面'}
        </Tag>
      )
    },
    {
      title: '连接时间',
      dataIndex: 'connectedAt',
      key: 'connectedAt',
      render: (date: Date) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date: Date) => {
        const diff = Date.now() - new Date(date).getTime()
        if (diff < 60000) return '刚刚'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
        return `${Math.floor(diff / 3600000)} 小时前`
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={status === 'connected' ? 'success' : 'default'}
          icon={status === 'connected' ? <CheckCircleOutlined /> : <DisconnectOutlined />}
        >
          {status === 'connected' ? '已连接' : '已断开'}
        </Tag>
      )
    }
  ]

  return (
    <div className="remote-view">
      <Card>
        <div className="remote-header">
          <div className="header-left">
            <MobileOutlined className="header-icon" />
            <div className="header-text">
              <h2>手机遥控电脑</h2>
              <p>扫码连接手机，远程控制电脑端操作</p>
            </div>
          </div>
          <div className="header-right">
            {serverStatus === 'idle' && (
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={handleStartServer}
              >
                启动服务
              </Button>
            )}
            {serverStatus === 'starting' && (
              <Button type="primary" loading disabled>
                启动中...
              </Button>
            )}
            {serverStatus === 'running' && (
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                >
                  刷新
                </Button>
                <Button
                  danger
                  onClick={handleStopServer}
                >
                  停止服务
                </Button>
              </Space>
            )}
            {serverStatus === 'error' && (
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={handleStartServer}
              >
                重新启动
              </Button>
            )}
          </div>
        </div>

        {serverStatus === 'running' && (
          <>
            <Alert
              message="服务运行中"
              description={
                <div>
                  <div>会话 ID: <code>{sessionId}</code></div>
                  <div style={{ marginTop: 8 }}>
                    使用手机扫描下方二维码连接，或手动输入会话 ID
                  </div>
                </div>
              }
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginTop: 24 }}
            />

            <div className="qrcode-section">
              <div className="qrcode-container">
                <h3>扫码连接</h3>
                <img
                  src={getQRCodeUrl(sessionId)}
                  alt="连接二维码"
                  className="qrcode-image"
                  onError={(e) => {
                    // 如果图片加载失败，显示会话 ID
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="qrcode-hint">
                  使用手机扫描此二维码
                </div>
              </div>

              <div className="connection-info">
                <h3>连接信息</h3>
                <div className="info-item">
                  <span className="info-label">会话 ID:</span>
                  <Space>
                    <code className="info-value">{sessionId}</code>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={handleCopySessionId}
                    >
                      复制
                    </Button>
                  </Space>
                </div>
                <div className="info-item">
                  <span className="info-label">连接地址:</span>
                  <Space>
                    <code className="info-value">mobile.example.com</code>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={handleCopyUrl}
                    >
                      复制
                    </Button>
                  </Space>
                </div>
                <div className="info-item">
                  <span className="info-label">已连接设备:</span>
                  <span className="info-value">{devices.length} 个</span>
                </div>
                <div className="info-item">
                  <span className="info-label">自动同步:</span>
                  <Switch
                    checked={autoSync}
                    onChange={handleAutoSyncToggle}
                    checkedChildren="开启"
                    unCheckedChildren="关闭"
                  />
                </div>
                {autoSync && (
                  <Button
                    icon={<SyncOutlined />}
                    onClick={handleManualSync}
                    style={{ marginTop: 12, width: '100%' }}
                  >
                    立即同步
                  </Button>
                )}
              </div>
            </div>

            <div className="devices-section">
              <h3>已连接设备</h3>
              <Table
                columns={deviceColumns}
                dataSource={devices}
                rowKey="id"
                pagination={false}
                locale={{
                  emptyText: '暂无设备连接'
                }}
              />
            </div>
          </>
        )}

        {serverStatus === 'idle' && (
          <div className="empty-state">
            <MobileOutlined className="empty-icon" />
            <h3>手机遥控功能</h3>
            <p>启动服务后，可以通过手机扫码连接并远程控制电脑端</p>
            <p style={{ color: '#8c8c8c', fontSize: 13, marginTop: 8 }}>
              功能包括：远程执行技能、发送消息、控制任务等
            </p>
            <Alert
              message="需要 WebSocket 中继服务器"
              description="手机遥控功能需要部署 WebSocket 中继服务器。开发环境默认连接 localhost:3001"
              type="info"
              showIcon
              style={{ marginTop: 24, textAlign: 'left' }}
            />
          </div>
        )}

        {serverStatus === 'error' && (
          <Alert
            message="连接失败"
            description="无法连接到中继服务器，请检查网络连接或稍后重试。开发环境需要在 localhost:3001 启动 WebSocket 服务器"
            type="error"
            showIcon
            style={{ marginTop: 24 }}
          />
        )}
      </Card>
    </div>
  )
}
