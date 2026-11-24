import React, { useState, useMemo } from 'react'
import { Modal, Steps, Button, Input, Select, Space, Tag, message, Radio, Divider } from 'antd'
import { ClockCircleOutlined, CheckCircleFilled, ThunderboltOutlined } from '@ant-design/icons'
import { useSkillsStore } from '@/stores/useSkillsStore'
import { useTasksStore, type ScheduledTask } from '@/stores/useTasksStore'
import CronEditor from './CronEditor'
import './TaskCreateModal.css'

const { TextArea } = Input

export interface TaskCreateData {
  name: string
  description: string
  skillId: string
  skillName: string
  prompt: string
  frequency: string
  cronExpr?: string
  tags: string[]
  status: 'active' | 'paused'
}

interface TaskCreateModalProps {
  open: boolean
  onClose: () => void
  editingTask?: ScheduledTask | null
}

const FREQUENCY_OPTIONS = [
  { label: '每天', value: '每天' },
  { label: '每周', value: '每周' },
  { label: '每月', value: '每月' },
  { label: '自定义', value: '自定义' }
]

const TASK_TEMPLATES = [
  {
    name: 'RFQ 商机监控',
    description: '自动搜索最新 RFQ 询盘，筛选高价值商机',
    prompt: '请帮我搜索今天最新的 RFQ 询盘，重点关注电子产品类目，价值超过 $5000 的询盘，列出前 10 个最有价值的商机',
    skillId: 'alibaba-global-rfq-discovery',
    frequency: '每天',
    tags: ['RFQ', '商机']
  },
  {
    name: '店铺数据分析',
    description: '定期分析店铺运营数据，生成诊断报告',
    prompt: '请对我的店铺进行全面健康诊断，分析过去7天的访客、询盘、商品曝光数据，给出本周的运营建议',
    skillId: 'alibaba-global-smart-diagnose',
    frequency: '每周',
    tags: ['诊断', '数据']
  },
  {
    name: '竞品价格监控',
    description: '监控竞争对手价格变动，及时调整策略',
    prompt: '监控同类商品的竞品价格变化，分析市场趋势，给出我的定价建议',
    skillId: 'alibaba-global-market-insight',
    frequency: '每天',
    tags: ['竞品', '价格']
  }
]

export default function TaskCreateModal({ open, onClose, editingTask }: TaskCreateModalProps) {
  const skillsStore = useSkillsStore()
  const tasksStore = useTasksStore()

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Partial<TaskCreateData>>({
    name: '',
    description: '',
    skillId: '',
    skillName: '',
    prompt: '',
    frequency: '每天',
    cronExpr: '',
    tags: [],
    status: 'active'
  })
  const [tagInput, setTagInput] = useState('')
  const [showCronEditor, setShowCronEditor] = useState(false)

  // 初始化编辑数据
  React.useEffect(() => {
    if (editingTask) {
      setFormData({
        name: editingTask.name,
        description: editingTask.description,
        skillId: editingTask.skillId,
        skillName: editingTask.skillName,
        prompt: editingTask.prompt,
        frequency: editingTask.frequency,
        cronExpr: editingTask.cronExpr || '',
        tags: editingTask.tags,
        status: editingTask.status === 'running' || editingTask.status === 'failed'
          ? 'active'
          : editingTask.status
      })
      if (editingTask.cronExpr) {
        setShowCronEditor(true)
      }
    } else {
      resetForm()
    }
  }, [editingTask, open])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      skillId: '',
      skillName: '',
      prompt: '',
      frequency: '每天',
      cronExpr: '',
      tags: [],
      status: 'active'
    })
    setCurrentStep(0)
    setTagInput('')
    setShowCronEditor(false)
  }

  const updateField = <K extends keyof TaskCreateData>(key: K, value: TaskCreateData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateField('tags', [...(formData.tags || []), tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    updateField('tags', (formData.tags || []).filter(t => t !== tag))
  }

  const handleApplyTemplate = (template: typeof TASK_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      skillId: template.skillId,
      frequency: template.frequency,
      tags: template.tags
    })
    message.success('已应用模板')
  }

  const handleSkillChange = (skillId: string) => {
    const skill = skillsStore.allSkills.find(s => s.id === skillId)
    updateField('skillId', skillId)
    updateField('skillName', skill?.name || '')
  }

  const handleFrequencyChange = (freq: string) => {
    updateField('frequency', freq)
    setShowCronEditor(freq === '自定义')
  }

  const handleCronChange = (cron: string) => {
    updateField('cronExpr', cron)
  }

  const canGoNext = useMemo(() => {
    if (currentStep === 0) {
      return formData.name && formData.description
    }
    if (currentStep === 1) {
      return formData.skillId && formData.prompt
    }
    if (currentStep === 2) {
      if (formData.frequency === '自定义') {
        return formData.cronExpr
      }
      return formData.frequency
    }
    return true
  }, [currentStep, formData])

  const handleNext = () => {
    if (canGoNext) {
      setCurrentStep(prev => Math.min(prev + 1, 2))
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.skillId || !formData.prompt) {
      message.error('请完善任务信息')
      return
    }

    const taskData = {
      name: formData.name!,
      description: formData.description || '',
      skillId: formData.skillId!,
      skillName: formData.skillName!,
      prompt: formData.prompt!,
      frequency: formData.frequency!,
      cronExpr: formData.cronExpr,
      nextRunAt: new Date().toLocaleString('zh-CN'),
      status: formData.status!,
      tags: formData.tags || []
    }

    if (editingTask) {
      tasksStore.updateTask(editingTask.id, taskData)
      message.success('任务已更新')
    } else {
      tasksStore.createTask(taskData)
      message.success('任务已创建')
    }

    onClose()
    resetForm()
  }

  const handleCancel = () => {
    onClose()
    resetForm()
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="task-step-content">
            <div className="task-form-section">
              <h4>选择模板（可选）</h4>
              <div className="task-templates">
                {TASK_TEMPLATES.map((template, idx) => (
                  <div
                    key={idx}
                    className="task-template-card"
                    onClick={() => handleApplyTemplate(template)}
                  >
                    <div className="template-icon">
                      <ThunderboltOutlined />
                    </div>
                    <div className="template-info">
                      <div className="template-name">{template.name}</div>
                      <div className="template-desc">{template.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            <div className="task-form-section">
              <h4>基本信息</h4>
              <div className="form-item">
                <label>任务名称 *</label>
                <Input
                  placeholder="例如：每日 RFQ 商机筛选"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  maxLength={50}
                />
              </div>
              <div className="form-item">
                <label>任务描述</label>
                <TextArea
                  placeholder="描述任务的目的和预期结果"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={3}
                  maxLength={200}
                />
              </div>
              <div className="form-item">
                <label>标签</label>
                <Space.Compact style={{ width: '100%' }}>
                  <Input
                    placeholder="添加标签"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onPressEnter={handleAddTag}
                  />
                  <Button onClick={handleAddTag}>添加</Button>
                </Space.Compact>
                <div style={{ marginTop: 8 }}>
                  {formData.tags?.map(tag => (
                    <Tag key={tag} closable onClose={() => handleRemoveTag(tag)}>
                      {tag}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="task-step-content">
            <div className="task-form-section">
              <h4>执行配置</h4>
              <div className="form-item">
                <label>选择技能 *</label>
                <Select
                  placeholder="选择要执行的技能"
                  value={formData.skillId}
                  onChange={handleSkillChange}
                  style={{ width: '100%' }}
                  options={skillsStore.allSkills.map(skill => ({
                    label: skill.name,
                    value: skill.id
                  }))}
                />
              </div>
              <div className="form-item">
                <label>执行提示词 *</label>
                <TextArea
                  placeholder="输入传递给技能的提示词，例如：请帮我搜索今天最新的 RFQ 询盘..."
                  value={formData.prompt}
                  onChange={(e) => updateField('prompt', e.target.value)}
                  rows={6}
                  maxLength={1000}
                />
                <div className="form-hint">
                  提示词将在任务执行时传递给所选技能，可以包含具体的查询条件和需求
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="task-step-content">
            <div className="task-form-section">
              <h4>调度设置</h4>
              <div className="form-item">
                <label>执行频率 *</label>
                <Radio.Group
                  value={formData.frequency}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {FREQUENCY_OPTIONS.map(opt => (
                      <Radio key={opt.value} value={opt.value}>
                        {opt.label}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </div>

              {showCronEditor && (
                <div className="form-item">
                  <label>Cron 表达式</label>
                  <CronEditor
                    value={formData.cronExpr || ''}
                    onChange={handleCronChange}
                  />
                </div>
              )}

              <div className="form-item">
                <label>初始状态</label>
                <Radio.Group
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <Radio value="active">立即启动</Radio>
                  <Radio value="paused">创建后暂停</Radio>
                </Radio.Group>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const steps = [
    { title: '基本信息', icon: <ClockCircleOutlined /> },
    { title: '执行配置', icon: <ThunderboltOutlined /> },
    { title: '调度设置', icon: <CheckCircleFilled /> }
  ]

  return (
    <Modal
      title={editingTask ? '编辑定时任务' : '创建定时任务'}
      open={open}
      onCancel={handleCancel}
      width={700}
      footer={null}
      className="task-create-modal"
    >
      <div className="modal-body">
        <Steps current={currentStep} items={steps} className="task-steps" />

        <div className="step-content-wrapper">
          {renderStepContent()}
        </div>

        <div className="modal-footer">
          <Space>
            {currentStep > 0 && (
              <Button onClick={handlePrev}>上一步</Button>
            )}
            {currentStep < 2 ? (
              <Button type="primary" onClick={handleNext} disabled={!canGoNext}>
                下一步
              </Button>
            ) : (
              <Button type="primary" onClick={handleSubmit} disabled={!canGoNext}>
                {editingTask ? '保存' : '创建任务'}
              </Button>
            )}
            <Button onClick={handleCancel}>取消</Button>
          </Space>
        </div>
      </div>
    </Modal>
  )
}
