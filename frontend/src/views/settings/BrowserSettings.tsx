import React from 'react'
import { Card, Form, Input, Switch, Select, Button, Space, message } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'

export default function BrowserSettings() {
  const [form] = Form.useForm()

  const handleSave = (values: any) => {
    console.log('保存浏览器设置:', values)
    message.success('浏览器设置已保存')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>浏览器设置</h2>

      <Card title={<><GlobalOutlined /> 浏览器配置</>} style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            userAgent: '',
            proxy: '',
            cookiePath: '',
            downloadPath: '',
            headless: true,
            devtools: false
          }}
        >
          <Form.Item label="User Agent" name="userAgent">
            <Input.TextArea
              rows={2}
              placeholder="留空使用默认 User Agent"
            />
          </Form.Item>

          <Form.Item label="代理服务器" name="proxy">
            <Input placeholder="http://proxy.example.com:8080" />
          </Form.Item>

          <Form.Item label="Cookie 存储路径" name="cookiePath">
            <Input placeholder="默认路径" />
          </Form.Item>

          <Form.Item label="下载路径" name="downloadPath">
            <Input placeholder="默认路径" />
          </Form.Item>

          <Form.Item label="无头模式" name="headless" valuePropName="checked">
            <Switch />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              不显示浏览器窗口
            </div>
          </Form.Item>

          <Form.Item label="开发者工具" name="devtools" valuePropName="checked">
            <Switch />
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              启动时自动打开开发者工具
            </div>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="浏览器引擎">
        <Form layout="vertical">
          <Form.Item label="选择浏览器引擎">
            <Select defaultValue="chromium" style={{ width: 200 }}>
              <Select.Option value="chromium">Chromium</Select.Option>
              <Select.Option value="chrome">Chrome</Select.Option>
              <Select.Option value="edge">Edge</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="引擎路径">
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="自动检测" readOnly />
              <Button>浏览</Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
