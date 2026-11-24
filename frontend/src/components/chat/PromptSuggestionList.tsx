import React from 'react'
import { ArrowUpOutlined } from '@ant-design/icons'
import './PromptSuggestionList.css'

const PROMPT_SUGGESTIONS = [
  {
    id: '1',
    text: '想按预算采购？按订购数量和目标价，跨平台找货',
    toolbox: 'Accio 采购工具箱',
    icon: '📦'
  },
  {
    id: '2',
    text: '我能做定制的供应商？快定制和认证要求匹配高的',
    toolbox: 'Accio 采购工具箱',
    icon: '📦'
  },
  {
    id: '3',
    text: '想小批量拿现货？快速找到低起订门槛商品',
    toolbox: 'Accio 采购工具箱',
    icon: '📦'
  },
  {
    id: '4',
    text: '上传图片，快速找同款',
    toolbox: 'Accio 采购工具箱',
    icon: '📦'
  },
  {
    id: '5',
    text: '分析店铺数据，生成运营报告',
    toolbox: 'Accio 数据分析工具箱',
    icon: '📊'
  },
  {
    id: '6',
    text: '生成商品营销文案和标题',
    toolbox: 'Accio 文案工具箱',
    icon: '✍️'
  }
]

interface PromptSuggestionListProps {
  onPromptClick: (text: string) => void
}

export default function PromptSuggestionList({ onPromptClick }: PromptSuggestionListProps) {
  return (
    <div className="prompt-suggestion-list">
      {PROMPT_SUGGESTIONS.map((prompt) => (
        <div
          key={prompt.id}
          className="prompt-item"
          onClick={() => onPromptClick(prompt.text)}
        >
          <div className="prompt-content">
            <span className="prompt-icon">{prompt.icon}</span>
            <div className="prompt-text-wrapper">
              <span className="prompt-text">{prompt.text}</span>
              <span className="prompt-toolbox">▲ {prompt.toolbox}</span>
            </div>
          </div>
          <div className="prompt-arrow">
            <ArrowUpOutlined />
          </div>
        </div>
      ))}
    </div>
  )
}
