/**
 * 插件权限管理系统
 */

export enum PluginPermission {
  READ_FILES = 'read_files',
  WRITE_FILES = 'write_files',
  NETWORK_ACCESS = 'network_access',
  ALIBABA_API = 'alibaba_api',
  USER_DATA = 'user_data',
  NOTIFICATIONS = 'notifications',
  CLIPBOARD = 'clipboard',
  SYSTEM_INFO = 'system_info'
}

export interface OAuthConfig {
  provider: string
  scopes: string[]
  authUrl?: string
  tokenUrl?: string
}

export interface PluginManifest {
  id: string
  name: string
  version: string
  description: string
  publisher: string
  permissions: PluginPermission[]
  oauth?: OAuthConfig
  homepage?: string
  repository?: string
}

// 权限描述映射
export const PERMISSION_DESCRIPTIONS: Record<PluginPermission, string> = {
  [PluginPermission.READ_FILES]: '读取本地文件',
  [PluginPermission.WRITE_FILES]: '写入本地文件',
  [PluginPermission.NETWORK_ACCESS]: '访问网络',
  [PluginPermission.ALIBABA_API]: '调用阿里巴巴API',
  [PluginPermission.USER_DATA]: '访问用户数据',
  [PluginPermission.NOTIFICATIONS]: '发送通知',
  [PluginPermission.CLIPBOARD]: '访问剪贴板',
  [PluginPermission.SYSTEM_INFO]: '读取系统信息'
}

// 权限存储键
const PLUGIN_PERMISSIONS_KEY = 'plugin_permissions'

interface PluginPermissionsStorage {
  [pluginId: string]: {
    granted: PluginPermission[]
    grantedAt: number
  }
}

/**
 * 加载插件权限
 */
function loadPermissions(): PluginPermissionsStorage {
  try {
    const raw = localStorage.getItem(PLUGIN_PERMISSIONS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {}
  return {}
}

/**
 * 保存插件权限
 */
function savePermissions(permissions: PluginPermissionsStorage): void {
  try {
    localStorage.setItem(PLUGIN_PERMISSIONS_KEY, JSON.stringify(permissions))
  } catch {}
}

/**
 * 授予插件权限
 */
export function grantPermissions(pluginId: string, permissions: PluginPermission[]): void {
  const storage = loadPermissions()
  storage[pluginId] = {
    granted: permissions,
    grantedAt: Date.now()
  }
  savePermissions(storage)
}

/**
 * 检查插件是否有指定权限
 */
export function checkPermission(pluginId: string, permission: PluginPermission): boolean {
  const storage = loadPermissions()
  const pluginPerms = storage[pluginId]
  return pluginPerms?.granted.includes(permission) ?? false
}

/**
 * 获取插件的所有权限
 */
export function getPluginPermissions(pluginId: string): PluginPermission[] {
  const storage = loadPermissions()
  return storage[pluginId]?.granted ?? []
}

/**
 * 撤销插件的所有权限
 */
export function revokeAllPermissions(pluginId: string): void {
  const storage = loadPermissions()
  delete storage[pluginId]
  savePermissions(storage)
}

/**
 * 验证权限请求是否合理（用于安装时）
 */
export function validatePermissionRequest(permissions: PluginPermission[]): {
  valid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  // 检查是否请求了危险权限组合
  if (permissions.includes(PluginPermission.WRITE_FILES) &&
      permissions.includes(PluginPermission.NETWORK_ACCESS)) {
    warnings.push('插件同时请求了文件写入和网络访问权限，请谨慎授权')
  }

  if (permissions.includes(PluginPermission.USER_DATA) &&
      permissions.includes(PluginPermission.NETWORK_ACCESS)) {
    warnings.push('插件可能会上传您的个人数据到网络')
  }

  return {
    valid: true,
    warnings
  }
}
