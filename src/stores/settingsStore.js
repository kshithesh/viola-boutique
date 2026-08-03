import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const LOCAL_STORAGE_KEY = 'viora_store_settings_v4'

  const defaultSettings = {
    storeName: 'Viora Boutique',
    tagline: 'Royal Couture & Designer Heritage • Jubilee Hills, Hyderabad',
    whatsappNumber: '919000033374', // Configured to user's WhatsApp number
    currency: '₹',
    deliveryFee: 150.00,
    freeShippingThreshold: 5000.00,
    taxRate: 0.05, // 5% GST
    adminPassword: 'viora123', // Default admin password
    enableLowStockAlerts: true,
    lowStockThreshold: 5,
    businessAddress: 'Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
    welcomeMessage: 'Namaste! I would like to inquire about an order from Viora Boutique Hyderabad.',
    razorpayKeyId: 'rzp_test_VioraBoutique2026', // Razorpay Key ID (Test / Live)
    enableRazorpay: true // Toggle online Razorpay payment option
  }

  const settings = ref(loadSettings())

  function loadSettings() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : { ...defaultSettings }
    } catch (e) {
      console.warn('Failed to parse store settings from localStorage', e)
      return { ...defaultSettings }
    }
  }

  function saveToLocalStorage(val) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(val))
    } catch (e) {
      console.error('Failed to save store settings to localStorage', e)
    }
  }

  watch(
    settings,
    (newVal) => {
      saveToLocalStorage(newVal)
    },
    { deep: true }
  )

  function updateSettings(updatedFields) {
    const updated = { ...settings.value, ...updatedFields }
    settings.value = updated
    saveToLocalStorage(updated)
  }

  function formatPrice(amount) {
    const numeric = Number(amount) || 0
    return `${settings.value.currency}${numeric.toLocaleString('en-IN')}`
  }

  return {
    settings,
    updateSettings,
    formatPrice
  }
})
