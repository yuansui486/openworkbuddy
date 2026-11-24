/**
 * 插件安装向导对话框
 */
import React, { useState } from 'react'
import { Modal, Steps, Button, Space, Checkbox, Alert, List, Tag, Rate } from 'antd'
import {
  SafetyOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import type { Plugin } from '@/stores/usePluginsStore'
import {
  PluginPermission,
  PERMISSION_DESCRIPTIONS,
  validatePermissionRequest,
  grantPermissions
} from '@/utils/plugin-permissions'
import PluginAuthButton from './PluginAuthButton'

interface PluginInstallModalProps {
  open: boolean
  plugin: Plugin | null
  onComplete: (pluginId: string) => void
  onCancel: () => void
}

// 模拟插件的权限需求
const PLUGIN_PERMISSIONS: Record<string, PluginPermission[]> = {
  'alibaba-international': [
    PluginPermission.NETWORK_ACCESS,
    PluginPermission.ALIBABA_API,
    PluginPermission.USER_DATA,
    PluginPermission.NOTIFICATIONS
  ],
  'shopify': [
    PluginPermission.NETWORK_ACCESS,
    PluginPermission.USER_DATA
  ],
  'default': [
    PluginPermission.NETWORK_ACCESS
  ]
}

export default function PluginInstallModal({
  open,
  plugin,
  onComplete,
  onCancel
}: PluginInstallModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [permissionsAccepted, setPermissionsAccepted] = useState(false)
  const [authCompleted, setAuthCompleted] = useState(false)

  const getPluginPermissions = (pluginId: string): PluginPermission[] => {
    return PLUGIN_PERMISSIONS[pluginId] || PLUGIN_PERMISSIONS['default']
  }

  const needsAuth = (plugin: Plugin | null): boolean => {
    return plugin?.authStatus === 'unauthorized'
  }

  const handleNext = () => {
    if (currentStep === 0) {
      setCurrentStep(1)
    } else if (currentStep === 1) {
      if (!permissionsAccepted) return

      // 授予权限
      if (plugin) {
        const permissions = getPluginPermissions(plugin.id)
        grantPermissions(plugin.id, permissions)
      }

      // 如果需要OAuth，跳转到授权步骤
      if (needsAuth(plugin)) {
        setCurrentStep(2)
      } else {
        // 否则直接完成
        setCurrentStep(3)
        setTimeout(() => {
          if (plugin) {
            onComplete(plugin.id)
            handleClose()
          }
        }, 1500)
      }
    } else if (currentStep === 2) {
      if (!authCompleted) return

      // 完成安装
      setCurrentStep(3)
      setTimeout(() => {
        if (plugin) {
          onComplete(plugin.id)
          handleClose()
        }
      }, 1500)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    setPermissionsAccepted(false)
    setAuthCompleted(false)
    onCancel()
  }

  if (!plugin) return null

  const permissions = getPluginPermissions(plugin.id)
  const permissionValidation = validatePermissionRequest(permissions)

  const steps = [
    { title: '插件详情' },
    { title: '权限确认' },
    ...(needsAuth(plugin) ? [{ title: 'OAuth授权' }] : []),
    { title: '安装完成' }
  ]

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 12,
                  backgroundColor: plugin.iconColor || '#1890ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 32,
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {plugin.iconText || plugin.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{plugin.name}</h3>
                <div style={{ color: '#666', marginBottom: 8 }}>
                  发布者：{plugin.publisher}
                  {plugin.source === 'official' && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>官方</Tag>
                  )}
                </div>
                <Rate disabled defaultValue={4.5} style={{ fontSize: 14 }} />
                <span style={{ marginLeft: 8, color: '#666', fontSize: 12 }}>
                  (1234 评价)
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4>插件介绍</h4>
              <p style={{ color: '#666', lineHeight: 1.6 }}>
                {plugin.description}
              </p>
            </div>

            {plugin.tags && plugin.tags.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4>标签</h4>
                <Space wrap>
                  {plugin.tags.map(tag => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}

            <Alert
              message="此插件由社区开发者提供，使用前请确认您信任该开发者"
              type="info"
              icon={<InfoCircleOutlined />}
              showIcon
            />
          </div>
        )

      case 1:
        return (
          <div>
            <Alert
              message="权限说明"
              description="该插件需要以下权限才能正常工作，请仔细阅读并确认"
              type="warning"
              icon={<SafetyOutlined />}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <List
              size="small"
              bordered
              dataSource={permissions}
              renderItem={permission => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {PERMISSION_DESCRIPTIONS[permission]}
                </List.Item>
              )}
              style={{ marginBottom: 16 }}
            />

            {permissionValidation.warnings.length > 0 && (
              <Alert
                message="安全提示"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {permissionValidation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                }
                type="warning"
                icon={<WarningOutlined />}
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Checkbox
              checked={permissionsAccepted}
              onChange={e => setPermissionsAccepted(e.target.checked)}
            >
              我已阅读并同意授予以上权限
            </Checkbox>
          </div>
        )

      case 2:
        return (
          <div>
            <Alert
              message="需要授权"
              description={`${plugin.name} 需要连接到您的账号才能正常工作`}
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <div style={{ maxWidth: 400, margin: '0 auto' }}>
              <PluginAuthButton
                plugin={plugin}
                onAuthComplete={() => setAuthCompleted(true)}
              />
            </div>

            {authCompleted && (
              <Alert
                message="授权成功"
                description="您可以继续完成安装"
                type="success"
                showIcon
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        )

      case 3:
        return (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <CheckCircleOutlined
              style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }}
            />
            <h2>安装完成！</h2>
            <p style={{ color: '#666' }}>
              {plugin.name} 已成功安装，您可以在"我的插件"中查看和管理
            </p>
          </div>
        )

      default:
        return null
    }
  }

  const canNext = () => {
    if (currentStep === 1) return permissionsAccepted
    if (currentStep === 2) return authCompleted
    return true
  }

  return (
    <Modal
      title="安装插件"
      open={open}
      onCancel={handleClose}
      width={700}
      footer={
        currentStep === 3 ? null : (
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!canNext()}
            >
              {currentStep === steps.length - 2 ? '完成安装' : '下一步'}
            </Button>
          </Space>
        )
      }
    >
      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: 32 }}
      />

      {renderStepContent()}
    </Modal>
  )
}
