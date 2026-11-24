/**
 * 自定义技能创建模态框
 */
import React from 'react'
import { Modal, Form, Input, Select, Button, message } from 'antd'
import type { Skill } from '@/stores/useSkillsStore'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (skill: Skill) => void
}

export default function CustomSkillModal({ open, onClose, onSave }: Props) {
  const [form] = Form.useForm()

  const handleCreate = () => {
    form.validateFields().then((values) => {
      const customSkill: Skill = {
        id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        name: values.name,
        description: values.description,
        category: values.category || 'general',
        triggers: values.triggers.split(',').map((t: string) => t.trim()).filter(Boolean),
        enabled: true,
        skillMdPath: values.mdContent
      }

      onSave(customSkill)
      message.success('自定义技能创建成功')
      form.resetFields()
      onClose()
    })
  }

  return (
    <Modal
      title="创建自定义技能"
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="create" type="primary" onClick={handleCreate}>
          创建技能
        </Button>
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="技能名称"
          name="name"
          rules={[{ required: true, message: '请输入技能名称' }]}
        >
          <Input placeholder="例如：自动回复客户" />
        </Form.Item>

        <Form.Item
          label="技能描述"
          name="description"
          rules={[{ required: true, message: '请输入技能描述' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="简要描述该技能的功能和用途"
          />
        </Form.Item>

        <Form.Item
          label="技能分类"
          name="category"
          initialValue="general"
        >
          <Select
            options={[
              { label: '通用技能', value: 'general' },
              { label: 'GGS 国际站', value: 'ggs' },
              { label: 'CGS 中国站', value: 'cgs' }
            ]}
          />
        </Form.Item>

        <Form.Item
          label="触发词"
          name="triggers"
          rules={[{ required: true, message: '请输入触发词' }]}
          extra="用逗号分隔多个触发词，例如：发品,上架商品,publish"
        >
          <Input placeholder="发品,上架商品,publish" />
        </Form.Item>

        <Form.Item
          label="Skill.md 内容（可选）"
          name="mdContent"
          extra="参考 MCP Skill 格式编写技能描述和执行逻辑"
        >
          <Input.TextArea
            rows={10}
            placeholder={`# 技能名称

## 描述
技能的详细描述

## 触发条件
- 关键词1
- 关键词2

## 执行步骤
1. 步骤1
2. 步骤2

## 参数
- param1: 参数1的描述
- param2: 参数2的描述

## 返回结果
返回结果的格式说明`}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
