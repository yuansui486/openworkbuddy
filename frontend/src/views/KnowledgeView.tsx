import React, { useState } from 'react'
import { Card, Button, Empty, List, Tag, Space, Modal, Form, Input, Upload, message, Tabs } from 'antd'
import { PlusOutlined, FileTextOutlined, UploadOutlined, FolderOutlined } from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import './KnowledgeView.css'

interface KnowledgeItem {
  id: string
  title: string
  type: 'document' | 'link' | 'note'
  category: string
  content: string
  tags: string[]
  createdAt: string
}

export default function KnowledgeView() {
  const [activeTab, setActiveTab] = useState('all')
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const handleAddKnowledge = () => {
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const newItem: KnowledgeItem = {
        id: Date.now().toString(),
        ...values,
        type: 'note',
        tags: values.tags ? values.tags.split(',').map((t: string) => t.trim()) : [],
        createdAt: new Date().toLocaleDateString('zh-CN')
      }
      setItems([...items, newItem])
      message.success('知识项已添加')
      form.resetFields()
      setModalOpen(false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      document: <FileTextOutlined />,
      link: <FolderOutlined />,
      note: <FileTextOutlined />
    }
    return icons[type] || <FileTextOutlined />
  }

  const getTypeText = (type: string) => {
    const texts: Record<string, string> = {
      document: '文档',
      link: '链接',
      note: '笔记'
    }
    return texts[type] || '未知'
  }

  return (
    <div className="knowledge-view">
      <PageHeader
        title="知识库"
        showTutorial={true}
        searchPlaceholder="搜索知识库"
        primaryAction={{
          label: '添加知识',
          icon: <PlusOutlined />,
          onClick: handleAddKnowledge
        }}
      />

      <div className="knowledge-container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'all', label: '全部' },
            { key: 'documents', label: '文档' },
            { key: 'links', label: '链接' },
            { key: 'notes', label: '笔记' }
          ]}
        />

        <div className="knowledge-content">
          {items.length === 0 ? (
            <Empty
              image={<FileTextOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description="知识库为空"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddKnowledge}>
                添加知识
              </Button>
            </Empty>
          ) : (
            <List
              grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
              dataSource={items}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    className="knowledge-card"
                  >
                    <div className="knowledge-type">
                      {getTypeIcon(item.type)}
                      <span>{getTypeText(item.type)}</span>
                    </div>
                    <h3 className="knowledge-title">{item.title}</h3>
                    <p className="knowledge-content">{item.content}</p>
                    <div className="knowledge-tags">
                      {item.tags.map(tag => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                    <div className="knowledge-meta">
                      <span className="knowledge-category">{item.category}</span>
                      <span className="knowledge-date">{item.createdAt}</span>
                    </div>
                  </Card>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      <Modal
        title="添加知识"
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => {
          setModalOpen(false)
          form.resetFields()
        }}
        okText="添加"
        cancelText="取消"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          style={{ marginTop: 24 }}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入标题" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请输入分类' }]}
          >
            <Input placeholder="如：技术文档、产品手册等" />
          </Form.Item>

          <Form.Item
            label="内容"
            name="content"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea
              placeholder="请输入内容"
              rows={6}
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
          >
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>

          <Form.Item
            label="附件"
          >
            <Upload>
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
