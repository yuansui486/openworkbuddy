import React from 'react'
import { Card, Button, Alert, Space, message } from 'antd'
import { ShopOutlined, UserOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { useSettingsStore } from '@/stores/useSettingsStore'

export default function ShopSettings() {
  const settingsStore = useSettingsStore()

  const handleDisconnectAuth = () => {
    settingsStore.clearAuth()
    message.success('已断开连接')
  }

  const authBusinessType = settingsStore.auth.businessType === 'ggs' ? '国际站' : '中国站'
  const authExpiresText = settingsStore.auth.expiresAt
    ? new Date(settingsStore.auth.expiresAt).toLocaleString('zh-CN')
    : '未知'

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>店铺管理</h2>

      {/* 阿里巴巴账号 */}
      <Card title={<><UserOutlined /> 阿里巴巴账号</>} style={{ marginBottom: 16 }}>
        {settingsStore.isAuthValid ? (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>已连接</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                {authBusinessType} | {settingsStore.auth.loginId}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                到期时间：{authExpiresText}
              </div>
            </div>
            <Button danger onClick={handleDisconnectAuth}>
              断开连接
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <WarningOutlined style={{ color: '#faad14', fontSize: 24 }} />
            <div style={{ flex: 1, marginLeft: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>未连接</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                连接阿里巴巴账号后可使用数据查询功能
              </div>
            </div>
          </div>
        )}

        <Alert
          message="配置说明"
          description="需要填入从阿里巴巴开放平台获取的 accessToken 和账号信息。Gateway 服务会使用这些信息调用阿里 API。"
          type="info"
          showIcon
        />
      </Card>

      {/* 店铺信息 */}
      <Card title={<><ShopOutlined /> 店铺信息</>} style={{ marginBottom: 16 }}>
        {settingsStore.isAuthValid ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ color: '#666', fontSize: 12 }}>店铺ID</div>
              <div style={{ fontWeight: 500 }}>{settingsStore.auth.shopId || '-'}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: 12 }}>会员ID</div>
              <div style={{ fontWeight: 500 }}>{settingsStore.auth.memberId || '-'}</div>
            </div>
            <div>
              <div style={{ color: '#666', fontSize: 12 }}>业务类型</div>
              <div style={{ fontWeight: 500 }}>{authBusinessType}</div>
            </div>
          </Space>
        ) : (
          <Alert
            message="请先连接阿里巴巴账号"
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* 数据同步 */}
      <Card title="数据同步">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="数据同步功能"
            description="连接店铺后可以同步商品、订单等数据"
            type="info"
            showIcon
          />
          <Button type="primary" disabled={!settingsStore.isAuthValid}>
            立即同步
          </Button>
        </Space>
      </Card>
    </div>
  )
}
