import React, { useState } from 'react'
import { Card, Button, Switch, Space, Progress, message, Input, Select } from 'antd'
import {
  CheckCircleOutlined,
  DownloadOutlined,
  BellOutlined,
  ThunderboltOutlined,
  FolderOutlined,
  RocketOutlined,
  WifiOutlined,
  FileTextOutlined
} from '@ant-design/icons'

export default function SystemSettings() {
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [uploadingLogs, setUploadingLogs] = useState(false)

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true)
    // 模拟检查更新
    setTimeout(() => {
      setCheckingUpdate(false)
      setUpdateAvailable(false)
      message.success('当前已是最新版本')
    }, 1500)
  }

  const handleSelectWorkspace = () => {
    message.info('选择工作空间路径功能开发中')
  }

  const handleDiagnose = () => {
    message.info('网络诊断功能开发中')
  }

  const handleUploadLogs = async () => {
    setUploadingLogs(true)
    // 模拟上传日志
    setTimeout(() => {
      setUploadingLogs(false)
      message.success('日志已上传，ID: LOG-2026-11-23-001')
    }, 2000)
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>系统设置</h2>

      {/* 软件更新 */}
      <Card
        title={<><DownloadOutlined /> 软件更新</>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <span>当前版本：</span>
              <span style={{ fontWeight: 500 }}>v1.0.0</span>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            </Space>
          </div>

          {updateAvailable && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>发现新版本 v1.1.0</div>
              <Progress percent={0} status="active" />
            </div>
          )}
        </div>

        <Space>
          <Button
            type="primary"
            onClick={handleCheckUpdate}
            loading={checkingUpdate}
          >
            检查更新
          </Button>
          <Switch defaultChecked /> 自动检查更新
        </Space>
      </Card>

      {/* 桌面通知 */}
      <Card
        title={<><BellOutlined /> 桌面通知</>}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用桌面通知</span>
            <Switch defaultChecked />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>任务完成通知</span>
            <Switch defaultChecked />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>消息提醒</span>
            <Switch defaultChecked />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>通知声音</span>
            <Switch />
          </div>
        </Space>
      </Card>

      {/* 保持唤醒 */}
      <Card
        title={<><ThunderboltOutlined /> 保持唤醒</>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ marginBottom: 4 }}>防止系统休眠</div>
            <div style={{ fontSize: 12, color: '#666' }}>
              启用后，应用运行时系统将不会自动休眠
            </div>
          </div>
          <Switch />
        </div>
      </Card>

      {/* 工作空间路径 */}
      <Card
        title={<><FolderOutlined /> 工作空间路径</>}
        style={{ marginBottom: 16 }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <Input
            value="C:\Users\User\Documents\Workspace"
            readOnly
          />
          <Button onClick={handleSelectWorkspace}>选择</Button>
        </Space.Compact>
        <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
          存储聊天记录、缓存文件等数据
        </div>
      </Card>

      {/* GPU 加速 */}
      <Card
        title={<><RocketOutlined /> GPU 加速</>}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ marginBottom: 4 }}>启用硬件加速</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                使用 GPU 加速渲染，提升界面流畅度
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div style={{ marginTop: 8 }}>
            <div style={{ marginBottom: 8 }}>图形处理器</div>
            <Select defaultValue="auto" style={{ width: '100%' }}>
              <Select.Option value="auto">自动选择</Select.Option>
              <Select.Option value="nvidia">NVIDIA GeForce RTX 3060</Select.Option>
              <Select.Option value="integrated">Intel UHD Graphics</Select.Option>
            </Select>
          </div>
        </Space>
      </Card>

      {/* 网络诊断 */}
      <Card
        title={<><WifiOutlined /> 网络诊断</>}
        style={{ marginBottom: 16 }}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            检测网络连接状态和 API 可达性
          </div>
        </div>
        <Button onClick={handleDiagnose}>运行诊断</Button>
      </Card>

      {/* 日志上传 */}
      <Card
        title={<><FileTextOutlined /> 日志上传</>}
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
            上传应用日志以帮助我们诊断问题
          </div>
        </div>
        <Button
          type="primary"
          onClick={handleUploadLogs}
          loading={uploadingLogs}
        >
          上传日志
        </Button>
      </Card>
    </div>
  )
}
