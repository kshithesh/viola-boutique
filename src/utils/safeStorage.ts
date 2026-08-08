/**
 * Safe wrapper around localStorage and sessionStorage that handles SecurityError
 * exceptions (e.g. when cookies/storage are blocked, or running inside restricted iframes).
 * Falls back seamlessly to in-memory storage.
 */

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

class SafeStorage implements Storage {
  private memoryStore = new MemoryStorage()
  private storageType: 'localStorage' | 'sessionStorage'

  constructor(type: 'localStorage' | 'sessionStorage') {
    this.storageType = type
  }

  private get store(): Storage {
    try {
      if (typeof window !== 'undefined') {
        const targetStore = window[this.storageType]
        if (targetStore) {
          return targetStore
        }
      }
    } catch {
      // Access to window.localStorage / window.sessionStorage is denied (SecurityError)
    }
    return this.memoryStore
  }

  get length(): number {
    try {
      return this.store.length
    } catch {
      return this.memoryStore.length
    }
  }

  clear(): void {
    try {
      this.store.clear()
    } catch {
      /* ignore */
    }
    this.memoryStore.clear()
  }

  getItem(key: string): string | null {
    try {
      return this.store.getItem(key)
    } catch {
      return this.memoryStore.getItem(key)
    }
  }

  key(index: number): string | null {
    try {
      return this.store.key(index)
    } catch {
      return this.memoryStore.key(index)
    }
  }

  removeItem(key: string): void {
    try {
      this.store.removeItem(key)
    } catch {
      /* ignore */
    }
    this.memoryStore.removeItem(key)
  }

  setItem(key: string, value: string): void {
    try {
      this.store.setItem(key, value)
      // Mirror to memory store as well for safety
      this.memoryStore.setItem(key, value)
    } catch {
      this.memoryStore.setItem(key, value)
    }
  }
}

export const safeLocalStorage: Storage = new SafeStorage('localStorage')
export const safeSessionStorage: Storage = new SafeStorage('sessionStorage')
