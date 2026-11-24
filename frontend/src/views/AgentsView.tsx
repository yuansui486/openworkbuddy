import React from 'react'
import { Card, Empty } from 'antd'
import { RobotOutlined } from '@ant-design/icons'

export default function AgentsView() {
  const agents = [
    { id: '1', name: '技能执行器', description: '自动执行选定的技能任务' },
    { id: '2', name: '智能接待', description: '24小时自动回复客户询盘' },
    { id: '3', name: '询盘分析', description: '自动分析并分类 RFQ 询盘' }
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {agents.map(agent => (
          <Card key={agent.id} hoverable>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <RobotOutlined style={{ fontSize: 48, color: '#1677ff' }} />
            </div>
            <div style={{ fontWeight: 500, marginBottom: 8, textAlign: 'center' }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>{agent.description}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}
