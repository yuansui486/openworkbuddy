import React, { useState, useMemo } from 'react'
import { Modal, Tabs, Table, Tag, Button, Space, Empty } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { useTasksStore, type ScheduledTask } from '@/stores/useTasksStore'
import type { ColumnsType } from 'antd/es/table'
import './TaskHistoryModal.css'

interface TaskHistoryModalProps {
  open: boolean
  onClose: () => void
  task: ScheduledTask | null
}

interface ExecutionRecord {
  id: string
  taskId: string
  startTime: string
  endTime: string
  duration: number // 毫秒
  status: 'success' | 'failed' | 'running'
  result?: string
  error?: string
}

// 模拟历史记录数据（实际应从 store 或 API 获取）
function generateMockHistory(task: ScheduledTask | null): ExecutionRecord[] {
  if (!task) return []

  const records: ExecutionRecord[] = []
  const now = Date.now()

  // 生成最近 10 条记录
  for (let i = 0; i < 10; i++) {
    const startTime = now - (i + 1) * 24 * 3600 * 1000 + Math.random() * 3600 * 1000
    const duration = 2000 + Math.random() * 8000
    const status = Math.random() > 0.9 ? 'failed' : 'success'

    records.push({
      id: `exec-${task.id}-${i}`,
      taskId: task.id,
      startTime: new Date(startTime).toLocaleString('zh-CN'),
      endTime: new Date(startTime + duration).toLocaleString('zh-CN'),
      duration: Math.round(duration),
      status,
      result: status === 'success' ? task.lastResult || '执行成功' : undefined,
      error: status === 'failed' ? '执行超时，请检查网络连接' : undefined
    })
  }

  return records
}

export default function TaskHistoryModal({ open, onClose, task }: TaskHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'success' | 'failed'>('all')

  const history = useMemo(() => generateMockHistory(task), [task])

  const filteredHistory = useMemo(() => {
    if (activeTab === 'all') return history
    return history.filter(record => record.status === activeTab)
  }, [history, activeTab])

  const stats = useMemo(() => {
    const total = history.length
    const success = history.filter(r => r.status === 'success').length
    const failed = history.filter(r => r.status === 'failed').length
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : '0'
    const avgDuration = total > 0
      ? Math.round(history.reduce((sum, r) => sum + r.duration, 0) / total)
      : 0

    return { total, success, failed, successRate, avgDuration }
  }, [history])

  const columns: ColumnsType<ExecutionRecord> = [
    {
      title: '执行时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (ms: number) => {
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(1)}s`
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = {
          success: { color: 'success', icon: <CheckCircleOutlined />, text: '成功' },
          failed: { color: 'error', icon: <CloseCircleOutlined />, text: '失败' },
          running: { color: 'processing', icon: <SyncOutlined spin />, text: '运行中' }
        }[status] || { color: 'default', icon: null, text: status }

        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: '结果',
      key: 'result',
      render: (_, record) => {
        if (record.status === 'success' && record.result) {
          return (
            <div className="result-text" title={record.result}>
              {record.result.length > 60 ? record.result.slice(0, 60) + '...' : record.result}
            </div>
          )
        }
        if (record.status === 'failed' && record.error) {
          return (
            <div className="error-text" title={record.error}>
              {record.error}
            </div>
          )
        }
        return '-'
      }
    }
  ]

  const tabItems = [
    {
      key: 'all',
      label: `全部 (${stats.total})`,
      children: null
    },
    {
      key: 'success',
      label: `成功 (${stats.success})`,
      children: null
    },
    {
      key: 'failed',
      label: `失败 (${stats.failed})`,
      children: null
    }
  ]

  return (
    <Modal
      title={
        <div className="history-modal-title">
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          执行历史 - {task?.name}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <Button onClick={onClose}>关闭</Button>
      }
      className="task-history-modal"
    >
      <div className="history-stats">
        <div className="stat-item">
          <div className="stat-label">总执行次数</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">成功次数</div>
          <div className="stat-value success">{stats.success}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">失败次数</div>
          <div className="stat-value failed">{stats.failed}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">成功率</div>
          <div className="stat-value">{stats.successRate}%</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">平均耗时</div>
          <div className="stat-value">
            {stats.avgDuration < 1000
              ? `${stats.avgDuration}ms`
              : `${(stats.avgDuration / 1000).toFixed(1)}s`}
          </div>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        items={tabItems}
        className="history-tabs"
      />

      <Table
        columns={columns}
        dataSource={filteredHistory}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无执行记录"
            />
          )
        }}
      />
    </Modal>
  )
}
