import React, { useState } from 'react'
import { Card, Button, Table, Tag, Space, message, Popconfirm } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  PlusOutlined,
  HistoryOutlined,
  EditOutlined
} from '@ant-design/icons'
import { useTasksStore } from '@/stores/useTasksStore'
import TaskCreateModal from '@/components/TaskCreateModal'
import TaskHistoryModal from '@/components/TaskHistoryModal'
import type { ColumnsType } from 'antd/es/table'
import type { ScheduledTask } from '@/stores/useTasksStore'
import './TasksView.css'

export default function TasksView() {
  const tasksStore = useTasksStore()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null)
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null)

  const handleToggle = (id: string) => {
    tasksStore.toggleTask(id)
    const task = tasksStore.allTasks.find(t => t.id === id)
    if (task) {
      message.success(task.status === 'active' ? '任务已启动' : '任务已暂停')
    }
  }

  const handleExecute = async (id: string) => {
    try {
      message.loading({ content: '正在执行任务...', key: 'execute', duration: 0 })
      await tasksStore.executeTask(id)
      message.success({ content: '任务执行成功', key: 'execute' })
    } catch (error) {
      message.error({
        content: `执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        key: 'execute'
      })
    }
  }

  const handleDelete = (id: string) => {
    tasksStore.deleteTask(id)
    message.success('任务已删除')
  }

  const handleEdit = (task: ScheduledTask) => {
    setEditingTask(task)
    setCreateModalOpen(true)
  }

  const handleViewHistory = (task: ScheduledTask) => {
    setSelectedTask(task)
    setHistoryModalOpen(true)
  }

  const handleCreateNew = () => {
    setEditingTask(null)
    setCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false)
    setEditingTask(null)
  }

  const handleCloseHistoryModal = () => {
    setHistoryModalOpen(false)
    setSelectedTask(null)
  }

  const columns: ColumnsType<ScheduledTask> = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.description}</div>
          {record.tags && record.tags.length > 0 && (
            <div style={{ marginTop: 6 }}>
              {record.tags.map(tag => (
                <Tag key={tag} color="blue" style={{ fontSize: 11 }}>
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: '执行技能',
      dataIndex: 'skillName',
      key: 'skillName',
      width: 150,
      render: (text) => (
        <Tag color="cyan">{text}</Tag>
      )
    },
    {
      title: '频率',
      dataIndex: 'frequency',
      key: 'frequency',
      width: 100
    },
    {
      title: '下次执行',
      dataIndex: 'nextRunAt',
      key: 'nextRunAt',
      width: 180
    },
    {
      title: '上次结果',
      dataIndex: 'lastResult',
      key: 'lastResult',
      width: 200,
      render: (text, record) => {
        if (!text) return <span style={{ color: '#999' }}>-</span>
        return (
          <div style={{ fontSize: 12, color: record.status === 'failed' ? '#ff4d4f' : '#595959' }}>
            {text.length > 50 ? text.slice(0, 50) + '...' : text}
          </div>
        )
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          active: { color: 'green', text: '运行中' },
          paused: { color: 'default', text: '已暂停' },
          running: { color: 'blue', text: '执行中' },
          failed: { color: 'red', text: '失败' }
        }
        const statusConfig = config[status] || { color: 'default', text: status }
        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={record.status === 'active' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handleToggle(record.id)}
          >
            {record.status === 'active' ? '暂停' : '启动'}
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => handleExecute(record.id)}
            disabled={record.status === 'running'}
          >
            立即执行
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            历史
          </Button>
          <Popconfirm
            title="确定删除此任务？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="tasks-view">
      <Card
        title={
          <div className="tasks-header">
            <div className="tasks-title">定时任务管理</div>
            <div className="tasks-subtitle">自动化执行技能，提升运营效率</div>
          </div>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateNew}
          >
            创建任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tasksStore.allTasks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showTotal: (total) => `共 ${total} 个任务`
          }}
        />
      </Card>

      <TaskCreateModal
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        editingTask={editingTask}
      />

      <TaskHistoryModal
        open={historyModalOpen}
        onClose={handleCloseHistoryModal}
        task={selectedTask}
      />
    </div>
  )
}
