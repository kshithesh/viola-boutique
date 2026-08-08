import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { LookbookEnsemble } from '../types'
import { safeLocalStorage } from '../utils/safeStorage'
import {
  isTursoConfigured,
  initDatabase,
  fetchEnsemblesFromDB,
  saveEnsembleToDB,
  deleteEnsembleFromDB,
  seedEnsemblesToDB
} from '../services/tursoService'

export const INITIAL_ENSEMBLES: LookbookEnsemble[] = [
  {
    id: 'ensemble-1',
    title: 'The Royal Nizam Bridal Edit',
    subtitle: 'Signature Zardozi Lehenga paired with Nizam Kundan Choker',
    image:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    productIds: ['prod-301', 'prod-308']
  },
  {
    id: 'ensemble-2',
    title: 'The Sangeet & Reception Edit',
    subtitle: 'Mirror-work Georgette Gown paired with Chandbali Drops',
    image:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    productIds: ['prod-303', 'prod-306']
  }
]

export const useEnsembleStore = defineStore('ensembles', () => {
  const LOCAL_STORAGE_KEY = 'viora_ensembles_list_v1'

  const ensembles = ref<LookbookEnsemble[]>(loadEnsemblesFromLocalStorage())
  const isDbConnected = ref<boolean>(false)
  const isLoading = ref<boolean>(false)

  function loadEnsemblesFromLocalStorage(): LookbookEnsemble[] {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.warn('Failed to load ensembles from localStorage, falling back to initial data.', e)
    }
    return [...INITIAL_ENSEMBLES]
  }

  async function initEnsembles(): Promise<void> {
    if (!isTursoConfigured()) {
      isDbConnected.value = false
      return
    }

    isLoading.value = true
    try {
      await initDatabase()
      let dbEnsembles = await fetchEnsemblesFromDB()

      if (dbEnsembles !== null) {
        if (dbEnsembles.length === 0) {
          console.log('[Turso] Database empty. Seeding initial lookbook ensembles...')
          await seedEnsemblesToDB(INITIAL_ENSEMBLES)
          dbEnsembles = [...INITIAL_ENSEMBLES]
        }
        ensembles.value = dbEnsembles
        isDbConnected.value = true
      }
    } catch (err) {
      console.warn(
        '[Turso] Failed to sync ensembles with Turso DB, staying on local storage mode.',
        err
      )
      isDbConnected.value = false
    } finally {
      isLoading.value = false
    }
  }

  initEnsembles()

  watch(
    ensembles,
    (newVal) => {
      if (!isDbConnected.value) {
        try {
          safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newVal))
        } catch (e) {
          console.error('Failed to persist ensembles to localStorage', e)
        }
      }
    },
    { deep: true }
  )

  async function addEnsemble(data: Partial<LookbookEnsemble>): Promise<LookbookEnsemble> {
    const id = 'ensemble-' + Date.now().toString(36)
    const newEnsemble: LookbookEnsemble = {
      id,
      title: data.title?.trim() || 'Untitled Ensemble',
      subtitle: data.subtitle?.trim() || '',
      image:
        data.image?.trim() ||
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
      productIds: Array.isArray(data.productIds) ? data.productIds : []
    }

    ensembles.value.unshift(newEnsemble)

    if (isDbConnected.value) {
      try {
        await saveEnsembleToDB(newEnsemble)
      } catch (e) {
        console.error('Failed to sync new ensemble to Turso DB', e)
      }
    }
    return newEnsemble
  }

  async function updateEnsemble(
    id: string,
    updatedFields: Partial<LookbookEnsemble>
  ): Promise<void> {
    const index = ensembles.value.findIndex((e) => e.id === id)
    if (index !== -1) {
      const updated: LookbookEnsemble = {
        ...ensembles.value[index],
        ...updatedFields,
        productIds: Array.isArray(updatedFields.productIds)
          ? updatedFields.productIds
          : ensembles.value[index].productIds
      }
      ensembles.value[index] = updated

      if (isDbConnected.value) {
        try {
          await saveEnsembleToDB(updated)
        } catch (e) {
          console.error('Failed to sync ensemble updates to Turso DB', e)
        }
      }
    }
  }

  async function deleteEnsemble(id: string): Promise<void> {
    ensembles.value = ensembles.value.filter((e) => e.id !== id)
    if (isDbConnected.value) {
      try {
        await deleteEnsembleFromDB(id)
      } catch (e) {
        console.error('Failed to delete ensemble from Turso DB', e)
      }
    }
  }

  function resetToDefaultEnsembles(): void {
    ensembles.value = [...INITIAL_ENSEMBLES]
    if (isDbConnected.value) {
      seedEnsemblesToDB(INITIAL_ENSEMBLES)
    }
  }

  return {
    ensembles,
    isLoading,
    isDbConnected,
    initEnsembles,
    addEnsemble,
    updateEnsemble,
    deleteEnsemble,
    resetToDefaultEnsembles
  }
})
