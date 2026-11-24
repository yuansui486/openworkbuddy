import React from 'react'
import { Card, Form, Input, Button, Upload, Avatar, message } from 'antd'
import { UserOutlined, UploadOutlined } from '@ant-design/icons'

export default function ProfileSettings() {
  const [form] = Form.useForm()

  const handleSave = (values: any) => {
    console.log('保存个人资料:', values)
    message.success('个人资料已保存')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>个人资料</h2>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            username: '',
            email: '',
            phone: '',
            company: '',
            department: ''
          }}
        >
          <Form.Item label="头像">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar size={64} icon={<UserOutlined />} />
              <Upload>
                <Button icon={<UploadOutlined />}>上传头像</Button>
              </Upload>
            </div>
          </Form.Item>

          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>

          <Form.Item label="公司" name="company">
            <Input placeholder="请输入公司名称" />
          </Form.Item>

          <Form.Item label="部门" name="department">
            <Input placeholder="请输入部门" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
