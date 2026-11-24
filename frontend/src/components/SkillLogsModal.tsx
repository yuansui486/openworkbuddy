/**
 * 技能日志模态框
 */
import React, { useMemo } from 'react'
import { Modal, Table, Tag, Button, Space, Empty, Tooltip } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Skill } from '@/stores/useSkillsStore'
import { useSkillLogsStore, type SkillLog } from '@/stores/useSkillLogsStore'

interface Props {
  skill: Skill | null
  open: boolean
  onClose: () => void
}

export default function SkillLogsModal({ skill, open, onClose }: Props) {
  const logs = useSkillLogsStore((state) =>
    skill ? state.getLogs(skill.id) : []
  )
  const deleteLog = useSkillLogsStore((state) => state.deleteLog)
  const clearLogs = useSkillLogsStore((state) => state.clearLogs)

  const columns = [
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => (
        status === 'success' ? (
          <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="error">失败</Tag>
        )
      )
    },
    {
      title: '触发消息',
      dataIndex: 'triggeredBy',
      key: 'triggeredBy',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text}</span>
        </Tooltip>
      )
    },
    {
      title: '执行时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (timestamp: number) => new Date(timestamp).toLocaleString('zh-CN')
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      render: (duration: number) => `${duration}ms`
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      ellipsis: true,
      render: (result: any) => (
        <Tooltip title={JSON.stringify(result, null, 2)}>
          <span>{result.message || result.error || '查看详情'}</span>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: SkillLog) => (
        <Space>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteLog(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清空',
      content: `确定要清空 "${skill?.name}" 的所有执行日志吗？`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        clearLogs()
      }
    })
  }

  return (
    <Modal
      title={`执行日志 - ${skill?.name || ''}`}
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="clear" danger onClick={handleClearAll} disabled={logs.length === 0}>
          清空全部
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      {logs.length === 0 ? (
        <Empty description="暂无执行日志" />
      ) : (
        <>
          <div style={{ marginBottom: 16, color: '#666' }}>
            共 {logs.length} 条记录
          </div>
          <Table
            columns={columns}
            dataSource={logs}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`
            }}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '12px 24px', background: '#fafafa' }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>参数：</strong>
                    <pre style={{ marginTop: 8, padding: 12, background: '#fff', borderRadius: 4, overflow: 'auto' }}>
                      {JSON.stringify(record.params, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>完整结果：</strong>
                    <pre style={{ marginTop: 8, padding: 12, background: '#fff', borderRadius: 4, overflow: 'auto' }}>
                      {JSON.stringify(record.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )
            }}
          />
        </>
      )}
    </Modal>
  )
}
