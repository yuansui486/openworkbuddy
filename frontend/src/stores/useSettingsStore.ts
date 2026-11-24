import { create } from 'zustand'

export interface LLMConfig {
  baseURL: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
}

export interface AlibabaAuthConfig {
  token: string
  memberId: string
  shopId: string
  loginId: string
  businessType: 'ggs' | 'cgs' | ''  // GGS=国际站, CGS=中国站
  expiresAt: number
}

const DEFAULT_LLM: LLMConfig = {
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 8192,
  systemPrompt: ''
}

function loadLLM(): LLMConfig {
  try {
    const saved = localStorage.getItem('llm_config')
    return saved ? { ...DEFAULT_LLM, ...JSON.parse(saved) } : { ...DEFAULT_LLM }
  } catch {
    return { ...DEFAULT_LLM }
  }
}

function loadAuth(): AlibabaAuthConfig {
  try {
    const saved = localStorage.getItem('alibaba_auth')
    return saved ? JSON.parse(saved) : { token: '', memberId: '', shopId: '', loginId: '', businessType: '', expiresAt: 0 }
  } catch {
    return { token: '', memberId: '', shopId: '', loginId: '', businessType: '', expiresAt: 0 }
  }
}

function loadTheme(): 'light' | 'dark' {
  return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
}

interface SettingsStore {
  llm: LLMConfig
  auth: AlibabaAuthConfig
  theme: 'light' | 'dark'

  // Computed
  isLLMConfigured: boolean
  isAuthValid: boolean
  isGGS: boolean
  isCGS: boolean

  // Actions
  saveLLM: (config: Partial<LLMConfig>) => void
  saveAuth: (config: Partial<AlibabaAuthConfig>) => void
  clearAuth: () => void
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  llm: loadLLM(),
  auth: loadAuth(),
  theme: loadTheme(),

  get isLLMConfigured() {
    const { llm } = get()
    return !!(llm.baseURL && llm.apiKey && llm.model)
  },

  get isAuthValid() {
    const { auth } = get()
    return !!(auth.token && auth.expiresAt > Date.now())
  },

  get isGGS() {
    return get().auth.businessType === 'ggs'
  },

  get isCGS() {
    return get().auth.businessType === 'cgs'
  },

  saveLLM: (config) => set((state) => {
    const newLLM = { ...state.llm, ...config }
    localStorage.setItem('llm_config', JSON.stringify(newLLM))
    return { llm: newLLM }
  }),

  saveAuth: (config) => set((state) => {
    const newAuth = { ...state.auth, ...config }
    localStorage.setItem('alibaba_auth', JSON.stringify(newAuth))
    return { auth: newAuth }
  }),

  clearAuth: () => set({
    auth: { token: '', memberId: '', shopId: '', loginId: '', businessType: '', expiresAt: 0 }
  }, false)
}))
