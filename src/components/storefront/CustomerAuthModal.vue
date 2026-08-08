<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import {
  X,
  MessageSquare,
  Globe,
  Phone,
  ShieldCheck,
  Loader,
  LogOut,
  User,
  CheckCircle,
  ArrowLeft,
  Sparkles
} from '@lucide/vue'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// Tabs: 'options' | 'google' | 'whatsapp' | 'otp'
const activeTab = ref<'options' | 'google' | 'whatsapp' | 'otp'>('options')
const phoneInput = ref<string>('')
const otpInput = ref<string>('')
const phoneError = ref<string>('')
const otpError = ref<string>('')
const customerNameInput = ref<string>('')

// Resend cooldown
const resendCooldown = ref<number>(0)
let resendTimer: ReturnType<typeof setInterval> | null = null

function startResendCooldown() {
  resendCooldown.value = 30
  if (resendTimer) clearInterval(resendTimer)
  resendTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && resendTimer) {
      clearInterval(resendTimer)
      resendTimer = null
    }
  }, 1000)
}

// ——— Google Sign In ———
declare const google: any

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

let googleButtonDiv: HTMLElement | null = null

function initGoogleSignIn() {
  const clientId = googleClientId
  if (!clientId || typeof google === 'undefined') return

  try {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCallback,
      auto_select: false
    })

    if (googleButtonDiv) {
      google.accounts.id.renderButton(googleButtonDiv, {
        theme: 'filled_black',
        size: 'large',
        width: '100%',
        text: 'signin_with',
        shape: 'pill'
      })
    }
  } catch {
    // Google SDK not available
  }
}

async function handleGoogleCallback(response: any) {
  try {
    // Decode JWT payload (Google ID token)
    const parts = response.credential.split('.')
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))

    const success = await authStore.loginWithGoogle({
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture
    })

    if (success) {
      emit('notify', `Welcome back, ${payload.name}! 🎉`, 'success')
    } else {
      emit('notify', authStore.authError || 'Google sign-in failed.', 'error')
    }
  } catch {
    emit('notify', 'Failed to process Google sign-in.', 'error')
  }
}

// ——— WhatsApp OTP ———
function validatePhone(): boolean {
  phoneError.value = ''
  const digits = phoneInput.value.replace(/\D/g, '')
  if (!digits || digits.length < 10) {
    phoneError.value = 'Enter a valid phone number with country code (e.g. 919876543210)'
    return false
  }
  return true
}

async function handleSendOtp() {
  if (!validatePhone()) return
  try {
    const phone = phoneInput.value.replace(/\D/g, '')
    await authStore.requestWhatsAppOtp(phone)
    startResendCooldown()
    activeTab.value = 'otp'
  } catch {
    phoneError.value = authStore.authError || 'Failed to send OTP.'
  }
}

async function handleResendOtp() {
  if (resendCooldown.value > 0) return
  try {
    const phone = phoneInput.value.replace(/\D/g, '')
    await authStore.requestWhatsAppOtp(phone)
    startResendCooldown()
    otpError.value = ''
  } catch {
    otpError.value = authStore.authError || 'Failed to resend OTP.'
  }
}

async function handleVerifyOtp() {
  otpError.value = ''
  if (!otpInput.value || otpInput.value.length !== 6) {
    otpError.value = 'Enter the 6-digit OTP code'
    return
  }
  const phone = phoneInput.value.replace(/\D/g, '')
  const success = await authStore.verifyOtp(phone, otpInput.value)
  if (success) {
    // If name not set, ask for it
    if (authStore.currentCustomer?.name === phone) {
      customerNameInput.value = ''
      activeTab.value = 'options' // will show profile after close
    }
    emit('notify', 'Phone verified! You are now signed in. 🎉', 'success')
  } else {
    otpError.value = authStore.authError || 'Invalid OTP.'
  }
}

function handleLogout() {
  authStore.logout()
  authStore.closeAuthModal()
  emit('notify', 'You have been signed out.', 'info')
}

// ——— Keyboard + lifecycle ———
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') authStore.closeAuthModal()
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (resendTimer) clearInterval(resendTimer)
})

watch(
  () => authStore.isAuthModalOpen,
  (open) => {
    if (open) {
      activeTab.value = authStore.isAuthenticated ? 'options' : 'options'
      phoneInput.value = ''
      otpInput.value = ''
      phoneError.value = ''
      otpError.value = ''
      resendCooldown.value = 0
      if (resendTimer) {
        clearInterval(resendTimer)
        resendTimer = null
      }
      // Init Google after modal opens
      setTimeout(initGoogleSignIn, 100)
    }
  }
)

watch(activeTab, (tab) => {
  if (tab === 'google') {
    setTimeout(initGoogleSignIn, 150)
  }
})
</script>

<template>
  <div
    v-if="authStore.isAuthModalOpen"
    class="auth-modal-overlay"
    @click.self="authStore.closeAuthModal()"
  >
    <div class="auth-modal glass-panel animate-fade-in">
      <!-- Close -->
      <button class="modal-close-btn" @click="authStore.closeAuthModal()">
        <X :size="20" />
      </button>

      <!-- ——— LOGGED IN STATE ——— -->
      <template v-if="authStore.isAuthenticated">
        <div class="profile-view">
          <div class="profile-avatar-ring">
            <img
              v-if="authStore.customerAvatar"
              :src="authStore.customerAvatar"
              :alt="authStore.customerName"
              class="profile-avatar"
            />
            <div v-else class="profile-avatar-placeholder">
              <User :size="28" />
            </div>
          </div>

          <h3 class="profile-name">{{ authStore.customerName }}</h3>
          <p class="profile-meta">
            <span
              class="provider-badge"
              :class="
                authStore.currentCustomer?.provider === 'google' ? 'badge-google' : 'badge-whatsapp'
              "
            >
              {{
                authStore.currentCustomer?.provider === 'google'
                  ? '🔵 Google Account'
                  : '💬 WhatsApp'
              }}
            </span>
          </p>
          <p v-if="authStore.currentCustomer?.email" class="profile-detail">
            {{ authStore.currentCustomer.email }}
          </p>
          <p v-if="authStore.currentCustomer?.phone" class="profile-detail">
            +{{ authStore.currentCustomer.phone }}
          </p>

          <div class="profile-actions">
            <button class="btn btn-secondary profile-btn" @click="authStore.closeAuthModal()">
              <CheckCircle :size="16" /> Continue Shopping
            </button>
            <button class="btn btn-danger profile-btn" @click="handleLogout">
              <LogOut :size="16" /> Sign Out
            </button>
          </div>
        </div>
      </template>

      <!-- ——— NOT LOGGED IN ——— -->
      <template v-else>
        <!-- Options (Home) -->
        <template v-if="activeTab === 'options'">
          <div class="modal-header">
            <div class="modal-icon-ring">
              <Sparkles :size="26" class="modal-sparkle-icon" />
            </div>
            <h2 class="modal-title">Welcome to {{ settingsStore.settings.storeName }}</h2>
            <p class="modal-subtitle">
              Sign in or create an account to save your cart & track orders
            </p>
          </div>

          <div class="auth-options-grid">
            <!-- Google -->
            <button class="auth-option-btn google-option" @click="activeTab = 'google'">
              <div class="option-icon google-icon">
                <Globe :size="22" />
              </div>
              <div class="option-text">
                <span class="option-title">Continue with Google</span>
                <span class="option-sub">Fast & secure sign-in</span>
              </div>
              <div class="option-arrow">→</div>
            </button>

            <!-- WhatsApp (Conditional based on settings) -->
            <button
              v-if="settingsStore.settings.enableWhatsAppOtp"
              class="auth-option-btn whatsapp-option"
              @click="activeTab = 'whatsapp'"
            >
              <div class="option-icon wa-icon">
                <MessageSquare :size="22" />
              </div>
              <div class="option-text">
                <span class="option-title">Continue with WhatsApp</span>
                <span class="option-sub">OTP verification via WhatsApp</span>
              </div>
              <div class="option-arrow">→</div>
            </button>
          </div>

          <p class="auth-tos">
            <ShieldCheck :size="13" /> By signing in, you agree to our privacy policy. We never
            share your data.
          </p>
        </template>

        <!-- Google Tab -->
        <template v-else-if="activeTab === 'google'">
          <button class="back-btn" @click="activeTab = 'options'">
            <ArrowLeft :size="16" /> Back
          </button>
          <div class="modal-header compact">
            <div class="modal-icon-ring google-ring">
              <Globe :size="24" />
            </div>
            <h2 class="modal-title">Sign in with Google</h2>
            <p class="modal-subtitle">Use your Google account for instant access</p>
          </div>

          <div class="google-btn-area">
            <div id="google-signin-button" ref="googleButtonDiv" class="google-gsi-button"></div>
            <p v-if="!googleClientId" class="config-warn">
              ⚠️ Google Client ID not configured. Add <code>VITE_GOOGLE_CLIENT_ID</code> to your
              <code>.env</code> file.
            </p>
          </div>

          <p class="auth-tos">
            <ShieldCheck :size="13" /> Your Google account details are never stored on our servers
            beyond your name & avatar.
          </p>
        </template>

        <!-- WhatsApp Phone Entry -->
        <template v-else-if="activeTab === 'whatsapp'">
          <button class="back-btn" @click="activeTab = 'options'">
            <ArrowLeft :size="16" /> Back
          </button>
          <div class="modal-header compact">
            <div class="modal-icon-ring wa-ring">
              <MessageSquare :size="24" />
            </div>
            <h2 class="modal-title">WhatsApp Verification</h2>
            <p class="modal-subtitle">We'll send a 6-digit OTP to your WhatsApp number</p>
          </div>

          <div class="form-group">
            <label class="input-label"
              >WhatsApp Phone Number <span class="label-hint">(with country code)</span></label
            >
            <div class="input-with-icon">
              <Phone :size="16" class="input-icon" />
              <input
                v-model="phoneInput"
                type="tel"
                placeholder="e.g. 919876543210"
                class="input-field pl-icon"
                :class="{ 'input-error': phoneError }"
                @keydown.enter="handleSendOtp"
              />
            </div>
            <span v-if="phoneError" class="error-msg">{{ phoneError }}</span>
            <span class="field-hint">Include country code without +. Example: 91 for India</span>
          </div>

          <button
            class="btn btn-whatsapp auth-action-btn"
            :disabled="authStore.isLoading"
            @click="handleSendOtp"
          >
            <Loader v-if="authStore.isLoading" :size="18" class="spin-icon" />
            <MessageSquare v-else :size="18" />
            {{ authStore.isLoading ? 'Sending OTP...' : 'Send OTP to My WhatsApp' }}
          </button>
        </template>

        <!-- OTP Verify Step -->
        <template v-else-if="activeTab === 'otp'">
          <button
            class="back-btn"
            @click="
              () => {
                activeTab = 'whatsapp'
                otpInput = ''
                otpError = ''
              }
            "
          >
            <ArrowLeft :size="16" /> Back
          </button>

          <div class="modal-header compact">
            <div class="modal-icon-ring wa-ring">
              <ShieldCheck :size="24" />
            </div>
            <h2 class="modal-title">Enter Your OTP</h2>
            <p class="modal-subtitle">
              A 6-digit OTP has been sent to your WhatsApp
              <strong class="phone-highlight">+{{ phoneInput.replace(/\D/g, '') }}</strong>
            </p>
          </div>

          <!-- OTP confirmation banner -->
          <div class="otp-sent-banner">
            <MessageSquare :size="18" class="banner-icon" />
            <span>Check your WhatsApp for the OTP message from us</span>
          </div>

          <div class="form-group">
            <label class="input-label">6-Digit OTP</label>
            <input
              v-model="otpInput"
              type="text"
              inputmode="numeric"
              maxlength="6"
              placeholder="e.g. 482916"
              class="input-field otp-input-field"
              :class="{ 'input-error': otpError }"
              @keydown.enter="handleVerifyOtp"
            />
            <span v-if="otpError" class="error-msg">{{ otpError }}</span>
          </div>

          <button
            class="btn btn-primary auth-action-btn"
            :disabled="authStore.isLoading"
            @click="handleVerifyOtp"
          >
            <Loader v-if="authStore.isLoading" :size="18" class="spin-icon" />
            <ShieldCheck v-else :size="18" />
            {{ authStore.isLoading ? 'Verifying...' : 'Verify & Sign In' }}
          </button>

          <!-- Resend OTP -->
          <div class="resend-row">
            <span class="resend-label">Didn't receive the OTP?</span>
            <button
              class="resend-btn"
              :disabled="resendCooldown > 0 || authStore.isLoading"
              @click="handleResendOtp"
            >
              <span v-if="resendCooldown > 0">Resend in {{ resendCooldown }}s</span>
              <span v-else>Resend OTP</span>
            </button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 36px 32px 32px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 90vh;
  overflow-y: auto;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-fade-in {
  animation: fadeInScale 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: var(--text-primary);
}

/* ——— Header ——— */
.modal-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.modal-header.compact {
  gap: 8px;
}

.modal-icon-ring {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent-primary-glow);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(180, 83, 9, 0.25);
}

.google-ring {
  background: rgba(66, 133, 244, 0.12);
  color: #4285f4;
  border-color: rgba(66, 133, 244, 0.25);
}

.wa-ring {
  background: rgba(37, 211, 102, 0.12);
  color: var(--accent-whatsapp);
  border-color: rgba(37, 211, 102, 0.25);
}

.modal-sparkle-icon {
  color: var(--accent-primary);
}

.modal-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.5;
}

/* ——— Auth Options ——— */
.auth-options-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-option-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  width: 100%;
}

.auth-option-btn:hover {
  border-color: var(--border-color-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.google-option:hover {
  border-color: rgba(66, 133, 244, 0.4);
  background: rgba(66, 133, 244, 0.05);
}

.whatsapp-option:hover {
  border-color: rgba(37, 211, 102, 0.4);
  background: rgba(37, 211, 102, 0.05);
}

.option-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.google-icon {
  background: rgba(66, 133, 244, 0.15);
  color: #4285f4;
}

.wa-icon {
  background: rgba(37, 211, 102, 0.15);
  color: var(--accent-whatsapp);
}

.option-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.option-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.option-arrow {
  font-size: 1.1rem;
  color: var(--text-muted);
  transition: transform 0.2s;
}

.auth-option-btn:hover .option-arrow {
  transform: translateX(3px);
  color: var(--text-secondary);
}

/* ——— Google GSI Button ——— */
.google-btn-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.google-gsi-button {
  width: 100%;
  min-height: 48px;
}

.config-warn {
  font-size: 0.8rem;
  color: var(--accent-gold);
  background: rgba(217, 119, 6, 0.1);
  border: 1px dashed rgba(217, 119, 6, 0.4);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  line-height: 1.5;
  text-align: center;
}

.config-warn code {
  font-family: monospace;
  background: rgba(217, 119, 6, 0.2);
  padding: 1px 4px;
  border-radius: 3px;
}

/* ——— OTP Steps ——— */
.otp-steps {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
}

.otp-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent-primary);
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  line-height: 1.5;
}

.otp-code {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--accent-primary);
  letter-spacing: 4px;
  background: var(--accent-primary-glow);
  padding: 2px 10px;
  border-radius: var(--radius-sm);
}

.copy-btn {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: 2px 8px;
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.wa-send-btn {
  padding: 4px 12px;
  font-size: 0.78rem;
}

/* ——— OTP input ——— */
.otp-input-field {
  text-align: center;
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: 10px;
  font-family: monospace;
}

/* ——— Actions ——— */
.auth-action-btn {
  width: 100%;
  padding: 13px 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.96rem;
}

/* ——— Back button ——— */
.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  align-self: flex-start;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--text-primary);
}

/* ——— Form ——— */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-with-icon {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.pl-icon {
  padding-left: 38px;
}

.input-error {
  border-color: var(--accent-danger) !important;
}

.error-msg {
  font-size: 0.75rem;
  color: var(--accent-danger);
}

/* ——— TOS ——— */
.auth-tos {
  font-size: 0.72rem;
  color: var(--text-muted);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

/* ——— Profile view ——— */
.profile-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-top: 8px;
}

.profile-avatar-ring {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  padding: 3px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-gold));
}

.profile-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.profile-avatar-placeholder {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-name {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text-primary);
}

.profile-meta {
  display: flex;
  gap: 8px;
}

.provider-badge {
  font-size: 0.78rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.badge-google {
  background: rgba(66, 133, 244, 0.12);
  color: #4285f4;
}

.badge-whatsapp {
  background: rgba(37, 211, 102, 0.12);
  color: var(--accent-whatsapp);
}

.profile-detail {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.profile-actions {
  display: flex;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.profile-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
}

/* ——— Spin loader ——— */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin-icon {
  animation: spin 0.8s linear infinite;
}

/* ——— OTP sent banner ——— */
.otp-sent-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(37, 211, 102, 0.1);
  border: 1px solid rgba(37, 211, 102, 0.3);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  font-size: 0.85rem;
  color: var(--accent-whatsapp);
  font-weight: 600;
}

.banner-icon {
  flex-shrink: 0;
}

/* ——— Phone highlight in OTP subtitle ——— */
.phone-highlight {
  color: var(--accent-whatsapp);
  font-weight: 700;
}

/* ——— Label hint ——— */
.label-hint {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-muted);
}

/* ——— Field hint ——— */
.field-hint {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* ——— Resend OTP row ——— */
.resend-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 0.82rem;
}

.resend-label {
  color: var(--text-muted);
}

.resend-btn {
  background: transparent;
  border: none;
  color: var(--accent-whatsapp);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s;
}

.resend-btn:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
  font-weight: 400;
}

.resend-btn:not(:disabled):hover {
  text-decoration: underline;
}

/* ——— Mobile ——— */
@media (max-width: 480px) {
  .auth-modal {
    padding: 28px 20px 24px;
    max-height: 95vh;
  }
  .modal-title {
    font-size: 1.2rem;
  }
}
</style>
