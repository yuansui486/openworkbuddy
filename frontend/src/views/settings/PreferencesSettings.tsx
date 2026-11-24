import React from 'react'
import { Card, Form, Select, Switch, Radio, Button, message, Space } from 'antd'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function PreferencesSettings() {
  const settingsStore = useSettingsStore()
  const [form] = Form.useForm()

  const handleSave = (values: any) => {
    console.log('保存偏好设置:', values)
    message.success('偏好设置已保存')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>偏好设置</h2>

      <Card title="外观" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            theme: settingsStore.theme,
            language: 'zh-CN',
            fontSize: 'medium',
            compactMode: false
          }}
        >
          <Form.Item label="主题" name="theme">
            <Radio.Group>
              <Radio.Button value="light">浅色</Radio.Button>
              <Radio.Button value="dark">深色</Radio.Button>
              <Radio.Button value="auto">跟随系统</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="语言" name="language">
            <Select style={{ width: 200 }}>
              <Select.Option value="zh-CN">简体中文</Select.Option>
              <Select.Option value="en-US">English</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="字体大小" name="fontSize">
            <Select style={{ width: 200 }}>
              <Select.Option value="small">小</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="large">大</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="紧凑模式" name="compactMode" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Card>

      <Card title="行为" style={{ marginBottom: 16 }}>
        <Form
          layout="vertical"
          initialValues={{
            autoSave: true,
            confirmBeforeDelete: true,
            showNotifications: true
          }}
        >
          <Form.Item label="自动保存" name="autoSave" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="删除前确认" name="confirmBeforeDelete" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="显示通知" name="showNotifications" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Card>

      <Space>
        <Button type="primary" onClick={() => form.submit()}>
          保存
        </Button>
        <Button onClick={() => form.resetFields()}>
          重置
        </Button>
      </Space>
    </div>
  )
}
