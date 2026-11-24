import React, { useState, useMemo, useEffect } from 'react'
import {
  Input,
  Select,
  Space,
  Tabs,
  Modal,
  message,
  Button,
  Badge,
  notification
} from 'antd'
import {
  AppstoreOutlined,
  ShoppingOutlined,
  SearchOutlined,
  BellOutlined,
  ApiOutlined
} from '@ant-design/icons'
import { usePluginsStore, type PluginCategory, type AuthStatus } from '@/stores/usePluginsStore'
import PluginCard from '@/components/PluginCard'
import PluginInstallModal from '@/components/PluginInstallModal'
import PluginConfigModal, { type PluginConfig } from '@/components/PluginConfigModal'
import EmptyState from '@/components/common/EmptyState'
import { revokeOAuth } from '@/components/PluginAuthButton'
import { revokeAllPermissions } from '@/utils/plugin-permissions'
import { checkAllUpdates, type PluginUpdate } from '@/utils/plugin-updater'
import './PluginsView.css'

const { Option } = Select

export default function PluginsView() {
  const pluginsStore = usePluginsStore()

  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<PluginCategory | 'all'>('all')
  const [authStatusFilter, setAuthStatusFilter] = useState<'all' | 'authorized' | 'unauthorized'>('all')

  // 对话框状态
  const [installModalOpen, setInstallModalOpen] = useState(false)
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [selectedPlugin, setSelectedPlugin] = useState<string | null>(null)

  // 插件配置状态
  const [pluginConfigs, setPluginConfigs] = useState<Record<string, PluginConfig>>({})

  // 更新通知
  const [updates, setUpdates] = useState<PluginUpdate[]>([])
  const [checkingUpdates, setCheckingUpdates] = useState(false)

  // 获取选中的插件对象
  const currentPlugin = useMemo(() => {
    if (!selectedPlugin) return null
    return pluginsStore.getPluginById(selectedPlugin) || null
  }, [selectedPlugin, pluginsStore])

  // 加载插件配置
  useEffect(() => {
    try {
      const saved = localStorage.getItem('plugin_configs')
      if (saved) {
        setPluginConfigs(JSON.parse(saved))
      }
    } catch {}
  }, [])

  // 保存插件配置
  const savePluginConfig = (config: PluginConfig) => {
    const newConfigs = { ...pluginConfigs, [config.pluginId]: config }
    setPluginConfigs(newConfigs)
    try {
      localStorage.setItem('plugin_configs', JSON.stringify(newConfigs))
    } catch {}
  }

  // 检查更新
  const handleCheckUpdates = async () => {
    setCheckingUpdates(true)
    try {
      const installedPlugins = pluginsStore.installedPlugins.map(p => ({
        id: p.id,
        name: p.name,
        version: '1.0.0' // TODO: 实际版本应该从插件元数据中获取
      }))

      const availableUpdates = await checkAllUpdates(installedPlugins)
      setUpdates(availableUpdates)

      if (availableUpdates.length > 0) {
        notification.open({
          message: '插件更新可用',
          description: `${availableUpdates.length} 个插件有新版本`,
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
          btn: (
            <Button type="primary" size="small" onClick={() => {
              // TODO: 显示更新详情
              message.info('更新功能开发中')
            }}>
              查看详情
            </Button>
          ),
          duration: 0
        })
      } else {
        message.success('所有插件都是最新版本')
      }
    } catch (error) {
      message.error('检查更新失败')
    } finally {
      setCheckingUpdates(false)
    }
  }

  // 筛选后的插件列表
  const filteredPlugins = useMemo(() => {
    let result = pluginsStore.allPlugins

    // 搜索过滤
    if (searchText) {
      const lowerSearch = searchText.toLowerCase()
      result = result.filter(p =>
        p.name.toLowerCase().includes(lowerSearch) ||
        p.description.toLowerCase().includes(lowerSearch) ||
        p.publisher.toLowerCase().includes(lowerSearch)
      )
    }

    // 分类过滤
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category === categoryFilter)
    }

    // 授权状态过滤
    if (authStatusFilter !== 'all') {
      result = result.filter(p => p.authStatus === authStatusFilter)
    }

    return result
  }, [pluginsStore.allPlugins, searchText, categoryFilter, authStatusFilter])

  // 安装插件
  const handleInstall = (pluginId: string) => {
    const plugin = pluginsStore.getPluginById(pluginId)
    if (plugin) {
      setSelectedPlugin(pluginId)
      setInstallModalOpen(true)
    }
  }

  const handleInstallComplete = (pluginId: string) => {
    pluginsStore.installPlugin(pluginId)
    message.success('插件安装成功')
    setInstallModalOpen(false)
    setSelectedPlugin(null)
  }

  // 配置插件
  const handleConfigure = (pluginId: string) => {
    setSelectedPlugin(pluginId)
    setConfigModalOpen(true)
  }

  const handleConfigSave = (config: PluginConfig) => {
    savePluginConfig(config)
    setConfigModalOpen(false)
    message.success('配置已保存')
  }

  // 卸载插件
  const handleUninstall = async (pluginId: string) => {
    const plugin = pluginsStore.getPluginById(pluginId)
    if (!plugin) return

    Modal.confirm({
      title: '确认卸载',
      content: `确定要卸载 ${plugin.name} 吗？卸载后插件数据将被清除。`,
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        // 询问是否撤销授权
        if (plugin.authStatus === 'authorized') {
          const revokeAuth = await new Promise<boolean>(resolve => {
            Modal.confirm({
              title: '是否撤销授权',
              content: '是否同时撤销该插件的账号授权？',
              okText: '撤销',
              cancelText: '保留',
              onOk: () => resolve(true),
              onCancel: () => resolve(false)
            })
          })

          if (revokeAuth) {
            await revokeOAuth(pluginId)
          }
        }

        // 清除权限
        revokeAllPermissions(pluginId)

        // 清除配置
        const newConfigs = { ...pluginConfigs }
        delete newConfigs[pluginId]
        setPluginConfigs(newConfigs)
        try {
          localStorage.setItem('plugin_configs', JSON.stringify(newConfigs))
        } catch {}

        // 卸载插件
        pluginsStore.uninstallPlugin(pluginId)
        message.success('插件已卸载')
      }
    })
  }

  // 授权插件
  const handleAuthorize = (pluginId: string) => {
    handleConfigure(pluginId)
  }

  return (
    <div className="plugins-view">
      {/* 顶部搜索栏 */}
      <div className="plugins-header">
        <Space size="middle" style={{ width: '100%' }}>
          <Input
            placeholder="搜索插件..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />

          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
          >
            <Option value="all">全部分类</Option>
            <Option value="featured">精选</Option>
            <Option value="ecommerce">电商</Option>
            <Option value="tools">工具</Option>
            <Option value="data">数据</Option>
            <Option value="communication">通讯</Option>
          </Select>

          <Select
            value={authStatusFilter}
            onChange={setAuthStatusFilter}
            style={{ width: 150 }}
          >
            <Option value="all">全部状态</Option>
            <Option value="authorized">已授权</Option>
            <Option value="unauthorized">未授权</Option>
          </Select>

          <div style={{ marginLeft: 'auto' }}>
            <Badge count={updates.length} offset={[-5, 5]}>
              <Button
                icon={<BellOutlined />}
                loading={checkingUpdates}
                onClick={handleCheckUpdates}
              >
                检查更新
              </Button>
            </Badge>
          </div>
        </Space>
      </div>

      {/* 标签页 */}
      <Tabs
        items={[
          {
            key: 'installed',
            label: (
              <span>
                <AppstoreOutlined /> 我的插件
                <Badge
                  count={pluginsStore.installedPlugins.length}
                  style={{ marginLeft: 8, backgroundColor: '#1890ff' }}
                />
              </span>
            ),
            children: (
              <div className="plugins-grid">
                {pluginsStore.installedPlugins.length === 0 ? (
                  <EmptyState
                    icon={<ApiOutlined />}
                    title="还没有安装插件"
                    description="从插件市场安装插件，扩展 AI 专家的能力"
                    action={{
                      text: '浏览插件市场',
                      onClick: () => {
                        const marketTab = document.querySelector('[data-node-key="market"]') as HTMLElement
                        marketTab?.click()
                      }
                    }}
                  />
                ) : (
                  pluginsStore.installedPlugins.map(plugin => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      onConfigure={handleConfigure}
                      onUninstall={handleUninstall}
                      onAuthorize={handleAuthorize}
                    />
                  ))
                )}
              </div>
            )
          },
          {
            key: 'market',
            label: (
              <span>
                <ShoppingOutlined /> 插件市场
              </span>
            ),
            children: (
              <div className="plugins-grid">
                {filteredPlugins.length === 0 ? (
                  <EmptyState
                    icon={<SearchOutlined />}
                    title="未找到匹配的插件"
                    description="尝试调整搜索条件或筛选器"
                  />
                ) : (
                  filteredPlugins.map(plugin => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      onInstall={handleInstall}
                      onConfigure={handleConfigure}
                      onUninstall={handleUninstall}
                      onAuthorize={handleAuthorize}
                    />
                  ))
                )}
              </div>
            )
          }
        ]}
      />

      {/* 安装向导对话框 */}
      <PluginInstallModal
        open={installModalOpen}
        plugin={currentPlugin}
        onComplete={handleInstallComplete}
        onCancel={() => {
          setInstallModalOpen(false)
          setSelectedPlugin(null)
        }}
      />

      {/* 配置对话框 */}
      <PluginConfigModal
        open={configModalOpen}
        plugin={currentPlugin}
        config={selectedPlugin ? pluginConfigs[selectedPlugin] : undefined}
        onOk={handleConfigSave}
        onCancel={() => {
          setConfigModalOpen(false)
          setSelectedPlugin(null)
        }}
      />
    </div>
  )
}
