import React, { useState } from 'react'
import { Card, Button, Empty, Badge, message, Select } from 'antd'
import { PlusOutlined, TeamOutlined, MessageOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useExpertsStore } from '@/stores/useExpertsStore'
import PageHeader from '@/components/PageHeader'
import ExpertGroupModal from '@/components/ExpertGroupModal'
import './ExpertGroupsView.css'

export default function ExpertGroupsView() {
  const navigate = useNavigate()
  const expertsStore = useExpertsStore()
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [searchText, setSearchText] = useState('')

  const handleCreateTeam = () => {
    setGroupModalOpen(true)
  }

  const handleTeamCreate = (name: string, description: string, memberIds: string[]) => {
    expertsStore.createTeam(name, description, memberIds)
    message.success(`群聊"${name}"创建成功！`)
    setGroupModalOpen(false)
  }

  const handleStartChat = (groupId: string) => {
    navigate('/chat')
  }

  const filteredGroups = expertsStore.expertTeams.filter(group => {
    if (!searchText) return true
    const query = searchText.toLowerCase()
    return (
      group.name.toLowerCase().includes(query) ||
      group.description.toLowerCase().includes(query)
    )
  })

  return (
    <div className="expert-groups-view">
      <PageHeader
        title="专家组"
        showTutorial={true}
        searchPlaceholder="搜索专家组"
        onSearch={setSearchText}
        primaryAction={{
          label: '创建群聊',
          icon: <TeamOutlined />,
          onClick: handleCreateTeam
        }}
      />

      <div className="expert-groups-container">
        <p className="expert-groups-subtitle">
          已创建 {filteredGroups.length} 个专家组
        </p>

        <div className="expert-groups-grid">
          {filteredGroups.length === 0 ? (
            <Empty description="未找到匹配的专家组">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateTeam}>
                创建群聊
              </Button>
            </Empty>
          ) : (
            filteredGroups.map(group => (
              <Card
                key={group.id}
                hoverable
                className="expert-group-card"
              >
                {/* 群组图标 */}
                <div className="group-avatar">
                  <TeamOutlined />
                </div>

                {/* 群组名称 */}
                <h3 className="group-name">{group.name}</h3>

                {/* 成员数量 */}
                <Badge
                  count={group.members.length}
                  style={{ backgroundColor: '#52c41a' }}
                  className="group-member-count"
                >
                  <span style={{ marginRight: 8 }}>成员</span>
                </Badge>

                {/* 描述 */}
                <p className="group-description">{group.description}</p>

                {/* 成员列表预览 */}
                <div className="group-members-preview">
                  {group.members.slice(0, 3).map(expert => (
                    <div
                      key={expert.id}
                      className="member-avatar-small"
                      style={{ backgroundColor: expert.avatarColor }}
                      title={expert.name}
                    >
                      {expert.avatarText}
                    </div>
                  ))}
                  {group.members.length > 3 && (
                    <div className="member-more">+{group.members.length - 3}</div>
                  )}
                </div>

                {/* 对话按钮 */}
                <Button
                  block
                  className="group-chat-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartChat(group.id)
                  }}
                >
                  <MessageOutlined /> 群聊
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 创建群聊弹窗 */}
      <ExpertGroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onCreate={handleTeamCreate}
      />
    </div>
  )
}
