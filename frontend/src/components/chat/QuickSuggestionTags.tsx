import React, { useRef } from 'react'
import { Tag } from 'antd'
import './QuickSuggestionTags.css'

const QUICK_TAGS = [
  '找货源',
  '图片处理',
  '文档处理',
  '数据分析',
  '商品素材',
  '趋势发现',
  '营销视觉',
  '幻灯片',
  '比价',
  '翻译',
  '文案生成'
]

interface QuickSuggestionTagsProps {
  onTagClick: (tag: string) => void
}

export default function QuickSuggestionTags({ onTagClick }: QuickSuggestionTagsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="quick-suggestion-tags">
      <div className="tags-scroll-container" ref={scrollRef}>
        <div className="tags-list">
          {QUICK_TAGS.map((tag) => (
            <Tag
              key={tag}
              className="suggestion-tag"
              onClick={() => onTagClick(tag)}
            >
              {tag}
            </Tag>
          ))}
        </div>
      </div>
    </div>
  )
}
