import React, { useState } from 'react'
import { Card, Button, Empty, List, Tag, Space, Modal, Form, Input, Select, message, Tabs } from 'antd'
import { PlusOutlined, SafetyOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import './LawyerView.css'

interface LawyerCase {
  id: string
  title: string
  type: string
  status: 'pending' | 'in-progress' | 'resolved'
  lawyer: string
  description: string
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export default function LawyerView() {
  const [activeTab, setActiveTab] = useState('cases')
  const [cases, setCases] = useState<LawyerCase[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handleAddCase = () => {
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const newCase: LawyerCase = {
        id: Date.now().toString(),
        ...values,
        status: 'pending',
        createdAt: new Date().toLocaleDateString('zh-CN')
      }
      setCases([...cases, newCase])
      message.success('案件已提交')
      form.resetFields()
      setModalOpen(false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colorMap = {
      pending: 'gold',
      'in-progress': 'blue',
      resolved: 'green'
    }
    return colorMap[status as keyof typeof colorMap]
  }

  const getStatusText = (status: string) => {
    const textMap = {
      pending: '待处理',
      'in-progress': '处理中',
      resolved: '已解决'
    }
    return textMap[status as keyof typeof textMap]
  }

  const getPriorityColor = (priority: string) => {
    const colorMap = {
      low: 'default',
      medium: 'orange',
      high: 'red'
    }
    return colorMap[priority as keyof typeof colorMap]
  }

  const getPriorityText = (priority: string) => {
    const textMap = {
      low: '低',
      medium: '中',
      high: '高'
    }
    return textMap[priority as keyof typeof textMap]
  }

  const lawyers = [
    { name: '张律师', specialty: '合同纠纷', phone: '138-0000-0000', email: 'zhang@law.com' },
    { name: '李律师', specialty: '知识产权', phone: '139-0000-0000', email: 'li@law.com' },
    { name: '王律师', specialty: '劳动纠纷', phone: '137-0000-0000', email: 'wang@law.com' }
  ]

  return (
    <div className="lawyer-view">
      <PageHeader
        title="律师通道"
        showTutorial={true}
        searchPlaceholder="搜索案件"
        primaryAction={{
          label: '新建咨询',
          icon: <PlusOutlined />,
          onClick: handleAddCase
        }}
      />

      <div className="lawyer-container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'cases', label: '我的案件' },
            { key: 'lawyers', label: '律师团队' },
            { key: 'resources', label: '法律资源' }
          ]}
        />

        <div className="lawyer-content">
          {activeTab === 'cases' ? (
            cases.length === 0 ? (
              <Empty
                image={<SafetyOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                description="暂无咨询案件"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCase}>
                  新建咨询
                </Button>
              </Empty>
            ) : (
              <List
                grid={{ gutter: 16, xs: 1, sm: 1, md: 2, lg: 2, xl: 3, xxl: 3 }}
                dataSource={cases}
                renderItem={(item) => (
                  <List.Item>
                    <Card hoverable className="case-card">
                      <div className="case-header">
                        <h3 className="case-title">{item.title}</h3>
                        <Space>
                          <Tag color={getStatusColor(item.status)}>
                            {getStatusText(item.status)}
                          </Tag>
                          <Tag color={getPriorityColor(item.priority)}>
                            {getPriorityText(item.priority)}
                          </Tag>
                        </Space>
                      </div>
                      <div className="case-info">
                        <p className="case-type">类型：{item.type}</p>
                        <p className="case-lawyer">负责律师：{item.lawyer}</p>
                        <p className="case-description">{item.description}</p>
                      </div>
                      <div className="case-footer">
                        <span className="case-date">{item.createdAt}</span>
                        <Space>
                          <Button type="link" size="small">查看详情</Button>
                          <Button type="link" size="small">联系律师</Button>
                        </Space>
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            )
          ) : activeTab === 'lawyers' ? (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 4 }}
              dataSource={lawyers}
              renderItem={(lawyer) => (
                <List.Item>
                  <Card hoverable className="lawyer-card">
                    <div className="lawyer-avatar">
                      {lawyer.name.charAt(0)}
                    </div>
                    <h3 className="lawyer-name">{lawyer.name}</h3>
                    <p className="lawyer-specialty">{lawyer.specialty}</p>
                    <div className="lawyer-contact">
                      <div className="contact-item">
                        <PhoneOutlined /> {lawyer.phone}
                      </div>
                      <div className="contact-item">
                        <MailOutlined /> {lawyer.email}
                      </div>
                    </div>
                    <Button type="primary" block style={{ marginTop: 16 }}>
                      咨询
                    </Button>
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="法律资源建设中" />
          )}
        </div>
      </div>

      <Modal
        title="新建法律咨询"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        okText="提交"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            label="案件标题"
            name="title"
            rules={[{ required: true, message: '请输入案件标题' }]}
          >
            <Input placeholder="请输入案件标题" />
          </Form.Item>

          <Form.Item
            label="案件类型"
            name="type"
            rules={[{ required: true, message: '请选择案件类型' }]}
          >
            <Select placeholder="请选择案件类型">
              <Select.Option value="合同纠纷">合同纠纷</Select.Option>
              <Select.Option value="知识产权">知识产权</Select.Option>
              <Select.Option value="劳动纠纷">劳动纠纷</Select.Option>
              <Select.Option value="公司法务">公司法务</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="优先级"
            name="priority"
            rules={[{ required: true, message: '请选择优先级' }]}
          >
            <Select placeholder="请选择优先级">
              <Select.Option value="low">低</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="high">高</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="负责律师"
            name="lawyer"
            rules={[{ required: true, message: '请选择律师' }]}
          >
            <Select placeholder="请选择律师">
              <Select.Option value="张律师">张律师</Select.Option>
              <Select.Option value="李律师">李律师</Select.Option>
              <Select.Option value="王律师">王律师</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="案件描述"
            name="description"
            rules={[{ required: true, message: '请输入案件描述' }]}
          >
            <Input.TextArea
              placeholder="请详细描述您的法律问题"
              rows={6}
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
