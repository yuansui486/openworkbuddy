/**
 * 技能配置模态框
 */
import React, { useState, useEffect } from 'react'
import { Modal, Form, Switch, Input, Select, Button, Space, Tag } from 'antd'
import type { Skill } from '@/stores/useSkillsStore'
import type { SkillConfig } from '@/services/skill-executor'

interface Props {
  skill: Skill | null
  open: boolean
  onClose: () => void
  onSave: (config: SkillConfig) => void
}

export default function SkillConfigModal({ skill, open, onClose, onSave }: Props) {
  const [form] = Form.useForm()
  const [autoExecute, setAutoExecute] = useState(false)

  useEffect(() => {
    if (skill && open) {
      form.setFieldsValue({
        enabled: skill.enabled,
        autoExecute: false,
        requireConfirm: true
      })
    }
  }, [skill, open, form])

  const handleSave = () => {
    form.validateFields().then((values) => {
      const config: SkillConfig = {
        enabled: values.enabled ?? true,
        autoExecute: values.autoExecute ?? false,
        requireConfirm: values.requireConfirm ?? true,
        params: values.params || {}
      }
      onSave(config)
      onClose()
    })
  }

  if (!skill) return null

  return (
    <Modal
      title={`配置技能 - ${skill.name}`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          保存配置
        </Button>
      ]}
      width={600}
    >
      <Form form={form} layout="vertical">
        <Form.Item label="启用状态" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item
          label="自动执行"
          name="autoExecute"
          valuePropName="checked"
          extra="触发时自动执行，无需确认（谨慎使用）"
        >
          <Switch onChange={setAutoExecute} />
        </Form.Item>

        <Form.Item
          label="执行前确认"
          name="requireConfirm"
          valuePropName="checked"
        >
          <Switch disabled={autoExecute} />
        </Form.Item>

        <Form.Item label="触发词">
          <Space size={[0, 8]} wrap>
            {skill.triggers.map((trigger, idx) => (
              <Tag key={idx} color="blue">
                {trigger}
              </Tag>
            ))}
          </Space>
        </Form.Item>

        <Form.Item label="技能描述">
          <div style={{ color: '#666', fontSize: 14 }}>{skill.description}</div>
        </Form.Item>

        {/* 可以根据不同技能添加特定参数配置 */}
        {renderSkillSpecificParams(skill, form)}
      </Form>
    </Modal>
  )
}

/**
 * 渲染技能特定参数
 */
function renderSkillSpecificParams(skill: Skill, form: any) {
  switch (skill.id) {
    case 'alibaba-global-smart-publish':
      return (
        <>
          <Form.Item label="默认分类" name={['params', 'defaultCategory']}>
            <Select
              placeholder="选择默认商品分类"
              options={[
                { label: '电子产品', value: 'electronics' },
                { label: '家居用品', value: 'home' },
                { label: '服装配饰', value: 'fashion' },
                { label: '五金工具', value: 'hardware' }
              ]}
            />
          </Form.Item>
          <Form.Item label="默认货币" name={['params', 'currency']}>
            <Select
              placeholder="选择默认货币"
              defaultValue="USD"
              options={[
                { label: 'USD', value: 'USD' },
                { label: 'EUR', value: 'EUR' },
                { label: 'CNY', value: 'CNY' }
              ]}
            />
          </Form.Item>
        </>
      )

    case 'alibaba-global-smart-optimize':
      return (
        <Form.Item label="优化字段" name={['params', 'optimizeFields']}>
          <Select
            mode="multiple"
            placeholder="选择要优化的字段"
            options={[
              { label: '标题', value: 'title' },
              { label: '描述', value: 'description' },
              { label: '关键词', value: 'keywords' },
              { label: '图片', value: 'images' },
              { label: '价格', value: 'price' }
            ]}
          />
        </Form.Item>
      )

    case 'alibaba-global-store-diagnosis':
      return (
        <Form.Item label="诊断周期" name={['params', 'period']}>
          <Select
            placeholder="选择诊断周期"
            defaultValue="month"
            options={[
              { label: '本周', value: 'week' },
              { label: '本月', value: 'month' },
              { label: '本季度', value: 'quarter' }
            ]}
          />
        </Form.Item>
      )

    case 'alibaba-global-logistics-assistant':
      return (
        <>
          <Form.Item label="默认发货地" name={['params', 'defaultFrom']}>
            <Input placeholder="例如: 深圳" />
          </Form.Item>
          <Form.Item label="默认运输方式" name={['params', 'defaultShipmentType']}>
            <Select
              placeholder="选择默认运输方式"
              options={[
                { label: '海运', value: 'sea' },
                { label: '空运', value: 'air' },
                { label: '快递', value: 'express' }
              ]}
            />
          </Form.Item>
        </>
      )

    default:
      return null
  }
}
