import React from 'react'
import { Card, Table, Button, Input, Space, message } from 'antd'
import { EditOutlined } from '@ant-design/icons'

export default function ShortcutsSettings() {
  const shortcuts = [
    { key: '1', action: '新建聊天', shortcut: 'Ctrl+N', editable: true },
    { key: '2', action: '打开设置', shortcut: 'Ctrl+,', editable: true },
    { key: '3', action: '搜索', shortcut: 'Ctrl+F', editable: true },
    { key: '4', action: '切换侧边栏', shortcut: 'Ctrl+B', editable: true },
    { key: '5', action: '发送消息', shortcut: 'Enter', editable: false },
    { key: '6', action: '换行', shortcut: 'Shift+Enter', editable: false },
    { key: '7', action: '清空输入', shortcut: 'Ctrl+K', editable: true },
    { key: '8', action: '上一条消息', shortcut: 'Ctrl+↑', editable: true },
    { key: '9', action: '下一条消息', shortcut: 'Ctrl+↓', editable: true },
  ]

  const columns = [
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 200
    },
    {
      title: '快捷键',
      dataIndex: 'shortcut',
      key: 'shortcut',
      width: 200,
      render: (text: string) => (
        <Input
          value={text}
          readOnly
          style={{ width: 150 }}
        />
      )
    },
    {
      title: '操作',
      key: 'operation',
      width: 100,
      render: (_: any, record: any) => (
        record.editable ? (
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => message.info('编辑快捷键功能开发中')}
          >
            编辑
          </Button>
        ) : null
      )
    }
  ]

  const handleReset = () => {
    message.success('快捷键已重置为默认值')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>快捷键</h2>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" onClick={handleReset}>
              恢复默认
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={shortcuts}
          pagination={false}
        />
      </Card>
    </div>
  )
}
