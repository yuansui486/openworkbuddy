/**
 * WebSocket 服务器 - 手机遥控连接
 * 允许手机通过扫码连接，远程控制电脑端操作
 */

import { v4 as uuidv4 } from 'uuid'

export interface RemoteSession {
  id: string
  deviceName: string
  deviceType: 'mobile' | 'desktop'
  connectedAt: Date
  lastActive: Date
  status: 'connected' | 'disconnected'
}

export interface RemoteCommand {
  type: 'execute_skill' | 'send_message' | 'control_task' | 'get_status'
  payload: any
  timestamp: number
}

export interface RemoteResponse {
  success: boolean
  data?: any
  error?: string
  timestamp: number
}

class RemoteServer {
  private ws: WebSocket | null = null
  private sessionId: string = ''
  private connectedDevices: Map<string, RemoteSession> = new Map()
  private messageHandlers: Map<string, (command: RemoteCommand) => Promise<RemoteResponse>> = new Map()
  private statusChangeCallbacks: Set<(status: 'connected' | 'disconnected') => void> = new Set()

  /**
   * 启动 WebSocket 服务器（连接到中继服务器）
   */
  async start(): Promise<string> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[RemoteServer] 服务器已在运行')
      return this.sessionId
    }

    // 生成会话 ID
    this.sessionId = uuidv4().slice(0, 8).toUpperCase()

    return new Promise((resolve, reject) => {
      try {
        // 连接到 WebSocket 中继服务器（需要部署）
        // 这里使用本地开发服务器，生产环境需替换为实际的中继服务器地址
        const wsUrl = `ws://localhost:3001/remote/${this.sessionId}`

        console.log(`[RemoteServer] 连接到中继服务器: ${wsUrl}`)
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log(`[RemoteServer] 连接成功，会话 ID: ${this.sessionId}`)
          this.notifyStatusChange('connected')
          resolve(this.sessionId)
        }

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data)
        }

        this.ws.onerror = (error) => {
          console.error('[RemoteServer] WebSocket 错误:', error)
          this.notifyStatusChange('disconnected')
        }

        this.ws.onclose = () => {
          console.log('[RemoteServer] WebSocket 连接已关闭')
          this.notifyStatusChange('disconnected')
          this.ws = null
        }

        // 超时处理
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('连接超时'))
          }
        }, 5000)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 停止服务器
   */
  stop() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.connectedDevices.clear()
    this.sessionId = ''
    console.log('[RemoteServer] 服务器已停止')
  }

  /**
   * 获取会话 ID（用于生成二维码）
   */
  getSessionId(): string {
    return this.sessionId
  }

  /**
   * 获取连接的设备列表
   */
  getConnectedDevices(): RemoteSession[] {
    return Array.from(this.connectedDevices.values())
  }

  /**
   * 注册命令处理器
   */
  registerHandler(
    commandType: string,
    handler: (command: RemoteCommand) => Promise<RemoteResponse>
  ) {
    this.messageHandlers.set(commandType, handler)
  }

  /**
   * 监听连接状态变化
   */
  onStatusChange(callback: (status: 'connected' | 'disconnected') => void) {
    this.statusChangeCallbacks.add(callback)
    return () => {
      this.statusChangeCallbacks.delete(callback)
    }
  }

  /**
   * 发送消息到手机端
   */
  sendToDevice(deviceId: string, data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[RemoteServer] WebSocket 未连接')
      return false
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'to_device',
        deviceId,
        data
      }))
      return true
    } catch (error) {
      console.error('[RemoteServer] 发送消息失败:', error)
      return false
    }
  }

  /**
   * 广播消息到所有设备
   */
  broadcast(data: any) {
    this.connectedDevices.forEach((_, deviceId) => {
      this.sendToDevice(deviceId, data)
    })
  }

  /**
   * 处理接收到的消息
   */
  private async handleMessage(data: string) {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case 'device_connected':
          this.handleDeviceConnected(message.device)
          break

        case 'device_disconnected':
          this.handleDeviceDisconnected(message.deviceId)
          break

        case 'command':
          await this.handleCommand(message.command, message.deviceId)
          break

        case 'ping':
          this.handlePing()
          break

        default:
          console.warn('[RemoteServer] 未知消息类型:', message.type)
      }
    } catch (error) {
      console.error('[RemoteServer] 处理消息失败:', error)
    }
  }

  /**
   * 处理设备连接
   */
  private handleDeviceConnected(device: Omit<RemoteSession, 'id'> & { id?: string }) {
    const deviceId = device.id || uuidv4()
    const session: RemoteSession = {
      id: deviceId,
      deviceName: device.deviceName || '未知设备',
      deviceType: device.deviceType || 'mobile',
      connectedAt: new Date(),
      lastActive: new Date(),
      status: 'connected'
    }

    this.connectedDevices.set(deviceId, session)
    console.log(`[RemoteServer] 设备已连接: ${session.deviceName} (${deviceId})`)

    // 通知设备连接成功
    this.sendToDevice(deviceId, {
      type: 'connection_ack',
      sessionId: this.sessionId,
      deviceId
    })
  }

  /**
   * 处理设备断开
   */
  private handleDeviceDisconnected(deviceId: string) {
    const device = this.connectedDevices.get(deviceId)
    if (device) {
      device.status = 'disconnected'
      this.connectedDevices.delete(deviceId)
      console.log(`[RemoteServer] 设备已断开: ${device.deviceName}`)
    }
  }

  /**
   * 处理远程命令
   */
  private async handleCommand(command: RemoteCommand, deviceId: string) {
    console.log(`[RemoteServer] 收到命令: ${command.type} from ${deviceId}`)

    // 更新设备活跃时间
    const device = this.connectedDevices.get(deviceId)
    if (device) {
      device.lastActive = new Date()
    }

    // 查找并执行命令处理器
    const handler = this.messageHandlers.get(command.type)
    if (handler) {
      try {
        const response = await handler(command)
        this.sendToDevice(deviceId, {
          type: 'command_response',
          response
        })
      } catch (error) {
        this.sendToDevice(deviceId, {
          type: 'command_response',
          response: {
            success: false,
            error: error instanceof Error ? error.message : '未知错误',
            timestamp: Date.now()
          }
        })
      }
    } else {
      console.warn(`[RemoteServer] 未找到命令处理器: ${command.type}`)
      this.sendToDevice(deviceId, {
        type: 'command_response',
        response: {
          success: false,
          error: '不支持的命令类型',
          timestamp: Date.now()
        }
      })
    }
  }

  /**
   * 处理心跳
   */
  private handlePing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'pong' }))
    }
  }

  /**
   * 通知状态变化
   */
  private notifyStatusChange(status: 'connected' | 'disconnected') {
    this.statusChangeCallbacks.forEach(callback => {
      try {
        callback(status)
      } catch (error) {
        console.error('[RemoteServer] 状态回调执行失败:', error)
      }
    })
  }

  /**
   * 获取服务器状态
   */
  getStatus() {
    return {
      running: this.ws !== null && this.ws.readyState === WebSocket.OPEN,
      sessionId: this.sessionId,
      connectedDevices: this.connectedDevices.size
    }
  }
}

// 导出单例
export const remoteServer = new RemoteServer()
