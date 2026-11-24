import React, { useState, useRef, useEffect } from 'react'
import { Input, Button, Select, Tag, Spin } from 'antd'
import { SendOutlined, StopOutlined, FolderOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useChatStore } from '@/stores/useChatStore'
import { useSkillsStore } from '@/stores/useSkillsStore'
import { useSettingsStore } from '@/stores/useSettingsStore'
import MessageBubble from '@/components/MessageBubble'
import WelcomeCard from '@/components/chat/WelcomeCard'
import ExpertSuggestionCard from '@/components/chat/ExpertSuggestionCard'
import QuickSuggestionTags from '@/components/chat/QuickSuggestionTags'
import PromptSuggestionList from '@/components/chat/PromptSuggestionList'
import ChatInputToolbar from '@/components/chat/ChatInputToolbar'
import { streamChat, initLLM } from '@/services/llm'
import { callMcpTool, extractToolText } from '@/services/mcp'
import type { ResolvedToolCall } from '@/services/llm'
import './ChatView.css'

const { TextArea } = Input

export default function ChatView() {
  const navigate = useNavigate()
  const chatStore = useChatStore()
  const skillsStore = useSkillsStore()
  const settingsStore = useSettingsStore()

  const [inputText, setInputText] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<any>(null)

  const currentConv = chatStore.activeConversation
  const currentMessages = currentConv?.messages || []
  const activeSkillId = skillsStore.activeSkillId
  const canSend = inputText.trim() && !chatStore.isLoading && settingsStore.isLLMConfigured

  useEffect(() => {
    scrollToBottom()
  }, [currentMessages.length])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const buildSystemPrompt = (skill?: any) => {
    let prompt = '你是阿里巴巴国际站卖家运营助手。'
    if (skill) {
      prompt += `\n\n当前激活技能：${skill.name}\n${skill.systemPrompt || skill.description}`
    }
    return prompt
  }

  const handleSend = async () => {
    const text = inputText.trim()
    if (!text || !canSend) return

    initLLM(settingsStore.llm)

    const conv = chatStore.getOrCreateConversation()

    // 自动识别技能
    if (!activeSkillId) {
      const matched = skillsStore.matchSkill(text)
      if (matched) skillsStore.setActiveSkill(matched.id)
    }

    // 添加用户消息
    chatStore.addMessage(conv.id, {
      role: 'user',
      content: text,
      status: 'done',
      skillId: activeSkillId ?? undefined
    })

    setInputText('')
    scrollToBottom()

    // 创建助手占位消息
    const assistantMsg = chatStore.addMessage(conv.id, {
      role: 'assistant',
      content: '',
      status: 'streaming'
    })

    chatStore.isLoading = true
    const abortCtrl = new AbortController()
    chatStore.abortController = abortCtrl

    const skill = activeSkillId ? skillsStore.getSkillById(activeSkillId) ?? undefined : undefined
    const systemPrompt = buildSystemPrompt(skill)

    try {
      await streamChat(
        currentMessages.filter(m => m.id !== assistantMsg.id),
        systemPrompt,
        abortCtrl.signal,
        {
          onToken: (delta) => {
            chatStore.appendMessageContent(conv.id, assistantMsg.id, delta)
            scrollToBottom()
          },
          onDone: () => {
            chatStore.updateMessage(conv.id, assistantMsg.id, { status: 'done' })
            chatStore.isLoading = false
          },
          onError: (err) => {
            chatStore.updateMessage(conv.id, assistantMsg.id, {
              status: 'error',
              content: `错误：${err.message}`
            })
            chatStore.isLoading = false
          },
          onToolCalls: async (calls: ResolvedToolCall[]) => {
            const results: string[] = []
            for (const call of calls) {
              chatStore.appendMessageContent(conv.id, assistantMsg.id,
                `\n\n> 🔧 调用工具: **${call.name}**\n`)
              try {
                const result = await callMcpTool(call.name, call.arguments)
                const text = extractToolText(result)
                results.push(text || '工具执行完成（无文本输出）')
              } catch (e) {
                const msg = e instanceof Error ? e.message : String(e)
                results.push(`工具执行失败: ${msg}`)
              }
            }
            return results
          }
        },
        settingsStore.isAuthValid ? [] : undefined // 只在已连接账号时传递工具列表
      )
    } catch {
      chatStore.isLoading = false
    }
  }

  const handleStop = () => {
    chatStore.abortController?.abort()
    chatStore.isLoading = false
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTagClick = (tag: string) => {
    setInputText(tag)
    textAreaRef.current?.focus()
  }

  const handlePromptClick = (text: string) => {
    setInputText(text)
    // 自动发送
    setTimeout(() => {
      handleSend()
    }, 100)
  }

  const handleExpertStart = () => {
    navigate('/experts')
  }

  const handleSelectFolder = async () => {
    // TODO: 实现文件夹选择功能（需要集成 Tauri API）
    console.log('选择文件夹')
  }

  return (
    <div className="chat-view">
      {/* 技能选择栏 */}
      {activeSkillId && (
        <div className="skill-bar">
          <Tag
            color="blue"
            closable
            onClose={() => skillsStore.setActiveSkill(null)}
          >
            {skillsStore.getSkillById(activeSkillId)?.name || '未知技能'}
          </Tag>
        </div>
      )}

      {/* 消息列表或欢迎区 */}
      {currentMessages.length === 0 ? (
        <div className="chat-welcome-section">
          <WelcomeCard />

          {/* 输入框（欢迎状态下居中显示） */}
          <div className="input-area-welcome">
            <ChatInputToolbar
              onAddFile={() => console.log('添加文件')}
              onPluginSelect={(id) => console.log('选择插件:', id)}
              onPermissionChange={(level) => console.log('权限:', level)}
              onAutoComplete={() => console.log('自动补全')}
              onVoiceInput={() => console.log('语音输入')}
            />
            <div className="input-container">
              <TextArea
                ref={textAreaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  settingsStore.isLLMConfigured
                    ? '输入消息... (Enter 发送，Shift+Enter 换行)'
                    : '请先在设置中配置 LLM 接口'
                }
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={!settingsStore.isLLMConfigured || chatStore.isLoading}
              />
              <div className="input-actions">
                {chatStore.isLoading ? (
                  <Button
                    type="primary"
                    danger
                    icon={<StopOutlined />}
                    onClick={handleStop}
                  >
                    停止
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    发送
                  </Button>
                )}
              </div>
            </div>
            <div className="input-footer">
              <Button
                icon={<FolderOutlined />}
                className="folder-select-btn"
                onClick={handleSelectFolder}
              >
                选择文件夹
                {selectedFolder && <span className="folder-path">: {selectedFolder}</span>}
              </Button>
            </div>
          </div>

          {/* AI 建议和快捷标签 - 在输入框下方 */}
          <ExpertSuggestionCard onStart={handleExpertStart} />
          <QuickSuggestionTags onTagClick={handleTagClick} />
          <PromptSuggestionList onPromptClick={handlePromptClick} />
        </div>
      ) : (
        <>
          <div className="messages-container">
            {currentMessages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {chatStore.isLoading && (
              <div className="loading-indicator">
                <Spin size="small" /> AI 正在思考...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入框（有消息时固定底部） */}
          <div className="input-area">
            <ChatInputToolbar
              onAddFile={() => console.log('添加文件')}
              onPluginSelect={(id) => console.log('选择插件:', id)}
              onPermissionChange={(level) => console.log('权限:', level)}
              onAutoComplete={() => console.log('自动补全')}
              onVoiceInput={() => console.log('语音输入')}
            />
            <div className="input-container">
              <TextArea
                ref={textAreaRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  settingsStore.isLLMConfigured
                    ? '输入消息... (Enter 发送，Shift+Enter 换行)'
                    : '请先在设置中配置 LLM 接口'
                }
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={!settingsStore.isLLMConfigured || chatStore.isLoading}
              />
              <div className="input-actions">
                {chatStore.isLoading ? (
                  <Button
                    type="primary"
                    danger
                    icon={<StopOutlined />}
                    onClick={handleStop}
                  >
                    停止
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    发送
                  </Button>
                )}
              </div>
            </div>
            <div className="input-footer">
              <Button
                icon={<FolderOutlined />}
                className="folder-select-btn"
                onClick={handleSelectFolder}
              >
                选择文件夹
                {selectedFolder && <span className="folder-path">: {selectedFolder}</span>}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
