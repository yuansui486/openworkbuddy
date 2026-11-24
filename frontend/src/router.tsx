import { createHashRouter, Navigate } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'
import ChatView from '@/views/ChatView'
import ExpertsView from '@/views/ExpertsView'
import ExpertGroupsView from '@/views/ExpertGroupsView'
import PluginsView from '@/views/PluginsView'
import TasksView from '@/views/TasksView'
import RemoteView from '@/views/RemoteView'
import SkillsView from '@/views/SkillsView'
import AgentsView from '@/views/AgentsView'
import DesignView from '@/views/DesignView'
import ProcurementView from '@/views/ProcurementView'
import KnowledgeView from '@/views/KnowledgeView'
import LawyerView from '@/views/LawyerView'
import SettingsLayout from '@/views/settings/SettingsLayout'
import ProfileSettings from '@/views/settings/ProfileSettings'
import PreferencesSettings from '@/views/settings/PreferencesSettings'
import ShortcutsSettings from '@/views/settings/ShortcutsSettings'
import SystemSettings from '@/views/settings/SystemSettings'
import MCPSettings from '@/views/settings/MCPSettings'
import BrowserSettings from '@/views/settings/BrowserSettings'
import RemoteSettings from '@/views/settings/RemoteSettings'
import ShopSettings from '@/views/settings/ShopSettings'

const router = createHashRouter([
  {
    path: '/oauth/callback',
    loader: () => {
      // 重定向到静态 HTML（处理 postMessage）
      window.location.href = '/oauth-callback.html' + window.location.search
      return null
    }
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/experts" replace />
      },
      {
        path: 'chat',
        element: <ChatView />
      },
      {
        path: 'experts',
        element: <ExpertsView />
      },
      {
        path: 'expert-groups',
        element: <ExpertGroupsView />
      },
      {
        path: 'plugins',
        element: <PluginsView />
      },
      {
        path: 'tasks',
        element: <TasksView />
      },
      {
        path: 'remote',
        element: <RemoteView />
      },
      {
        path: 'design',
        element: <DesignView />
      },
      {
        path: 'procurement',
        element: <ProcurementView />
      },
      {
        path: 'knowledge',
        element: <KnowledgeView />
      },
      {
        path: 'lawyer',
        element: <LawyerView />
      },
      {
        path: 'skills',
        element: <SkillsView />
      },
      {
        path: 'agents',
        element: <AgentsView />
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/settings/profile" replace />
          },
          {
            path: 'profile',
            element: <ProfileSettings />
          },
          {
            path: 'preferences',
            element: <PreferencesSettings />
          },
          {
            path: 'shortcuts',
            element: <ShortcutsSettings />
          },
          {
            path: 'system',
            element: <SystemSettings />
          },
          {
            path: 'mcp',
            element: <MCPSettings />
          },
          {
            path: 'browser',
            element: <BrowserSettings />
          },
          {
            path: 'remote',
            element: <RemoteSettings />
          },
          {
            path: 'shop',
            element: <ShopSettings />
          }
        ]
      }
    ]
  }
])

export default router
