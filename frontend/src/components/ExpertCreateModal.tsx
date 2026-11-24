import React, { useState, useMemo } from 'react'
import { Modal, Steps, Button, Input, Upload, Select, Switch, Space, Tag, message, Radio } from 'antd'
import { PlusOutlined, UploadOutlined, CheckCircleFilled } from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { useSkillsStore } from '@/stores/useSkillsStore'
import { usePluginsStore } from '@/stores/usePluginsStore'
import './ExpertCreateModal.css'

const { TextArea } = Input

export interface ExpertCreateData {
  name: string
  avatarColor: string
  avatarText: string
  specialty: string
  description: string
  tags: string[]
  enabledPlugins: string[]
  enabledSkills: string[]
  systemPrompt: string
  knowledgeFiles: UploadFile[]
}

interface ExpertCreateModalProps {
  open: boolean
  onClose: () => void
  onCreate: (data: ExpertCreateData) => void
}

const AVATAR_COLORS = [
  '#1677ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96',
  '#13c2c2', '#faad14', '#f5222d', '#2f54eb', '#a0d911'
]

const PROMPT_TEMPLATES = [
  {
    id: 'professional',
    name: '专业顾问',
    template: `你是{{name}}，{{description}}

在回答问题时，你应该：
1. 保持专业和友好的态度
2. 提供准确、实用的建议
3. 结合实际案例说明
4. 主动提供相关的延伸知识

请始终记住你的专长是：{{specialty}}`
  },
  {
    id: 'casual',
    name: '轻松对话',
    template: `嗨！我是{{name}}，{{description}}

我的风格：
- 用轻松幽默的方式交流
- 化繁为简，通俗易懂
- 多用实际例子
- 保持耐心，随时解答疑问

我最擅长的是：{{specialty}}`
  },
  {
    id: 'analytical',
    name: '数据分析',
    template: `你是{{name}}，一位数据驱动的专家。{{description}}

工作方式：
1. 基于数据和事实进行分析
2. 提供量化的洞察和建议
3. 使用图表和可视化辅助说明
4. 给出可执行的优化方案

核心能力：{{specialty}}`
  }
]

export default function ExpertCreateModal({ open, onClose, onCreate }: ExpertCreateModalProps) {
  const skillsStore = useSkillsStore()
  const pluginsStore = usePluginsStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<ExpertCreateData>>({
    avatarColor: AVATAR_COLORS[0],
    avatarText: '',
    name: '',
    specialty: '',
    description: '',
    tags: [],
    enabledPlugins: [],
    enabledSkills: [],
    systemPrompt: '',
    knowledgeFiles: []
  })

  const [tagInput, setTagInput] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('professional')

  const updateField = <K extends keyof ExpertCreateData>(key: K, value: ExpertCreateData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateField('tags', [...(formData.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    updateField('tags', formData.tags?.filter(t => t !== tag) || [])
  }

  const togglePlugin = (pluginId: string) => {
    const current = formData.enabledPlugins || []
    updateField(
      'enabledPlugins',
      current.includes(pluginId)
        ? current.filter(id => id !== pluginId)
        : [...current, pluginId]
    )
  }

  const toggleSkill = (skillId: string) => {
    const current = formData.enabledSkills || []
    updateField(
      'enabledSkills',
      current.includes(skillId)
        ? current.filter(id => id !== skillId)
        : [...current, skillId]
    )
  }

  const applyTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      let prompt = template.template
      prompt = prompt.replace(/\{\{name\}\}/g, formData.name || '专家')
      prompt = prompt.replace(/\{\{description\}\}/g, formData.description || '')
      prompt = prompt.replace(/\{\{specialty\}\}/g, formData.specialty || '')
      updateField('systemPrompt', prompt)
      setSelectedTemplate(templateId)
    }
  }

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: // 基础信息
        return Boolean(formData.name && formData.specialty && formData.description)
      case 1: // 插件
      case 2: // 技能
      case 4: // 知识库
        return true
      case 3: // 核心指令
        return Boolean(formData.systemPrompt)
      default:
        return true
    }
  }, [currentStep, formData])

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreate = () => {
    if (!formData.name || !formData.specialty || !formData.description || !formData.systemPrompt) {
      message.error('请完成所有必填项')
      return
    }

    onCreate({
      name: formData.name,
      avatarColor: formData.avatarColor || AVATAR_COLORS[0],
      avatarText: formData.avatarText || formData.name.charAt(0),
      specialty: formData.specialty,
      description: formData.description,
      tags: formData.tags || [],
      enabledPlugins: formData.enabledPlugins || [],
      enabledSkills: formData.enabledSkills || [],
      systemPrompt: formData.systemPrompt,
      knowledgeFiles: formData.knowledgeFiles || []
    })

    // Reset form
    setFormData({
      avatarColor: AVATAR_COLORS[0],
      avatarText: '',
      name: '',
      specialty: '',
      description: '',
      tags: [],
      enabledPlugins: [],
      enabledSkills: [],
      systemPrompt: '',
      knowledgeFiles: []
    })
    setCurrentStep(0)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <h3 className="step-title">基础信息</h3>
            <p className="step-subtitle">设置专家的基本身份信息</p>

            <div className="form-group">
              <label className="form-label required">专家名称</label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value
                  updateField('name', name)
                  if (!formData.avatarText || formData.avatarText === formData.name?.charAt(0)) {
                    updateField('avatarText', name.charAt(0))
                  }
                }}
                placeholder="例如：跨境贸易专家"
                maxLength={30}
              />
            </div>

            <div className="form-group">
              <label className="form-label">头像</label>
              <div className="avatar-selector">
                <div
                  className="avatar-preview"
                  style={{ backgroundColor: formData.avatarColor }}
                >
                  {formData.avatarText || '?'}
                </div>
                <div className="avatar-controls">
                  <Input
                    value={formData.avatarText}
                    onChange={(e) => updateField('avatarText', e.target.value)}
                    placeholder="头像文字（1-2字）"
                    maxLength={2}
                    style={{ width: 150 }}
                  />
                  <div className="color-picker">
                    {AVATAR_COLORS.map(color => (
                      <div
                        key={color}
                        className={`color-option ${formData.avatarColor === color ? 'active' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateField('avatarColor', color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label required">专长描述</label>
              <Input
                value={formData.specialty}
                onChange={(e) => updateField('specialty', e.target.value)}
                placeholder="例如：国际站运营 · RFQ · 买家管理"
                maxLength={50}
              />
              <span className="form-hint">简短描述专家的核心能力，用 · 分隔多个领域</span>
            </div>

            <div className="form-group">
              <label className="form-label required">详细描述</label>
              <TextArea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="详细介绍这位专家的能力、经验和特长..."
                rows={4}
                maxLength={200}
                showCount
              />
            </div>

            <div className="form-group">
              <label className="form-label">标签</label>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onPressEnter={handleAddTag}
                  placeholder="添加标签，按回车确认"
                />
                <Button type="primary" onClick={handleAddTag}>
                  <PlusOutlined /> 添加
                </Button>
              </Space.Compact>
              {formData.tags && formData.tags.length > 0 && (
                <div className="tags-display">
                  {formData.tags.map((tag, idx) => (
                    <Tag
                      key={idx}
                      closable
                      onClose={() => handleRemoveTag(tag)}
                      color="blue"
                    >
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case 1:
        return (
          <div className="step-content">
            <h3 className="step-title">选择插件</h3>
            <p className="step-subtitle">
              已选择 {formData.enabledPlugins?.length || 0} 个插件
            </p>

            <div className="plugins-grid">
              {pluginsStore.installedPlugins.map(plugin => {
                const isEnabled = formData.enabledPlugins?.includes(plugin.id)
                return (
                  <div
                    key={plugin.id}
                    className={`plugin-select-card ${isEnabled ? 'selected' : ''}`}
                    onClick={() => togglePlugin(plugin.id)}
                  >
                    <div className="plugin-select-header">
                      <div
                        className="plugin-select-icon"
                        style={{ backgroundColor: plugin.iconColor }}
                      >
                        {plugin.iconText}
                      </div>
                      <Switch
                        checked={isEnabled}
                        onChange={(checked, e) => {
                          e.stopPropagation()
                          togglePlugin(plugin.id)
                        }}
                      />
                    </div>
                    <h4 className="plugin-select-name">{plugin.name}</h4>
                    <p className="plugin-select-desc">{plugin.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case 2:
        const ggsSkills = skillsStore.ggsSkills
        const cgsSkills = skillsStore.cgsSkills
        return (
          <div className="step-content">
            <h3 className="step-title">配置技能</h3>
            <p className="step-subtitle">
              已选择 {formData.enabledSkills?.length || 0} 个技能
            </p>

            <div className="skills-section">
              <h4 className="skills-section-title">GGS 技能 (国际站)</h4>
              <div className="skills-list">
                {ggsSkills.map(skill => {
                  const isEnabled = formData.enabledSkills?.includes(skill.id)
                  return (
                    <div key={skill.id} className="skill-select-item">
                      <div className="skill-select-content">
                        <div className="skill-select-header">
                          <h4 className="skill-select-name">{skill.name}</h4>
                          <Tag color="blue">GGS</Tag>
                        </div>
                        <p className="skill-select-desc">{skill.description}</p>
                        <div className="skill-triggers">
                          触发词: {skill.triggers.slice(0, 3).join(', ')}
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onChange={() => toggleSkill(skill.id)}
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
                  const isEnabled = formData.enabledSkills?.includes(skill.id)
                  return (
                    <div key={skill.id} className="skill-select-item">
                      <div className="skill-select-content">
                        <div className="skill-select-header">
                          <h4 className="skill-select-name">{skill.name}</h4>
                          <Tag color="orange">CGS</Tag>
                        </div>
                        <p className="skill-select-desc">{skill.description}</p>
                        <div className="skill-triggers">
                          触发词: {skill.triggers.slice(0, 3).join(', ')}
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onChange={() => toggleSkill(skill.id)}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="step-content">
            <h3 className="step-title">核心指令</h3>
            <p className="step-subtitle">定义专家的行为准则和回答风格</p>

            <div className="form-group">
              <label className="form-label">选择模板</label>
              <Radio.Group
                value={selectedTemplate}
                onChange={(e) => applyTemplate(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {PROMPT_TEMPLATES.map(template => (
                    <Radio key={template.id} value={template.id}>
                      <strong>{template.name}</strong>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>

            <div className="form-group">
              <label className="form-label required">系统提示词</label>
              <TextArea
                value={formData.systemPrompt}
                onChange={(e) => updateField('systemPrompt', e.target.value)}
                placeholder="输入专家的核心指令..."
                rows={16}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
              <span className="form-hint">
                支持变量：{'{{name}}'}, {'{{specialty}}'}, {'{{description}}'}
              </span>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="step-content">
            <h3 className="step-title">知识库（可选）</h3>
            <p className="step-subtitle">上传文档以增强专家的专业知识</p>

            <div className="form-group">
              <Upload
                fileList={formData.knowledgeFiles}
                onChange={({ fileList }) => updateField('knowledgeFiles', fileList)}
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

            {formData.knowledgeFiles && formData.knowledgeFiles.length > 0 && (
              <div className="files-list">
                {formData.knowledgeFiles.map((file, idx) => (
                  <div key={idx} className="file-item">
                    <span>{file.name}</span>
                    <span className="file-size">
                      {((file.size || 0) / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 5:
        return (
          <div className="step-content">
            <h3 className="step-title">确认创建</h3>
            <p className="step-subtitle">预览专家配置</p>

            <div className="preview-card">
              <div className="preview-header">
                <div
                  className="preview-avatar"
                  style={{ backgroundColor: formData.avatarColor }}
                >
                  {formData.avatarText}
                </div>
                <div>
                  <h3>{formData.name}</h3>
                  <p className="preview-specialty">{formData.specialty}</p>
                </div>
              </div>

              <div className="preview-section">
                <strong>描述</strong>
                <p>{formData.description}</p>
              </div>

              <div className="preview-section">
                <strong>标签</strong>
                <div className="tags-display">
                  {formData.tags?.map((tag, idx) => (
                    <Tag key={idx} color="blue">{tag}</Tag>
                  ))}
                </div>
              </div>

              <div className="preview-section">
                <strong>插件</strong>
                <p>{formData.enabledPlugins?.length || 0} 个已启用</p>
              </div>

              <div className="preview-section">
                <strong>技能</strong>
                <p>{formData.enabledSkills?.length || 0} 个已启用</p>
              </div>

              <div className="preview-section">
                <strong>知识库</strong>
                <p>{formData.knowledgeFiles?.length || 0} 个文档</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      className="expert-create-modal"
      destroyOnClose
    >
      <div className="expert-create-container">
        <Steps
          current={currentStep}
          items={[
            { title: '基础信息' },
            { title: '插件' },
            { title: '技能' },
            { title: '核心指令' },
            { title: '知识库' },
            { title: '确认' }
          ]}
          className="expert-create-steps"
        />

        <div className="expert-create-content">
          {renderStepContent()}
        </div>

        <div className="expert-create-footer">
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>上一步</Button>
            )}
            {currentStep < 5 ? (
              <Button
                type="primary"
                onClick={handleNext}
                disabled={!canGoNext}
              >
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                onClick={handleCreate}
              >
                <CheckCircleFilled /> 创建专家
              </Button>
            )}
          </Space>
        </div>
      </div>
    </Modal>
  )
}
