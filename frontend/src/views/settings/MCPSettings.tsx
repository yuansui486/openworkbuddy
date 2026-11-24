import React, { useState } from 'react'
import { Card, Form, Input, Button, Alert, Space, message } from 'antd'
import { ApiOutlined } from '@ant-design/icons'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { testConnection } from '@/services/llm'
import { pingGateway } from '@/services/mcp'

const { TextArea } = Input

export default function MCPSettings() {
  const settingsStore = useSettingsStore()
  const [llmForm] = Form.useForm()
  const [testingLLM, setTestingLLM] = useState(false)
  const [pingingGateway, setPingingGateway] = useState(false)
  const [gatewayStatus, setGatewayStatus] = useState<'unknown' | 'ok' | 'fail'>('unknown')

  const handleTestLLM = async () => {
    setTestingLLM(true)
    try {
      const values = llmForm.getFieldsValue()
      const success = await testConnection(values)
      if (success) {
        message.success('LLM 接口连接成功！')
      } else {
        message.error('连接失败，请检查配置')
      }
    } catch (error) {
      message.error(`连接失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setTestingLLM(false)
    }
  }

  const handleSaveLLM = () => {
    const values = llmForm.getFieldsValue()
    settingsStore.saveLLM(values)
    message.success('LLM 配置已保存')
  }

  const handlePingGateway = async () => {
    setPingingGateway(true)
    try {
      const ok = await pingGateway()
      setGatewayStatus(ok ? 'ok' : 'fail')
      if (ok) {
        message.success('MCP 网关连接正常')
      } else {
        message.warning('MCP 网关无法连接，请确认 Gateway 服务正在运行')
      }
    } catch {
      setGatewayStatus('fail')
      message.error('网关检测失败')
    } finally {
      setPingingGateway(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>MCP 配置</h2>

      {/* LLM 配置 */}
      <Card title={<><ApiOutlined /> LLM 接口配置</>} style={{ marginBottom: 16 }}>
        <Form
          form={llmForm}
          layout="vertical"
          initialValues={settingsStore.llm}
        >
          <Form.Item
            label="Base URL"
            name="baseURL"
            rules={[{ required: true, message: '请输入 Base URL' }]}
          >
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[{ required: true, message: '请输入 API Key' }]}
          >
            <Input.Password placeholder="sk-..." />
          </Form.Item>

          <Form.Item
            label="模型名称"
            name="model"
            rules={[{ required: true, message: '请输入模型名称' }]}
          >
            <Input placeholder="gpt-4, gpt-3.5-turbo, deepseek-chat..." />
          </Form.Item>

          <Form.Item label="Temperature" name="temperature">
            <Input type="number" min={0} max={2} step={0.1} />
          </Form.Item>

          <Form.Item label="Max Tokens" name="maxTokens">
            <Input type="number" min={1} max={128000} />
          </Form.Item>

          <Space>
            <Button type="primary" onClick={handleSaveLLM}>
              保存配置
            </Button>
            <Button onClick={handleTestLLM} loading={testingLLM}>
              测试连接
            </Button>
          </Space>
        </Form>
      </Card>

      {/* MCP 网关 */}
      <Card title="MCP 网关" style={{ marginBottom: 16 }}>
        <Alert
          message="使用内置 Gateway 服务"
          description="运行 npm run gateway 启动本地网关服务（localhost:4097），无需 Accio Desktop"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: gatewayStatus === 'ok' ? '#52c41a' : gatewayStatus === 'fail' ? '#ff4d4f' : '#d9d9d9'
            }}
          />
          <span style={{ flex: 1, color: '#666' }}>
            {gatewayStatus === 'ok' && '网关已连接 (localhost:4097)'}
            {gatewayStatus === 'fail' && '网关无法连接'}
            {gatewayStatus === 'unknown' && '未检测'}
          </span>
          <Button onClick={handlePingGateway} loading={pingingGateway}>
            检测连接
          </Button>
        </div>
      </Card>
    </div>
  )
}
