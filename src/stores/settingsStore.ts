import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { StoreSettings } from '../types'
import { safeLocalStorage } from '../utils/safeStorage'
import {
  isTursoConfigured,
  initDatabase,
  fetchSettingsFromDB,
  saveSettingsToDB
} from '../services/tursoService'

export const useSettingsStore = defineStore('settings', () => {
  const LOCAL_STORAGE_KEY = 'viora_store_settings_v4'
  const isDbConnected = ref<boolean>(false)

  const defaultSettings: StoreSettings = {
    storeName: 'Viora Boutique',
    tagline: 'Royal Couture & Designer Heritage • Jubilee Hills, Hyderabad',
    whatsappNumber: '919000033374',
    currency: '₹',
    deliveryFee: 150.0,
    freeShippingThreshold: 5000.0,
    taxRate: 0.05,
    adminPassword: 'viora123',
    enableLowStockAlerts: true,
    lowStockThreshold: 5,
    businessAddress: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    welcomeMessage:
      'Namaste! I would like to inquire about an order from Viora Boutique Hyderabad.',
    razorpayKeyId: 'rzp_test_VioraBoutique2026',
    enableRazorpay: true,
    enableWhatsApp: true,
    enableWhatsAppOtp: false,
    enableCOD: true,
    enableUPI: true,
    heroPillText: 'Jubilee Hills, Hyderabad • Personal Styling',
    heroTitleMain: 'Royal Ethnic Couture.',
    heroTitleHighlight: 'Order Instantly on WhatsApp.',
    heroSubtitle:
      'Explore our curated collection of Hyderabadi Zardozi lehengas, pure Kanjeevaram silks, and Nizam Kundan & pearl jewelry. Reserve your pieces directly via WhatsApp with our boutique stylists.',
    heroButtonText: 'Explore Boutique Collection',
    heroCard1Title: 'Zardozi Velvet Lehenga',
    heroCard1Price: 48500,
    heroCard1Badge: 'Exclusive Couture',
    heroCard1Image:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop',
    heroCard2Title: 'Nizam Kundan & Pearl Set',
    heroCard2Price: 24900,
    heroCard2Badge: 'Only 3 Left',
    heroCard2Image:
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop'
  }

  const settings = ref<StoreSettings>(loadSettings())

  function loadSettings(): StoreSettings {
    try {
      const saved = safeLocalStorage.getItem(LOCAL_STORAGE_KEY)
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings }
    } catch (e) {
      console.warn('Failed to parse store settings from localStorage', e)
      return { ...defaultSettings }
    }
  }

  function saveToLocalStorage(val: StoreSettings): void {
    try {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.error('Failed to save store settings to localStorage', e)
    }
  }

  async function initSettings(): Promise<void> {
    if (!isTursoConfigured()) {
      isDbConnected.value = false
      return
    }
    try {
      await initDatabase()
      const dbSettings = await fetchSettingsFromDB()
      if (dbSettings) {
        settings.value = { ...defaultSettings, ...dbSettings }
        isDbConnected.value = true
        saveToLocalStorage(settings.value)
      } else {
        // If DB has no settings yet, seed current settings
        await saveSettingsToDB(settings.value)
        isDbConnected.value = true
      }
    } catch (err) {
      console.warn('[Turso] Could not fetch settings from DB, using local storage mode.', err)
      isDbConnected.value = false
    }
  }

  initSettings()

  watch(
    settings,
    (newVal) => {
      saveToLocalStorage(newVal)
    },
    { deep: true }
  )

  async function updateSettings(updatedFields: Partial<StoreSettings>): Promise<void> {
    const updated = { ...settings.value, ...updatedFields }
    settings.value = updated
    saveToLocalStorage(updated)

    if (isTursoConfigured()) {
      try {
        await saveSettingsToDB(updated)
        isDbConnected.value = true
      } catch (err) {
        console.error('Failed to sync updated settings to Turso DB', err)
      }
    }
  }

  function formatPrice(amount: number | string): string {
    const numeric = Number(amount) || 0
    return `${settings.value.currency}${numeric.toLocaleString('en-IN')}`
  }

  return {
    settings,
    isDbConnected,
    initSettings,
    updateSettings,
    formatPrice
  }
})
