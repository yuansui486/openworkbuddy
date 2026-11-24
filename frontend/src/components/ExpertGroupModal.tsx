import React, { useState, useMemo } from 'react'
import { Modal, Input, Button, Checkbox, Empty, message } from 'antd'
import { TeamOutlined, CheckCircleFilled } from '@ant-design/icons'
import { useExpertsStore, type Expert } from '@/stores/useExpertsStore'
import './ExpertGroupModal.css'

const { TextArea } = Input

interface ExpertGroupModalProps {
  open: boolean
  onClose: () => void
  onCreate: (name: string, description: string, memberIds: string[]) => void
}

export default function ExpertGroupModal({ open, onClose, onCreate }: ExpertGroupModalProps) {
  const expertsStore = useExpertsStore()

  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')

  const filteredExperts = useMemo(() => {
    if (!searchText) return expertsStore.experts
    const query = searchText.toLowerCase()
    return expertsStore.experts.filter(expert =>
      expert.name.toLowerCase().includes(query) ||
      expert.specialty.toLowerCase().includes(query) ||
      expert.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }, [searchText, expertsStore.experts])

  const toggleMember = (expertId: string) => {
    setSelectedMembers(prev =>
      prev.includes(expertId)
        ? prev.filter(id => id !== expertId)
        : [...prev, expertId]
    )
  }

  const handleCreate = () => {
    if (!groupName.trim()) {
      message.error('请输入群聊名称')
      return
    }

    if (selectedMembers.length < 2) {
      message.error('请至少选择 2 位专家成员')
      return
    }

    onCreate(groupName, description, selectedMembers)

    // Reset form
    setGroupName('')
    setDescription('')
    setSelectedMembers([])
    setSearchText('')
  }

  const canCreate = groupName.trim() && selectedMembers.length >= 2

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      className="expert-group-modal"
      destroyOnClose
    >
      <div className="expert-group-container">
        <div className="expert-group-header">
          <TeamOutlined className="group-icon" />
          <div>
            <h2 className="group-title">创建专家群聊</h2>
            <p className="group-subtitle">组建多位专家协作团队</p>
          </div>
        </div>

        <div className="expert-group-content">
          <div className="form-group">
            <label className="form-label required">群聊名称</label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="例如：跨境电商全链路团队"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label">群聊描述</label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这个团队的协作方向和目标..."
              rows={3}
              maxLength={200}
              showCount
            />
          </div>

          <div className="form-group">
            <label className="form-label required">
              选择成员 ({selectedMembers.length} 已选，至少 2 位)
            </label>
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索专家..."
              style={{ marginBottom: 12 }}
            />

            <div className="experts-selection-list">
              {filteredExperts.length === 0 ? (
                <Empty description="未找到匹配的专家" />
              ) : (
                filteredExperts.map(expert => {
                  const isSelected = selectedMembers.includes(expert.id)
                  return (
                    <div
                      key={expert.id}
                      className={`expert-selection-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleMember(expert.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleMember(expert.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div
                        className="expert-selection-avatar"
                        style={{ backgroundColor: expert.avatarColor }}
                      >
                        {expert.avatarText}
                      </div>
                      <div className="expert-selection-info">
                        <div className="expert-selection-name">
                          {expert.name}
                          {expert.verified && (
                            <CheckCircleFilled className="verified-icon" />
                          )}
                        </div>
                        <div className="expert-selection-specialty">
                          {expert.specialty}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        <div className="expert-group-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            type="primary"
            onClick={handleCreate}
            disabled={!canCreate}
          >
            创建群聊
          </Button>
        </div>
      </div>
    </Modal>
  )
}
