import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Customer } from '../types'
import { safeLocalStorage } from '../utils/safeStorage'
import {
  loginCustomerWithGoogle,
  sendWhatsAppOtp,
  verifyWhatsAppOtp
} from '../services/tursoService'

const SESSION_KEY = 'viora_customer_session_v1'

export const useAuthStore = defineStore('auth', () => {
  // ——— State ———
  const currentCustomer = ref<Customer | null>(loadSession())
  const isAuthModalOpen = ref<boolean>(false)
  const isLoading = ref<boolean>(false)
  const authError = ref<string>('')

  // ——— Computed ———
  const isAuthenticated = computed(() => currentCustomer.value !== null)
  const customerName = computed(() => currentCustomer.value?.name || '')
  const customerPhone = computed(() => currentCustomer.value?.phone || '')
  const customerAvatar = computed(() => currentCustomer.value?.avatar || '')

  // ——— Session Persistence ———
  function loadSession(): Customer | null {
    try {
      const saved = safeLocalStorage.getItem(SESSION_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  }

  function saveSession(customer: Customer): void {
    try {
      safeLocalStorage.setItem(SESSION_KEY, JSON.stringify(customer))
    } catch {
      // ignore
    }
  }

  function clearSession(): void {
    try {
      safeLocalStorage.removeItem(SESSION_KEY)
    } catch {
      // ignore
    }
  }

  // ——— Auth Modal ———
  function openAuthModal(): void {
    isAuthModalOpen.value = true
    authError.value = ''
  }

  function closeAuthModal(): void {
    isAuthModalOpen.value = false
    authError.value = ''
  }

  // ——— Google Sign In ———
  async function loginWithGoogle(googleUser: {
    sub: string
    name: string
    email?: string
    picture?: string
  }): Promise<boolean> {
    isLoading.value = true
    authError.value = ''
    try {
      const customer = await loginCustomerWithGoogle(
        googleUser.sub,
        googleUser.name,
        googleUser.email,
        googleUser.picture
      )
      currentCustomer.value = customer
      saveSession(customer)
      closeAuthModal()
      return true
    } catch (err: any) {
      authError.value = err.message || 'Google sign-in failed. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ——— WhatsApp OTP ———
  async function requestWhatsAppOtp(phone: string): Promise<void> {
    isLoading.value = true
    authError.value = ''
    try {
      await sendWhatsAppOtp(phone)
    } catch (err: any) {
      authError.value = err.message || 'Failed to send OTP. Please try again.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function verifyOtp(phone: string, otp: string): Promise<boolean> {
    isLoading.value = true
    authError.value = ''
    try {
      const customer = await verifyWhatsAppOtp(phone, otp)
      currentCustomer.value = customer
      saveSession(customer)
      closeAuthModal()
      return true
    } catch (err: any) {
      authError.value = err.message || 'OTP verification failed. Please try again.'
      return false
    } finally {
      isLoading.value = false
    }
  }

  // ——— Logout ———
  function logout(): void {
    currentCustomer.value = null
    clearSession()
  }

  // ——— Update name after WhatsApp login ———
  function updateCustomerName(name: string): void {
    if (currentCustomer.value) {
      currentCustomer.value = { ...currentCustomer.value, name }
      saveSession(currentCustomer.value)
    }
  }

  return {
    currentCustomer,
    isAuthenticated,
    isAuthModalOpen,
    isLoading,
    authError,
    customerName,
    customerPhone,
    customerAvatar,
    openAuthModal,
    closeAuthModal,
    loginWithGoogle,
    requestWhatsAppOtp,
    verifyOtp,
    logout,
    updateCustomerName
  }
})
