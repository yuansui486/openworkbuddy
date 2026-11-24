import React, { useState, useMemo } from 'react'
import {
  Card,
  Input,
  Tabs,
  Tag,
  Empty,
  Switch,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  message
} from 'antd'
import {
  SearchOutlined,
  SettingOutlined,
  HistoryOutlined,
  PlusOutlined,
  ThunderboltOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useSkillsStore } from '@/stores/useSkillsStore'
import { useSkillLogsStore } from '@/stores/useSkillLogsStore'
import { skillExecutor } from '@/services/skill-executor'
import SkillConfigModal from '@/components/SkillConfigModal'
import SkillLogsModal from '@/components/SkillLogsModal'
import CustomSkillModal from '@/components/CustomSkillModal'
import type { Skill } from '@/stores/useSkillsStore'
import type { SkillConfig } from '@/services/skill-executor'
import './SkillsView.css'

const { Search } = Input

export default function SkillsView() {
  const navigate = useNavigate()
  const skillsStore = useSkillsStore()
  const logsStore = useSkillLogsStore()

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'ggs' | 'cgs' | 'custom'>('all')
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [customModalOpen, setCustomModalOpen] = useState(false)

  // 获取所有技能
  const allSkills = useMemo(() => skillsStore.getAllSkills(), [skillsStore])

  // 过滤技能
  const filteredSkills = useMemo(() => {
    let list = allSkills

    // 按分类过滤
    if (activeTab === 'ggs') {
      list = list.filter((s) => s.category === 'ggs')
    } else if (activeTab === 'cgs') {
      list = list.filter((s) => s.category === 'cgs')
    } else if (activeTab === 'custom') {
      list = skillsStore.customSkills
    }

    // 按搜索词过滤
    if (searchText) {
      const query = searchText.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.triggers?.some((t) => t.toLowerCase().includes(query))
      )
    }

    return list
  }, [searchText, activeTab, allSkills, skillsStore.customSkills])

  // 统计数据
  const stats = useMemo(() => {
    const totalSkills = allSkills.length
    const enabledSkills = allSkills.filter((s) => s.enabled).length
    const totalLogs = logsStore.logs.length
    const successRate =
      totalLogs > 0
        ? ((logsStore.logs.filter((l) => l.status === 'success').length / totalLogs) * 100).toFixed(1)
        : '0.0'

    return { totalSkills, enabledSkills, totalLogs, successRate }
  }, [allSkills, logsStore.logs])

  const handleToggleSkill = (skillId: string, enabled: boolean) => {
    skillsStore.toggleSkill(skillId, enabled)
    message.success(enabled ? '技能已启用' : '技能已禁用')
  }

  const handleStartSkill = (skill: Skill) => {
    skillsStore.setActiveSkill(skill.id)
    navigate('/chat')
  }

  const handleOpenConfig = (skill: Skill) => {
    setSelectedSkill(skill)
    setConfigModalOpen(true)
  }

  const handleOpenLogs = (skill: Skill) => {
    setSelectedSkill(skill)
    setLogsModalOpen(true)
  }

  const handleSaveConfig = (config: SkillConfig) => {
    if (selectedSkill) {
      skillsStore.updateSkillConfig(selectedSkill.id, config)
      if (config.enabled !== undefined) {
        skillsStore.toggleSkill(selectedSkill.id, config.enabled)
      }
      message.success('配置已保存')
    }
  }

  const handleSaveCustomSkill = (skill: Skill) => {
    skillsStore.addCustomSkill(skill)
  }

  const handleTestSkill = async (skill: Skill) => {
    message.loading({ content: '正在测试技能...', key: 'test' })

    const result = await skillExecutor.executeSkill(
      skill,
      { message: `测试 ${skill.name}` },
      skillsStore.getSkillConfig(skill.id)
    )

    if (result.success) {
      message.success({ content: '技能测试成功！', key: 'test' })
    } else {
      message.error({ content: `测试失败: ${result.error}`, key: 'test' })
    }
  }

  return (
    <div className="skills-view">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="技能总数" value={stats.totalSkills} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已启用"
              value={stats.enabledSkills}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="执行次数" value={stats.totalLogs} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成功率"
              value={stats.successRate}
              suffix="%"
              valueStyle={{ color: Number(stats.successRate) > 80 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索栏 */}
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <Space.Compact style={{ width: '100%' }}>
          <Search
            placeholder="搜索技能名称、描述或触发词..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            prefix={<SearchOutlined />}
            allowClear
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setCustomModalOpen(true)}
          >
            创建自定义技能
          </Button>
        </Space.Compact>
      </div>

      {/* 分类标签 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as any)}
        items={[
          { key: 'all', label: `全部 (${allSkills.length})` },
          { key: 'ggs', label: `国际站 (${skillsStore.ggsSkills.length})` },
          { key: 'cgs', label: `中国站 (${skillsStore.cgsSkills.length})` },
          { key: 'custom', label: `自定义 (${skillsStore.customSkills.length})` }
        ]}
      />

      {/* 技能卡片网格 */}
      <div className="skills-grid">
        {filteredSkills.length === 0 ? (
          <Empty description="未找到匹配的技能" />
        ) : (
          filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              className={`skill-card ${!skill.enabled ? 'disabled' : ''}`}
              hoverable
            >
              <div className="skill-header">
                <h3 className="skill-name">{skill.name}</h3>
                <Switch
                  checked={skill.enabled}
                  onChange={(checked) => handleToggleSkill(skill.id, checked)}
                  size="small"
                />
              </div>

              <p className="skill-description">{skill.description}</p>

              <div className="skill-triggers">
                {skill.triggers.slice(0, 4).map((trigger, idx) => (
                  <Tag key={idx} color="blue">
                    {trigger}
                  </Tag>
                ))}
                {skill.triggers.length > 4 && (
                  <Tag>+{skill.triggers.length - 4}</Tag>
                )}
              </div>

              <div className="skill-category">
                <Tag
                  color={
                    skill.category === 'ggs'
                      ? 'orange'
                      : skill.category === 'cgs'
                      ? 'green'
                      : 'default'
                  }
                >
                  {skill.category === 'ggs'
                    ? '国际站'
                    : skill.category === 'cgs'
                    ? '中国站'
                    : '自定义'}
                </Tag>
              </div>

              <div className="skill-actions">
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => handleStartSkill(skill)}
                    disabled={!skill.enabled}
                  >
                    使用
                  </Button>
                  <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleTestSkill(skill)}
                    disabled={!skill.enabled}
                  >
                    测试
                  </Button>
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => handleOpenConfig(skill)}
                  >
                    配置
                  </Button>
                  <Button
                    size="small"
                    icon={<HistoryOutlined />}
                    onClick={() => handleOpenLogs(skill)}
                  >
                    日志
                  </Button>
                </Space>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 配置模态框 */}
      <SkillConfigModal
        skill={selectedSkill}
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onSave={handleSaveConfig}
      />

      {/* 日志模态框 */}
      <SkillLogsModal
        skill={selectedSkill}
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
      />

      {/* 自定义技能创建模态框 */}
      <CustomSkillModal
        open={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleSaveCustomSkill}
      />
    </div>
  )
}
