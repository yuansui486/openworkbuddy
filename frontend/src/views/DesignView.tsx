import React, { useState } from 'react'
import { Card, Button, Empty, Upload, message, Tabs } from 'antd'
import { PlusOutlined, FileImageOutlined, BgColorsOutlined } from '@ant-design/icons'
import PageHeader from '@/components/PageHeader'
import './DesignView.css'

export default function DesignView() {
  const [activeTab, setActiveTab] = useState('templates')
  const [designs, setDesigns] = useState<any[]>([])

  const handleUpload = (info: any) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`)
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`)
    }
  }

  return (
    <div className="design-view">
      <PageHeader
        title="设计"
        showTutorial={true}
        searchPlaceholder="搜索设计素材"
        primaryAction={{
          label: '上传素材',
          icon: <PlusOutlined />,
          onClick: () => {}
        }}
      />

      <div className="design-container">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'templates', label: '设计模板' },
            { key: 'my', label: '我的设计' },
            { key: 'library', label: '素材库' }
          ]}
        />

        <div className="design-content">
          {designs.length === 0 ? (
            <Empty
              image={<FileImageOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                activeTab === 'templates'
                  ? '暂无设计模板'
                  : activeTab === 'my'
                  ? '您还没有创建任何设计'
                  : '素材库为空'
              }
            >
              <Upload
                accept="image/*"
                showUploadList={false}
                onChange={handleUpload}
              >
                <Button type="primary" icon={<PlusOutlined />}>
                  上传素材
                </Button>
              </Upload>
            </Empty>
          ) : (
            <div className="design-grid">
              {/* 设计卡片将在这里显示 */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
