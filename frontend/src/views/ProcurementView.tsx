import React, { useState } from 'react'
import { Card, Button, Empty, Table, Tag, Space, Modal, Form, Input, InputNumber, Select, message } from 'antd'
import { PlusOutlined, ShoppingCartOutlined, SearchOutlined } from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import './ProcurementView.css'

interface ProcurementItem {
  id: string
  name: string
  category: string
  supplier: string
  price: number
  quantity: number
  status: 'pending' | 'ordered' | 'received'
  date: string
}

export default function ProcurementView() {
  const [items, setItems] = useState<ProcurementItem[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const columns = [
    {
      title: '物品名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: '供应商',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `¥${price.toFixed(2)}`
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap = {
          pending: 'gold',
          ordered: 'blue',
          received: 'green'
        }
        const textMap = {
          pending: '待采购',
          ordered: '已下单',
          received: '已到货'
        }
        return <Tag color={colorMap[status as keyof typeof colorMap]}>{textMap[status as keyof typeof textMap]}</Tag>
      }
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProcurementItem) => (
        <Space size="small">
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small" danger>删除</Button>
        </Space>
      ),
    },
  ]

  const handleAddItem = () => {
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const newItem: ProcurementItem = {
        id: Date.now().toString(),
        ...values,
        status: 'pending',
        date: new Date().toLocaleDateString('zh-CN')
      }
      setItems([...items, newItem])
      message.success('采购项已添加')
      form.resetFields()
      setModalOpen(false)
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  return (
    <div className="procurement-view">
      <PageHeader
        title="采购"
        showTutorial={true}
        searchPlaceholder="搜索采购项"
        primaryAction={{
          label: '新增采购',
          icon: <PlusOutlined />,
          onClick: handleAddItem
        }}
      />

      <div className="procurement-container">
        {items.length === 0 ? (
          <Empty
            image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description="暂无采购记录"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
              新增采购
            </Button>
          </Empty>
        ) : (
          <Card>
            <Table
              columns={columns}
              dataSource={items}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        )}
      </div>

      <Modal
        title="新增采购项"
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
            label="物品名称"
            name="name"
            rules={[{ required: true, message: '请输入物品名称' }]}
          >
            <Input placeholder="请输入物品名称" />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Select.Option value="办公用品">办公用品</Select.Option>
              <Select.Option value="电子设备">电子设备</Select.Option>
              <Select.Option value="家具">家具</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="供应商"
            name="supplier"
            rules={[{ required: true, message: '请输入供应商' }]}
          >
            <Input placeholder="请输入供应商名称" />
          </Form.Item>

          <Form.Item
            label="单价"
            name="price"
            rules={[{ required: true, message: '请输入单价' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入单价"
              min={0}
              precision={2}
              prefix="¥"
            />
          </Form.Item>

          <Form.Item
            label="数量"
            name="quantity"
            rules={[{ required: true, message: '请输入数量' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入数量"
              min={1}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
