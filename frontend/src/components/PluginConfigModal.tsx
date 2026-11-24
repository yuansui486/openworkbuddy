/**
 * 插件配置对话框
 */
import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Switch, Select, Space, message } from 'antd'
import type { Plugin } from '@/stores/usePluginsStore'
import PluginAuthButton from './PluginAuthButton'

export type ConfigFieldType =
  | { type: 'text'; label: string; key: string; default?: string; required?: boolean }
  | { type: 'number'; label: string; key: string; min?: number; max?: number; default?: number; required?: boolean }
  | { type: 'boolean'; label: string; key: string; default?: boolean }
  | { type: 'select'; label: string; key: string; options: {label: string; value: any}[]; default?: any; required?: boolean }
  | { type: 'oauth'; label: string; provider: string }

export interface PluginConfig {
  pluginId: string
  settings: Record<string, any>
}

interface PluginConfigModalProps {
  open: boolean
  plugin: Plugin | null
  config?: PluginConfig
  onOk: (config: PluginConfig) => void
  onCancel: () => void
}

// 插件配置定义
const PLUGIN_CONFIGS: Record<string, ConfigFieldType[]> = {
  'alibaba-international': [
    { type: 'oauth', label: '阿里巴巴账号授权', provider: 'alibaba' },
    { type: 'text', label: '店铺ID', key: 'shopId', required: false },
    { type: 'boolean', label: '自动同步商品', key: 'autoSync', default: true },
    { type: 'number', label: '同步间隔（分钟）', key: 'syncInterval', min: 5, max: 60, default: 15 },
    {
      type: 'select',
      label: '商品状态',
      key: 'productStatus',
      options: [
        { label: '全部', value: 'all' },
        { label: '仅上架', value: 'online' },
        { label: '仅下架', value: 'offline' }
      ],
      default: 'online'
    }
  ],
  'shopify': [
    { type: 'text', label: 'Shop域名', key: 'shopDomain', required: true },
    { type: 'text', label: 'API Key', key: 'apiKey', required: true },
    { type: 'text', label: 'API Secret', key: 'apiSecret', required: true },
    { type: 'boolean', label: '自动发布商品', key: 'autoPublish', default: false }
  ],
  'default': [
    { type: 'boolean', label: '启用插件', key: 'enabled', default: true }
  ]
}

export default function PluginConfigModal({
  open,
  plugin,
  config,
  onOk,
  onCancel
}: PluginConfigModalProps) {
  const [form] = Form.useForm()
  const [authStatus, setAuthStatus] = useState<'authorized' | 'unauthorized'>('unauthorized')

  useEffect(() => {
    if (open && plugin) {
      // 加载现有配置
      const fields = getPluginConfigFields(plugin.id)
      const initialValues: Record<string, any> = {}

      fields.forEach(field => {
        if (field.type !== 'oauth') {
          const key = field.key
          initialValues[key] = config?.settings?.[key] ?? field.default
        }
      })

      form.setFieldsValue(initialValues)
      setAuthStatus(plugin.authStatus === 'authorized' ? 'authorized' : 'unauthorized')
    }
  }, [open, plugin, config, form])

  const getPluginConfigFields = (pluginId: string): ConfigFieldType[] => {
    return PLUGIN_CONFIGS[pluginId] || PLUGIN_CONFIGS['default']
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      if (!plugin) return

      onOk({
        pluginId: plugin.id,
        settings: values
      })

      message.success('配置已保存')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const renderField = (field: ConfigFieldType) => {
    switch (field.type) {
      case 'oauth':
        return plugin ? (
          <Form.Item label={field.label}>
            {authStatus === 'authorized' ? (
              <Space>
                <span style={{ color: '#52c41a' }}>✓ 已授权</span>
                <a onClick={() => setAuthStatus('unauthorized')}>重新授权</a>
              </Space>
            ) : (
              <PluginAuthButton
                plugin={plugin}
                onAuthComplete={() => setAuthStatus('authorized')}
              />
            )}
          </Form.Item>
        ) : null

      case 'text':
        return (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={[{ required: field.required, message: `请输入${field.label}` }]}
          >
            <Input placeholder={`请输入${field.label}`} />
          </Form.Item>
        )

      case 'number':
        return (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={[{ required: field.required, message: `请输入${field.label}` }]}
          >
            <InputNumber
              min={field.min}
              max={field.max}
              style={{ width: '100%' }}
              placeholder={`请输入${field.label}`}
            />
          </Form.Item>
        )

      case 'boolean':
        return (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        )

      case 'select':
        return (
          <Form.Item
            key={field.key}
            name={field.key}
            label={field.label}
            rules={[{ required: field.required, message: `请选择${field.label}` }]}
          >
            <Select placeholder={`请选择${field.label}`}>
              {field.options.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        )

      default:
        return null
    }
  }

  if (!plugin) return null

  const fields = getPluginConfigFields(plugin.id)

  return (
    <Modal
      title={`配置 ${plugin.name}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 24 }}
      >
        {fields.map(field => renderField(field))}
      </Form>
    </Modal>
  )
}
