import React, { useMemo } from 'react'
import { marked } from 'marked'
import hljs from 'highlight.js'
import 'highlight.js/styles/github.css'
import './MessageBubble.css'
import { UserOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import type { Message } from '@/stores/useChatStore'
import { useSkillsStore } from '@/stores/useSkillsStore'

interface MessageBubbleProps {
  message: Message
}

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true
})

const renderer = new marked.Renderer()
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre class="hljs-block"><code class="hljs language-${language}">${highlighted}</code></pre>`
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const getSkillById = useSkillsStore((state) => state.getSkillById)

  const renderedContent = useMemo(() => {
    if (!message.content) return ''
    return marked(message.content, { renderer }) as string
  }, [message.content])

  const skillName = useMemo(() =>
    message.skillId ? getSkillById(message.skillId)?.name ?? '' : '',
    [message.skillId, getSkillById]
  )

  const timeStr = useMemo(() => {
    const d = new Date(message.createdAt)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }, [message.createdAt])

  const formatToolName = (name: string): string => {
    const map: Record<string, string> = {
      workctl: 'workctl CLI',
      local_data_query: '本地数据查询',
      local_data_ensure: '数据同步',
      local_data_catalog: '数据目录',
      rfq_submit_delivery: 'RFQ 交付',
      chat_analysis_prepare: '询盘准备'
    }
    return map[name] || name
  }

  const toolStatusText = (status: string): string => {
    const map: Record<string, string> = {
      pending: '等待中',
      running: '执行中',
      done: '完成',
      error: '失败'
    }
    return map[status] || status
  }

  const getToolIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleOutlined />
      case 'error': return <CloseCircleOutlined />
      default: return <LoadingOutlined />
    }
  }

  return (
    <div className={`message-wrap ${message.role}`}>
      {/* 助手头像 */}
      {message.role === 'assistant' && (
        <div className="avatar assistant-avatar">
          <img src="/logo.svg" alt="AI" />
        </div>
      )}

      <div className="bubble-content">
        {/* 技能标签 */}
        {message.skillId && message.role === 'assistant' && (
          <div className="skill-label">
            <span>✨</span>
            {skillName}
          </div>
        )}

        {/* 消息内容 */}
        <div className={`bubble ${message.role} ${message.status}`}>
          {/* 用户消息：纯文本 */}
          {message.role === 'user' && (
            <span className="user-text">{message.content}</span>
          )}

          {/* 助手消息：Markdown 渲染 */}
          {message.role === 'assistant' && (
            <>
              {message.content && (
                <div
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: renderedContent }}
                />
              )}
              {!message.content && message.status === 'streaming' && (
                <div className="streaming-cursor">▋</div>
              )}
              {!message.content && message.status === 'error' && (
                <div className="error-msg">
                  {message.content || '生成出错，请重试'}
                </div>
              )}
            </>
          )}
        </div>

        {/* 工具调用展示 */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="tool-calls">
            {message.toolCalls.map((tc) => (
              <div key={tc.id} className={`tool-call-item ${tc.status}`}>
                <span className="tool-icon">{getToolIcon(tc.status)}</span>
                <span className="tool-name">{formatToolName(tc.name)}</span>
                <span className="tool-status">{toolStatusText(tc.status)}</span>
              </div>
            ))}
          </div>
        )}

        {/* 时间戳 */}
        <div className="msg-time">{timeStr}</div>
      </div>

      {/* 用户头像 */}
      {message.role === 'user' && (
        <div className="avatar user-avatar">
          <UserOutlined />
        </div>
      )}
    </div>
  )
}

export default MessageBubble
