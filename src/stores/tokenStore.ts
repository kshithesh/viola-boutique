import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { TokenItem } from '../types'
import { safeLocalStorage } from '../utils/safeStorage'
import {
  isTursoConfigured,
  initDatabase,
  fetchTokensFromDB,
  saveTokenToDB,
  deleteTokenFromDB,
  toggleTokenStatusInDB
} from '../services/tursoService'

export const useTokenStore = defineStore('tokens', () => {
  const LOCAL_STORAGE_KEY = 'viora_tokens_v1'

  const tokens = ref<TokenItem[]>([])
  const isLoading = ref<boolean>(false)
  const isDbConnected = ref<boolean>(false)
  const errorMessage = ref<string | null>(null)

  const activeTokens = computed(() => tokens.value.filter((t) => t.isActive))
  const apiTokens = computed(() => tokens.value.filter((t) => t.tokenType === 'api'))
  const authTokens = computed(() => tokens.value.filter((t) => t.tokenType === 'auth'))
  const integrationTokens = computed(() =>
    tokens.value.filter((t) => t.tokenType === 'integration')
  )

  function loadFromLocalStorage(): TokenItem[] {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Failed to load tokens from localStorage', e)
    }
    return [
      {
        id: 'tok_demo_admin',
        name: 'Demo Admin API Token',
        tokenValue: 'viora_live_sk_7f8a9b0c1d2e3f4a5b6c7d8e9f',
        tokenType: 'api',
        isActive: true,
        metadata: { permissions: ['read', 'write'], environment: 'production' },
        createdAt: new Date().toISOString()
      }
    ]
  }

  function saveToLocalStorage(val: TokenItem[]): void {
    try {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.error('Failed to save tokens to localStorage', e)
    }
  }

  watch(
    tokens,
    (newVal) => {
      if (!isDbConnected.value) {
        saveToLocalStorage(newVal)
      }
    },
    { deep: true }
  )

  async function init(): Promise<void> {
    isLoading.value = true
    errorMessage.value = null

    if (isTursoConfigured()) {
      try {
        await initDatabase()
        const dbTokens = await fetchTokensFromDB()
        if (dbTokens !== null) {
          tokens.value = dbTokens
          isDbConnected.value = true
          isLoading.value = false
          return
        }
      } catch (err: any) {
        console.warn('Failed to connect to Turso DB for tokens. Using local storage.', err)
        errorMessage.value = err.message || 'Turso DB connection failed. Using fallback storage.'
        isDbConnected.value = false
      }
    } else {
      isDbConnected.value = false
    }

    tokens.value = loadFromLocalStorage()
    isLoading.value = false
  }

  async function addToken(tokenData: {
    name: string
    tokenType?: string
    tokenValue?: string
    metadata?: any
  }): Promise<TokenItem> {
    const newToken: TokenItem = {
      id: 'tok_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      name: tokenData.name.trim(),
      tokenValue:
        tokenData.tokenValue ||
        'viora_sk_' +
          Math.random().toString(36).substring(2) +
          Math.random().toString(36).substring(2),
      tokenType: tokenData.tokenType || 'api',
      isActive: true,
      metadata: tokenData.metadata || { environment: 'production' },
      createdAt: new Date().toISOString()
    }

    if (isDbConnected.value) {
      try {
        const saved = await saveTokenToDB(newToken)
        tokens.value.unshift(saved)
        return saved
      } catch (err) {
        console.error('Failed to save token to DB', err)
        throw err
      }
    } else {
      tokens.value.unshift(newToken)
      saveToLocalStorage(tokens.value)
      return newToken
    }
  }

  async function toggleTokenStatus(id: string): Promise<void> {
    const tok = tokens.value.find((t) => t.id === id)
    if (!tok) return

    const newStatus = !tok.isActive
    tok.isActive = newStatus

    if (isDbConnected.value) {
      try {
        await toggleTokenStatusInDB(id, newStatus)
      } catch (err) {
        console.error('Failed to update token status in DB', err)
        tok.isActive = !newStatus
      }
    } else {
      saveToLocalStorage(tokens.value)
    }
  }

  async function deleteToken(id: string): Promise<void> {
    tokens.value = tokens.value.filter((t) => t.id !== id)

    if (isDbConnected.value) {
      try {
        await deleteTokenFromDB(id)
      } catch (err) {
        console.error('Failed to delete token from DB', err)
      }
    } else {
      saveToLocalStorage(tokens.value)
    }
  }

  return {
    tokens,
    isLoading,
    isDbConnected,
    errorMessage,
    activeTokens,
    apiTokens,
    authTokens,
    integrationTokens,
    init,
    addToken,
    toggleTokenStatus,
    deleteToken,
    syncDb: async (): Promise<{ success: boolean; message: string }> => {
      await init()
      if (isDbConnected.value) {
        return {
          success: true,
          message: `Connected to Turso Cloud DB successfully! ${tokens.value.length} token(s) synced.`
        }
      }
      return {
        success: false,
        message:
          errorMessage.value ||
          'Turso DB not configured or unreachable. Operating in local storage mode.'
      }
    }
  }
})
