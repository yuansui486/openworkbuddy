import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool'
export type MessageStatus = 'pending' | 'streaming' | 'done' | 'error'

export interface ToolCall {
  id: string
  name: string
  arguments: string
  result?: string
  status: 'pending' | 'running' | 'done' | 'error'
}

export interface Message {
  id: string
  role: MessageRole
  content: string
  status: MessageStatus
  createdAt: number
  toolCalls?: ToolCall[]
  skillId?: string
  metadata?: Record<string, unknown>
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  skillId?: string
  agentId?: string
}

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem('conversations')
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

interface ChatStore {
  conversations: Conversation[]
  activeConvId: string
  isLoading: boolean
  abortController: AbortController | null

  // Computed
  activeConversation: Conversation | null

  // Actions
  newConversation: (options?: { title?: string; skillId?: string; agentId?: string }) => Conversation
  getOrCreateConversation: () => Conversation
  addMessage: (convId: string, msg: Omit<Message, 'id' | 'createdAt'>) => Message
  updateMessage: (convId: string, msgId: string, patch: Partial<Message>) => void
  appendMessageContent: (convId: string, msgId: string, delta: string) => void
  deleteConversation: (convId: string) => void
  clearAll: () => void
  stopGeneration: () => void
  setActiveConvId: (id: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => {
  const saveConversations = (conversations: Conversation[]) => {
    const toSave = conversations.slice(-50)
    localStorage.setItem('conversations', JSON.stringify(toSave))
  }

  return {
    conversations: loadConversations(),
    activeConvId: '',
    isLoading: false,
    abortController: null,

    get activeConversation() {
      const { conversations, activeConvId } = get()
      return conversations.find(c => c.id === activeConvId) ?? null
    },

    newConversation: (options = {}) => {
      const conv: Conversation = {
        id: uuidv4(),
        title: options.title || '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        skillId: options.skillId,
        agentId: options.agentId
      }

      set((state) => {
        const newConversations = [conv, ...state.conversations]
        saveConversations(newConversations)
        return { conversations: newConversations, activeConvId: conv.id }
      })

      return conv
    },

    getOrCreateConversation: () => {
      const { activeConvId, activeConversation, newConversation } = get()
      if (activeConvId && activeConversation) return activeConversation
      return newConversation()
    },

    addMessage: (convId, msg) => {
      const full: Message = { ...msg, id: uuidv4(), createdAt: Date.now() }

      set((state) => {
        const conversations = state.conversations.map(conv => {
          if (conv.id !== convId) return conv

          const updatedConv = {
            ...conv,
            messages: [...conv.messages, full],
            updatedAt: Date.now()
          }

          // Auto-update conversation title from first user message
          if (msg.role === 'user' && conv.messages.filter(m => m.role === 'user').length === 0) {
            updatedConv.title = msg.content.slice(0, 20) || '新对话'
          }

          return updatedConv
        })

        saveConversations(conversations)
        return { conversations }
      })

      return full
    },

    updateMessage: (convId, msgId, patch) => {
      set((state) => {
        const conversations = state.conversations.map(conv => {
          if (conv.id !== convId) return conv

          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === msgId ? { ...msg, ...patch } : msg
            )
          }
        })

        saveConversations(conversations)
        return { conversations }
      })
    },

    appendMessageContent: (convId, msgId, delta) => {
      set((state) => {
        const conversations = state.conversations.map(conv => {
          if (conv.id !== convId) return conv

          return {
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === msgId ? { ...msg, content: msg.content + delta } : msg
            )
          }
        })

        return { conversations }
      })
    },

    deleteConversation: (convId) => {
      set((state) => {
        const conversations = state.conversations.filter(c => c.id !== convId)
        const newActiveConvId = state.activeConvId === convId
          ? (conversations[0]?.id ?? '')
          : state.activeConvId

        saveConversations(conversations)
        return { conversations, activeConvId: newActiveConvId }
      })
    },

    clearAll: () => {
      localStorage.removeItem('conversations')
      set({ conversations: [], activeConvId: '' })
    },

    stopGeneration: () => {
      const { abortController } = get()
      if (abortController) {
        abortController.abort()
      }
      set({ abortController: null, isLoading: false })
    },

    setActiveConvId: (id) => set({ activeConvId: id })
  }
})
