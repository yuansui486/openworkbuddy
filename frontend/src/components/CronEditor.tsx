import React, { useState, useEffect } from 'react'
import { Select, InputNumber } from 'antd'

const { Option } = Select

interface CronEditorProps {
  value?: string
  onChange?: (value: string) => void
}

export default function CronEditor({ value = '0 9 * * *', onChange }: CronEditorProps) {
  const [minute, setMinute] = useState('0')
  const [hour, setHour] = useState('9')
  const [day, setDay] = useState('*')
  const [month, setMonth] = useState('*')
  const [weekday, setWeekday] = useState('*')

  // 解析输入的 cron
  useEffect(() => {
    if (value) {
      const parts = value.split(' ')
      if (parts.length === 5) {
        setMinute(parts[0])
        setHour(parts[1])
        setDay(parts[2])
        setMonth(parts[3])
        setWeekday(parts[4])
      }
    }
  }, [value])

  // 更新 cron
  useEffect(() => {
    const cron = `${minute} ${hour} ${day} ${month} ${weekday}`
    onChange?.(cron)
  }, [minute, hour, day, month, weekday, onChange])

  return (
    <div className="cron-editor" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ width: 60 }}>分钟:</label>
        <Select value={minute} onChange={setMinute} style={{ flex: 1 }}>
          <Option value="*">每分钟</Option>
          <Option value="0">0分</Option>
          <Option value="*/5">每5分钟</Option>
          <Option value="*/10">每10分钟</Option>
          <Option value="*/15">每15分钟</Option>
          <Option value="*/30">每30分钟</Option>
        </Select>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ width: 60 }}>小时:</label>
        <Select value={hour} onChange={setHour} style={{ flex: 1 }}>
          <Option value="*">每小时</Option>
          {Array.from({ length: 24 }, (_, i) => (
            <Option key={i} value={i.toString()}>{i}时</Option>
          ))}
        </Select>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ width: 60 }}>日期:</label>
        <Select value={day} onChange={setDay} style={{ flex: 1 }}>
          <Option value="*">每天</Option>
          {Array.from({ length: 31 }, (_, i) => (
            <Option key={i + 1} value={(i + 1).toString()}>{i + 1}日</Option>
          ))}
        </Select>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ width: 60 }}>月份:</label>
        <Select value={month} onChange={setMonth} style={{ flex: 1 }}>
          <Option value="*">每月</Option>
          {Array.from({ length: 12 }, (_, i) => (
            <Option key={i + 1} value={(i + 1).toString()}>{i + 1}月</Option>
          ))}
        </Select>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <label style={{ width: 60 }}>星期:</label>
        <Select value={weekday} onChange={setWeekday} style={{ flex: 1 }}>
          <Option value="*">每天</Option>
          <Option value="1">周一</Option>
          <Option value="2">周二</Option>
          <Option value="3">周三</Option>
          <Option value="4">周四</Option>
          <Option value="5">周五</Option>
          <Option value="6">周六</Option>
          <Option value="0">周日</Option>
        </Select>
      </div>

      <div style={{
        marginTop: 12,
        padding: 12,
        background: '#f5f5f5',
        borderRadius: 4,
        fontSize: 13
      }}>
        <div><strong>Cron 表达式:</strong> <code>{`${minute} ${hour} ${day} ${month} ${weekday}`}</code></div>
        <div style={{ marginTop: 4, color: '#666' }}>
          <strong>说明:</strong> {describeCron(minute, hour, day, month, weekday)}
        </div>
      </div>
    </div>
  )
}

function describeCron(minute: string, hour: string, day: string, month: string, weekday: string): string {
  const parts: string[] = []

  if (weekday !== '*') {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    parts.push(days[parseInt(weekday)])
  } else if (day !== '*') {
    parts.push(`每月${day}日`)
  }

  if (hour !== '*') {
    parts.push(`${hour}时`)
  }

  if (minute !== '*') {
    if (minute.startsWith('*/')) {
      parts.push(`每${minute.slice(2)}分钟`)
    } else {
      parts.push(`${minute}分`)
    }
  }

  return parts.length > 0 ? parts.join(' ') : '每分钟执行'
}
