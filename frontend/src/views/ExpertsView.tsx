import React, { useState, useMemo } from 'react'
import { Card, Tabs, Tag, Button, Badge, Select, message } from 'antd'
import { UserOutlined, MessageOutlined, CheckCircleFilled, TeamOutlined, RobotOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useExpertsStore } from '@/stores/useExpertsStore'
import { useSkillsStore } from '@/stores/useSkillsStore'
import PageHeader from '@/components/PageHeader'
import ExpertDetailModal from '@/components/ExpertDetailModal'
import ExpertCreateModal, { type ExpertCreateData } from '@/components/ExpertCreateModal'
import ExpertGroupModal from '@/components/ExpertGroupModal'
import EmptyState from '@/components/common/EmptyState'
import type { Expert } from '@/stores/useExpertsStore'
import './ExpertsView.css'

export default function ExpertsView() {
  const navigate = useNavigate()
  const expertsStore = useExpertsStore()
  const skillsStore = useSkillsStore()

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('my')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'rating'>('default')
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)

  const filteredExperts = useMemo(() => {
    let result = expertsStore.experts

    // 搜索过滤
    if (searchText) {
      const query = searchText.toLowerCase()
      result = result.filter(expert =>
        expert.name.toLowerCase().includes(query) ||
        expert.tags.some(tag => tag.toLowerCase().includes(query)) ||
        expert.description.toLowerCase().includes(query) ||
        expert.specialty.toLowerCase().includes(query)
      )
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter)
    }

    // 排序
    if (sortBy === 'rating') {
      result = [...result].sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [searchText, expertsStore.experts, categoryFilter, sortBy])

  const handleStartChat = (expertId: string) => {
    skillsStore.setActiveSkill(null)
    navigate('/chat')
  }

  const handleExpertClick = (expert: Expert) => {
    setSelectedExpert(expert)
    setDetailModalOpen(true)
  }

  const handleCreateExpert = () => {
    setCreateModalOpen(true)
  }

  const handleCreateTeam = () => {
    setGroupModalOpen(true)
  }

  const handleExpertCreate = (data: ExpertCreateData) => {
    const newExpert = expertsStore.addExpert({
      name: data.name,
      avatarColor: data.avatarColor,
      avatarText: data.avatarText,
      specialty: data.specialty,
      description: data.description,
      tags: data.tags,
      skills: data.enabledSkills,
      plugins: data.enabledPlugins,
      systemPrompt: data.systemPrompt,
      knowledgeFiles: data.knowledgeFiles.map(f => f.name),
      online: true,
      category: 'ecommerce'
    })

    message.success(`专家"${newExpert.name}"创建成功！`)
    setCreateModalOpen(false)
  }

  const handleTeamCreate = (name: string, description: string, memberIds: string[]) => {
    expertsStore.createTeam(name, description, memberIds)
    message.success(`群聊"${name}"创建成功！`)
    setGroupModalOpen(false)
  }

  const handleExpertSave = (data: any) => {
    if (selectedExpert) {
      expertsStore.updateExpert(selectedExpert.id, data)
      message.success('专家信息已更新')
      setDetailModalOpen(false)
      setSelectedExpert(null)
    }
  }

  return (
    <div className="experts-view">
      {/* PageHeader - 精确复刻 */}
      <PageHeader
        title="专家"
        showTutorial={true}
        searchPlaceholder="搜索专家"
        onSearch={setSearchText}
        primaryAction={{
          label: '创建专家',
          icon: <UserOutlined />,
          onClick: handleCreateExpert
        }}
        secondaryAction={{
          label: '创建群聊',
          icon: <TeamOutlined />,
          onClick: handleCreateTeam
        }}
      />

      {/* 主内容区 */}
      <div className="experts-container">
        {/* Tab 切换 */}
        <div className="experts-tabs">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'my', label: '我的' },
              { key: 'market', label: '市场' }
            ]}
          />
        </div>

        {/* 筛选和排序 */}
        {activeTab === 'my' && (
          <div className="experts-filters">
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 150 }}
              options={[
                { label: '全部分类', value: 'all' },
                { label: '电商运营', value: 'ecommerce' },
                { label: '数据分析', value: 'data' },
                { label: '物流', value: 'logistics' }
              ]}
            />
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 150 }}
              options={[
                { label: '默认排序', value: 'default' },
                { label: '按名称', value: 'name' },
                { label: '按评分', value: 'rating' }
              ]}
            />
          </div>
        )}

        {/* 副标题 */}
        <p className="experts-subtitle">
          {activeTab === 'my'
            ? `已创建 ${filteredExperts.length} 个专家`
            : '探索社区分享的专家'}
        </p>

        {/* 专家卡片网格 */}
        <div className="experts-grid">
          {filteredExperts.length === 0 ? (
            searchText || categoryFilter !== 'all' ? (
              <EmptyState
                icon={<RobotOutlined />}
                title="未找到匹配的专家"
                description="尝试调整搜索条件或筛选器"
              />
            ) : (
              <EmptyState
                icon={<RobotOutlined />}
                title="还没有专家"
                description="创建您的第一个 AI 专家，让它帮助您处理业务任务"
                action={{
                  text: '创建专家',
                  onClick: handleCreateExpert
                }}
              />
            )
          ) : (
            filteredExperts.map(expert => (
              <Card
                key={expert.id}
                hoverable
                className="expert-card"
                onClick={() => handleExpertClick(expert)}
              >
                {/* 头像 - 72px 圆形 */}
                <div
                  className="expert-avatar"
                  style={{ backgroundColor: expert.avatarColor }}
                >
                  {expert.avatarText}
                </div>

                {/* 名称 */}
                <h3 className="expert-name">{expert.name}</h3>

                {/* Accio 徽章 */}
                {expert.verified && (
                  <Badge className="expert-badge">
                    <CheckCircleFilled /> Accio
                  </Badge>
                )}

                {/* 描述 - 2行截断 */}
                <p className="expert-description">{expert.description}</p>

                {/* 对话按钮 */}
                <Button
                  block
                  className="expert-chat-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStartChat(expert.id)
                  }}
                >
                  <MessageOutlined /> 对话
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* 专家详情弹窗 */}
      <ExpertDetailModal
        open={detailModalOpen}
        expert={selectedExpert}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedExpert(null)
        }}
        onSave={handleExpertSave}
      />

      {/* 创建专家弹窗 */}
      <ExpertCreateModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleExpertCreate}
      />

      {/* 创建群聊弹窗 */}
      <ExpertGroupModal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        onCreate={handleTeamCreate}
      />
    </div>
  )
}
