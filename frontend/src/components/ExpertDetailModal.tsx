import React, { useState, useEffect } from 'react'
import { Modal, Tabs, Switch, Button, Input, Tag, Space, Upload, message, Popconfirm } from 'antd'
import { CheckCircleFilled, SearchOutlined, UploadOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { usePluginsStore } from '@/stores/usePluginsStore'
import { useSkillsStore } from '@/stores/useSkillsStore'
import { useExpertsStore } from '@/stores/useExpertsStore'
import type { Expert } from '@/stores/useExpertsStore'
import './ExpertDetailModal.css'

const { TextArea } = Input

interface ExpertDetailModalProps {
  open: boolean
  expert: Expert | null
  onClose: () => void
  onSave?: (data: any) => void
}

export default function ExpertDetailModal({
  open,
  expert,
  onClose,
  onSave
}: ExpertDetailModalProps) {
  const pluginsStore = usePluginsStore()
  const skillsStore = useSkillsStore()
  const expertsStore = useExpertsStore()

  const [activeTab, setActiveTab] = useState('identity')

  // Form state
  const [name, setName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [enabledPlugins, setEnabledPlugins] = useState<string[]>([])
  const [enabledSkills, setEnabledSkills] = useState<string[]>([])
  const [systemPrompt, setSystemPrompt] = useState('')
  const [knowledgeFiles, setKnowledgeFiles] = useState<UploadFile[]>([])
  const [online, setOnline] = useState(true)
  const [allowTeamUse, setAllowTeamUse] = useState(true)

  // Initialize form data when expert changes
  useEffect(() => {
    if (expert) {
      setName(expert.name)
      setSpecialty(expert.specialty)
      setDescription(expert.description)
      setTags(expert.tags)
      setEnabledPlugins(expert.plugins || [])
      setEnabledSkills(expert.skills || [])
      setSystemPrompt(expert.systemPrompt || '')
      setKnowledgeFiles(
        (expert.knowledgeFiles || []).map((fileName, idx) => ({
          uid: `${idx}`,
          name: fileName,
          status: 'done'
        }))
      )
      setOnline(expert.online)
      setAllowTeamUse(true)
    }
  }, [expert])

  if (!expert) return null

  const handlePluginToggle = (pluginId: string) => {
    setEnabledPlugins(prev =>
      prev.includes(pluginId)
        ? prev.filter(id => id !== pluginId)
        : [...prev, pluginId]
    )
  }

  const handleSkillToggle = (skillId: string) => {
    setEnabledSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    )
  }

  const handleSave = () => {
    const updates = {
      name,
      specialty,
      description,
      tags,
      plugins: enabledPlugins,
      skills: enabledSkills,
      systemPrompt,
      knowledgeFiles: knowledgeFiles.map(f => f.name),
      online
    }

    onSave?.(updates)
    message.success('专家信息已保存')
  }

  const handleDelete = () => {
    if (expert) {
      expertsStore.deleteExpert(expert.id)
      message.success('专家已删除')
      onClose()
    }
  }

  const handleFileUpload = ({ fileList }: { fileList: UploadFile[] }) => {
    setKnowledgeFiles(fileList)
  }

  const handleFileRemove = (file: UploadFile) => {
    setKnowledgeFiles(prev => prev.filter(f => f.uid !== file.uid))
  }

  const tabItems = [
    {
      key: 'identity',
      label: '身份'
    },
    {
      key: 'plugins',
      label: '插件'
    },
    {
      key: 'skills',
      label: `技能 ${enabledSkills.length}`
    },
    {
      key: 'instructions',
      label: '核心指令'
    },
    {
      key: 'knowledge',
      label: '知识库'
    },
    {
      key: 'settings',
      label: '设置'
    }
  ]

  const installedPlugins = pluginsStore.installedPlugins
  const ggsSkills = skillsStore.ggsSkills
  const cgsSkills = skillsStore.cgsSkills

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      className="expert-detail-modal"
      destroyOnClose
    >
      <div className="expert-detail-container">
        {/* 左侧 Tab 导航 */}
        <div className="expert-detail-sidebar">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabPosition="left"
            items={tabItems}
            className="expert-detail-tabs"
          />
        </div>

        {/* 右侧内容区域 */}
        <div className="expert-detail-content">
          <div className="expert-detail-content-inner">
            {activeTab === 'identity' && (
              <div className="expert-detail-section">
                <h3 className="section-title">专家身份</h3>

                <div className="expert-identity-header">
                  <div
                    className="expert-identity-avatar"
                    style={{ background: expert.avatarColor }}
                  >
                    {expert.avatarText}
                  </div>
                  <div className="expert-identity-info">
                    <h2 className="expert-identity-name">{expert.name}</h2>
                    {expert.verified && (
                      <div className="expert-identity-badge">
                        <CheckCircleFilled style={{ color: '#1ead6f' }} />
                        <span>Accio 认证</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">专家名称</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：跨境贸易专家"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">专长</label>
                  <Input
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="例如：国际站运营 · RFQ · 买家管理"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">描述</label>
                  <TextArea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="介绍这位专家的能力和特长..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">标签</label>
                  <div className="expert-tags">
                    {tags.map((tag, idx) => (
                      <Tag
                        key={idx}
                        closable
                        onClose={() => setTags(tags.filter((_, i) => i !== idx))}
                        color="blue"
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'plugins' && (
              <div className="expert-detail-section">
                <h3 className="section-title">插件配置</h3>
                <p className="section-subtitle">
                  为专家启用插件以扩展其能力 ({enabledPlugins.length} 个已启用)
                </p>

                <div className="plugins-list">
                  {installedPlugins.map(plugin => {
                    const isEnabled = enabledPlugins.includes(plugin.id)
                    return (
                      <div key={plugin.id} className="plugin-item">
                        <div
                          className="plugin-icon"
                          style={{ background: plugin.iconColor }}
                        >
                          {plugin.iconText}
                        </div>
                        <div className="plugin-content">
                          <h4 className="plugin-name">{plugin.name}</h4>
                          <p className="plugin-description">{plugin.description}</p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onChange={() => handlePluginToggle(plugin.id)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="expert-detail-section">
                <h3 className="section-title">技能配置</h3>
                <p className="section-subtitle">
                  已启用 {enabledSkills.length} 个技能
                </p>

                <div className="skills-section">
                  <h4 className="skills-section-title">GGS 技能 (国际站)</h4>
                  <div className="skills-list">
                    {ggsSkills.map(skill => {
                      const isEnabled = enabledSkills.includes(skill.id)
                      return (
                        <div key={skill.id} className="skill-item">
                          <div className="skill-content">
                            <div className="skill-header">
                              <h4 className="skill-name">{skill.name}</h4>
                              <Tag color="blue">GGS</Tag>
                            </div>
                            <p className="skill-description">{skill.description}</p>
                            <div className="skill-triggers">
                              触发词: {skill.triggers.slice(0, 3).join(', ')}
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onChange={() => handleSkillToggle(skill.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="skills-section">
                  <h4 className="skills-section-title">CGS 技能 (中国站)</h4>
                  <div className="skills-list">
                    {cgsSkills.map(skill => {
                      const isEnabled = enabledSkills.includes(skill.id)
                      return (
                        <div key={skill.id} className="skill-item">
                          <div className="skill-content">
                            <div className="skill-header">
                              <h4 className="skill-name">{skill.name}</h4>
                              <Tag color="orange">CGS</Tag>
                            </div>
                            <p className="skill-description">{skill.description}</p>
                            <div className="skill-triggers">
                              触发词: {skill.triggers.slice(0, 3).join(', ')}
                            </div>
                          </div>
                          <Switch
                            checked={isEnabled}
                            onChange={() => handleSkillToggle(skill.id)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'instructions' && (
              <div className="expert-detail-section">
                <h3 className="section-title">核心指令</h3>
                <p className="section-subtitle">
                  定义专家的行为准则和回答风格
                </p>

                <div className="form-group">
                  <label className="form-label">系统提示词</label>
                  <TextArea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={16}
                    placeholder="输入专家的核心指令..."
                    style={{ fontFamily: 'monospace', fontSize: '13px' }}
                  />
                  <span className="form-hint">
                    定义专家的角色、能力和回答风格
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'knowledge' && (
              <div className="expert-detail-section">
                <h3 className="section-title">知识库</h3>
                <p className="section-subtitle">
                  上传文档以增强专家的专业知识 ({knowledgeFiles.length} 个文档)
                </p>

                <div className="form-group">
                  <Upload
                    fileList={knowledgeFiles}
                    onChange={handleFileUpload}
                    onRemove={handleFileRemove}
                    beforeUpload={() => false}
                    accept=".md,.txt,.pdf,.doc,.docx"
                    multiple
                  >
                    <Button icon={<UploadOutlined />} block>
                      上传文档（支持 .md, .txt, .pdf）
                    </Button>
                  </Upload>
                  <span className="form-hint">
                    文档将用于增强专家的知识库，支持 RAG 检索
                  </span>
                </div>

                {knowledgeFiles.length > 0 && (
                  <div className="knowledge-files-list">
                    {knowledgeFiles.map((file) => (
                      <div key={file.uid} className="knowledge-file-item">
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          {file.size && (
                            <span className="file-size">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleFileRemove(file)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="expert-detail-section">
                <h3 className="section-title">高级设置</h3>

                <div className="settings-group">
                  <div className="setting-item">
                    <div className="setting-info">
                      <h4 className="setting-name">在线状态</h4>
                      <p className="setting-description">控制专家是否对外可见</p>
                    </div>
                    <Switch checked={online} onChange={setOnline} />
                  </div>

                  <div className="setting-item">
                    <div className="setting-info">
                      <h4 className="setting-name">允许团队使用</h4>
                      <p className="setting-description">让团队成员可以使用此专家</p>
                    </div>
                    <Switch checked={allowTeamUse} onChange={setAllowTeamUse} />
                  </div>
                </div>

                <div className="danger-zone">
                  <h4 className="danger-zone-title">危险操作</h4>
                  <Popconfirm
                    title="确认删除专家？"
                    description="删除后无法恢复，确定要继续吗？"
                    onConfirm={handleDelete}
                    okText="确认删除"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />}>
                      删除专家
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            )}
          </div>

          {/* 底部保存按钮 - 固定在右下角 */}
          <div className="expert-detail-footer">
            <Space>
              <Button onClick={onClose}>取消</Button>
              <Button
                type="primary"
                onClick={handleSave}
                className="save-btn"
              >
                保存更改
              </Button>
            </Space>
          </div>
        </div>
      </div>
    </Modal>
  )
}
