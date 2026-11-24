/**
 * 插件更新检查系统
 */

export interface PluginVersion {
  version: string
  releaseDate: string
  changelog: string[]
  downloadUrl?: string
}

export interface PluginUpdate {
  pluginId: string
  pluginName: string
  currentVersion: string
  latestVersion: string
  changelog: string[]
  releaseDate: string
}

/**
 * 版本比较（简单实现，支持 x.y.z 格式）
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number)
  const parts2 = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0
    const part2 = parts2[i] || 0

    if (part1 > part2) return 1
    if (part1 < part2) return -1
  }

  return 0
}

/**
 * 检查版本是否更新
 */
export function isNewerVersion(current: string, latest: string): boolean {
  return compareVersions(latest, current) > 0
}

/**
 * 模拟获取最新版本（实际应从服务器获取）
 */
export async function fetchLatestVersion(pluginId: string): Promise<PluginVersion | null> {
  // TODO: 实际应该调用 API
  // 这里仅作演示
  await new Promise(resolve => setTimeout(resolve, 100))

  // 模拟数据
  const mockVersions: Record<string, PluginVersion> = {
    'alibaba-international': {
      version: '1.1.0',
      releaseDate: '2024-11-20',
      changelog: [
        '新增：批量商品发布功能',
        '优化：商品详情页性能',
        '修复：图片上传失败的问题'
      ]
    }
  }

  return mockVersions[pluginId] || null
}

/**
 * 检查所有已安装插件的更新
 */
export async function checkAllUpdates(
  installedPlugins: Array<{ id: string; name: string; version?: string }>
): Promise<PluginUpdate[]> {
  const updates: PluginUpdate[] = []

  for (const plugin of installedPlugins) {
    const currentVersion = plugin.version || '1.0.0'
    const latest = await fetchLatestVersion(plugin.id)

    if (latest && isNewerVersion(currentVersion, latest.version)) {
      updates.push({
        pluginId: plugin.id,
        pluginName: plugin.name,
        currentVersion,
        latestVersion: latest.version,
        changelog: latest.changelog,
        releaseDate: latest.releaseDate
      })
    }
  }

  return updates
}

/**
 * 更新检查缓存
 */
const UPDATE_CHECK_CACHE_KEY = 'plugin_update_check_cache'
const CACHE_DURATION = 60 * 60 * 1000 // 1小时

interface UpdateCheckCache {
  lastCheck: number
  updates: PluginUpdate[]
}

export function getCachedUpdates(): PluginUpdate[] | null {
  try {
    const raw = localStorage.getItem(UPDATE_CHECK_CACHE_KEY)
    if (!raw) return null

    const cache: UpdateCheckCache = JSON.parse(raw)

    // 检查缓存是否过期
    if (Date.now() - cache.lastCheck > CACHE_DURATION) {
      return null
    }

    return cache.updates
  } catch {
    return null
  }
}

export function cacheUpdates(updates: PluginUpdate[]): void {
  try {
    const cache: UpdateCheckCache = {
      lastCheck: Date.now(),
      updates
    }
    localStorage.setItem(UPDATE_CHECK_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

export function clearUpdateCache(): void {
  localStorage.removeItem(UPDATE_CHECK_CACHE_KEY)
}
