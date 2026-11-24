import React, { useState } from 'react'
import { Card, Button, QRCode, Alert, Space, Switch, message } from 'antd'
import { MobileOutlined, QrcodeOutlined } from '@ant-design/icons'

export default function RemoteSettings() {
  const [qrVisible, setQrVisible] = useState(false)
  const [remoteEnabled, setRemoteEnabled] = useState(false)

  const handleEnableRemote = (checked: boolean) => {
    setRemoteEnabled(checked)
    if (checked) {
      message.success('手机遥控已启用')
      setQrVisible(true)
    } else {
      message.info('手机遥控已禁用')
      setQrVisible(false)
    }
  }

  const handleGenerateQR = () => {
    setQrVisible(true)
    message.success('二维码已生成')
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>手机遥控</h2>

      <Card title={<><MobileOutlined /> 远程控制</>} style={{ marginBottom: 16 }}>
        <Alert
          message="功能说明"
          description="通过手机扫描二维码，可以远程控制桌面端应用，实现消息发送、任务管理等功能"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>启用手机遥控</span>
            <Switch checked={remoteEnabled} onChange={handleEnableRemote} />
          </div>
        </div>

        {remoteEnabled && (
          <>
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={handleGenerateQR}
              >
                生成二维码
              </Button>
            </Space>

            {qrVisible && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                padding: 24,
                background: '#fafafa',
                borderRadius: 8
              }}>
                <QRCode
                  value="accio://remote/connect?token=mock-token-12345"
                  size={200}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Card title="连接历史">
        <Alert
          message="暂无连接记录"
          type="info"
          showIcon
        />
      </Card>

      <Card title="安全设置" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div>需要确认</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                手机发起操作时需要桌面端确认
              </div>
            </div>
            <Switch defaultChecked />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div>自动断开</div>
              <div style={{ fontSize: 12, color: '#666' }}>
                30分钟无操作自动断开连接
              </div>
            </div>
            <Switch defaultChecked />
          </div>
        </Space>
      </Card>
    </div>
  )
}
