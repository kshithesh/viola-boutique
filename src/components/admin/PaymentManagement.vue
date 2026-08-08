<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { CreditCard, MessageSquare, Zap, Save, Truck, TrendingUp, Banknote } from '@lucide/vue'
import type { StoreSettings } from '../../types'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCartStore } from '../../stores/cartStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const settingsStore = useSettingsStore()
const cartStore = useCartStore()

const formData = ref<StoreSettings>({ ...settingsStore.settings })

watch(
  () => settingsStore.settings,
  (newSettings) => {
    formData.value = { ...newSettings }
  },
  { deep: true }
)

// Analytics calculations
const razorpayRevenue = computed<number>(() => {
  return cartStore.orders
    .filter(
      (o) =>
        (o.paymentMethod?.toLowerCase().includes('razorpay') || !!o.paymentId) &&
        o.status === 'Paid via Razorpay'
    )
    .reduce((sum, o) => sum + o.totalAmount, 0)
})

const whatsappCodRevenue = computed<number>(() => {
  return cartStore.orders
    .filter(
      (o) =>
        !o.paymentMethod?.toLowerCase().includes('razorpay') &&
        !o.paymentId &&
        o.status !== 'Cancelled'
    )
    .reduce((sum, o) => sum + o.totalAmount, 0)
})

const totalOrdersCount = computed<number>(() => cartStore.orders.length)

function handleSaveSettings(): void {
  settingsStore.updateSettings(formData.value)
  emit('notify', 'Payment gateways, channels & pricing rules saved successfully!', 'success')
}
</script>

<template>
  <div class="payment-management-container glass-panel">
    <!-- Section Header & Analytics Bar -->
    <div class="payments-header">
      <div>
        <h3><CreditCard :size="22" class="header-icon" /> Payment Settings & Gateways</h3>
        <p class="subtitle">
          Configure online payment gateways, WhatsApp ordering channels, offline payment methods,
          tax rates, and delivery fees.
        </p>
      </div>
    </div>

    <!-- Analytics Cards -->
    <div class="analytics-grid mb-4">
      <div class="stat-card">
        <div class="stat-icon icon-cyan">
          <Zap :size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-val">{{ settingsStore.formatPrice(razorpayRevenue) }}</span>
          <span class="stat-lbl">Razorpay Online Verified Paid</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-emerald">
          <MessageSquare :size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-val">{{ settingsStore.formatPrice(whatsappCodRevenue) }}</span>
          <span class="stat-lbl">WhatsApp / COD Order Volume</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon icon-amber">
          <TrendingUp :size="20" />
        </div>
        <div class="stat-info">
          <span class="stat-val">{{ totalOrdersCount }} Orders</span>
          <span class="stat-lbl">Total Processed Orders</span>
        </div>
      </div>
    </div>

    <!-- Payment Configuration Form -->
    <form class="payment-form" @submit.prevent="handleSaveSettings">
      <div class="payment-grid">
        <!-- 1. Razorpay Gateway Card -->
        <div
          class="settings-card highlight-card-blue"
          :class="{ 'card-disabled': !formData.enableRazorpay }"
        >
          <div class="card-header-flex">
            <div>
              <h4 class="card-title">
                <Zap :size="18" class="text-cyan" /> Razorpay Payment Gateway
              </h4>
              <p class="card-subtitle">
                Enable instant online checkout via Google Pay, PhonePe, Paytm UPI, Cards &
                NetBanking.
              </p>
            </div>
            <span
              class="status-pill"
              :class="formData.enableRazorpay ? 'status-online' : 'status-offline'"
            >
              <span
                class="status-dot"
                :class="formData.enableRazorpay ? 'bg-info animate-pulse' : 'bg-muted'"
              ></span>
              {{ formData.enableRazorpay ? 'Active Gateway' : 'Disabled' }}
            </span>
          </div>

          <div class="form-group mt-3">
            <label class="checkbox-label highlight-checkbox-blue">
              <input v-model="formData.enableRazorpay" type="checkbox" />
              <span>Enable Razorpay Online Checkout in Shopping Cart</span>
            </label>
          </div>

          <div class="form-group mt-3" :class="{ 'opacity-50': !formData.enableRazorpay }">
            <label class="input-label">Razorpay Key ID (Test or Live) *</label>
            <input
              v-model="formData.razorpayKeyId"
              type="text"
              :required="formData.enableRazorpay"
              :disabled="!formData.enableRazorpay"
              class="input-field"
              placeholder="e.g. rzp_test_VioraBoutique2026"
            />
            <span class="field-hint">
              Default Test Key: <code>rzp_test_VioraBoutique2026</code>. Manage live keys via
              <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener"
                >Razorpay Dashboard</a
              >.
            </span>
          </div>
        </div>

        <!-- 2. WhatsApp Order Channel Card -->
        <div
          class="settings-card highlight-card-green"
          :class="{ 'card-disabled': formData.enableWhatsApp === false }"
        >
          <div class="card-header-flex">
            <div>
              <h4 class="card-title">
                <MessageSquare :size="18" class="text-whatsapp" /> WhatsApp Concierge Channel
              </h4>
              <p class="card-subtitle">
                Control direct WhatsApp order generation and stylist chat integration across the
                app.
              </p>
            </div>
            <span
              class="status-pill"
              :class="formData.enableWhatsApp !== false ? 'status-whatsapp' : 'status-offline'"
            >
              <span
                class="status-dot"
                :class="formData.enableWhatsApp !== false ? 'bg-success animate-pulse' : 'bg-muted'"
              ></span>
              {{ formData.enableWhatsApp !== false ? 'Active Channel' : 'Disabled' }}
            </span>
          </div>

          <div class="form-group mt-3">
            <label class="checkbox-label highlight-checkbox-green">
              <input v-model="formData.enableWhatsApp" type="checkbox" />
              <span>Enable WhatsApp Ordering & Concierge Chat</span>
            </label>
            <span class="field-hint">
              When enabled, customers can trigger 1-click orders and stylist consultation on
              WhatsApp.
            </span>
          </div>

          <div class="form-group mt-3" :class="{ 'opacity-50': formData.enableWhatsApp === false }">
            <label class="input-label">Target WhatsApp Number (Country Code + Digits) *</label>
            <input
              v-model="formData.whatsappNumber"
              type="text"
              :required="formData.enableWhatsApp !== false"
              :disabled="formData.enableWhatsApp === false"
              class="input-field"
              placeholder="e.g. 919876543210"
            />
            <span class="field-hint">Format: 919876543210 (without spaces or plus signs)</span>
          </div>

          <div class="form-group mt-3" :class="{ 'opacity-50': formData.enableWhatsApp === false }">
            <label class="input-label">Welcome Greeting Message</label>
            <input
              v-model="formData.welcomeMessage"
              type="text"
              :disabled="formData.enableWhatsApp === false"
              class="input-field"
            />
          </div>

          <div
            class="form-group mt-3 pt-3 border-t border-glass"
            :class="{ 'opacity-50': formData.enableWhatsApp === false }"
          >
            <label class="checkbox-label highlight-checkbox-green">
              <input
                v-model="formData.enableWhatsAppOtp"
                type="checkbox"
                :disabled="formData.enableWhatsApp === false"
              />
              <span>Enable WhatsApp OTP Verification for Customer Login</span>
            </label>
            <span class="field-hint">
              When enabled, customers can log in via WhatsApp 6-digit OTP authentication. (Currently
              disabled by default)
            </span>
          </div>
        </div>

        <!-- 3. Direct & Offline Payment Methods Card -->
        <div class="settings-card">
          <h4 class="card-title"><Banknote :size="18" /> Offline & Direct Payment Methods</h4>
          <p class="card-subtitle">
            Configure additional checkout payment methods available in the customer cart drawer.
          </p>

          <div class="form-group mt-3">
            <label class="checkbox-label">
              <input v-model="formData.enableCOD" type="checkbox" />
              <span>Cash on Delivery (COD)</span>
            </label>
            <span class="field-hint">Allow customers to pay in cash upon doorstep delivery.</span>
          </div>

          <div class="form-group mt-3">
            <label class="checkbox-label">
              <input v-model="formData.enableUPI" type="checkbox" />
              <span>Direct Bank Transfer / UPI Payment</span>
            </label>
            <span class="field-hint">Allow customers to complete direct bank transfers.</span>
          </div>
        </div>

        <!-- 4. Pricing, Shipping & Tax Rules Card -->
        <div class="settings-card">
          <h4 class="card-title"><Truck :size="18" /> Currency, Delivery & Tax Rules</h4>
          <p class="card-subtitle">Define currency symbols, shipping fees, and tax rates.</p>

          <div class="form-group mt-3">
            <label class="input-label">Currency Symbol</label>
            <select v-model="formData.currency" class="input-field">
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="AED">AED (Dirhams)</option>
            </select>
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Standard Delivery Fee (₹)</label>
            <input
              v-model.number="formData.deliveryFee"
              type="number"
              step="1"
              class="input-field"
            />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Free Shipping Threshold (₹)</label>
            <input
              v-model.number="formData.freeShippingThreshold"
              type="number"
              step="100"
              class="input-field"
            />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">GST / Tax Rate (%)</label>
            <div class="tax-rate-row">
              <input
                :value="(formData.taxRate * 100).toFixed(0)"
                type="number"
                step="1"
                min="0"
                max="30"
                class="input-field"
                @input="
                  formData.taxRate = Number(($event.target as HTMLInputElement).value || 0) / 100
                "
              />
              <span class="tax-pct-sign">%</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-action-bar">
        <button type="submit" class="btn btn-primary btn-lg">
          <Save :size="18" /> Save Payment Configuration
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.payment-management-container {
  padding: 28px;
}

.payments-header {
  margin-bottom: 20px;
}

.header-icon {
  color: var(--accent-primary);
  vertical-align: middle;
}

.payments-header h3 {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-cyan {
  background: rgba(2, 132, 199, 0.15);
  color: var(--accent-info);
}

.icon-emerald {
  background: rgba(37, 211, 102, 0.15);
  color: var(--accent-whatsapp);
}

.icon-amber {
  background: rgba(217, 119, 6, 0.15);
  color: var(--accent-gold);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-family: var(--font-heading);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-lbl {
  font-size: 0.76rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.payment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.settings-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.settings-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-color-hover);
}

.highlight-card-blue {
  border-color: rgba(2, 132, 199, 0.35);
  background: rgba(2, 132, 199, 0.04);
}

.highlight-card-green {
  border-color: rgba(37, 211, 102, 0.35);
  background: rgba(37, 211, 102, 0.04);
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.status-online {
  background: rgba(2, 132, 199, 0.15);
  color: var(--accent-info);
  border: 1px solid rgba(2, 132, 199, 0.3);
}

.status-whatsapp {
  background: rgba(37, 211, 102, 0.15);
  color: var(--accent-whatsapp);
  border: 1px solid rgba(37, 211, 102, 0.3);
}

.status-offline {
  background: rgba(148, 128, 112, 0.15);
  color: var(--text-muted);
  border: 1px solid rgba(148, 128, 112, 0.3);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.bg-info {
  background-color: var(--accent-info);
}
.bg-success {
  background-color: var(--accent-whatsapp);
}
.bg-muted {
  background-color: var(--text-muted);
}

.field-hint {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
}

.highlight-checkbox-blue {
  background: rgba(2, 132, 199, 0.1);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(2, 132, 199, 0.3);
}

.highlight-checkbox-green {
  background: rgba(37, 211, 102, 0.1);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(37, 211, 102, 0.3);
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}

.card-disabled {
  opacity: 0.7;
}

.tax-rate-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tax-pct-sign {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.settings-action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.mt-3 {
  margin-top: 12px;
}
.mb-4 {
  margin-bottom: 24px;
}
.text-cyan {
  color: var(--accent-info);
}
.text-whatsapp {
  color: var(--accent-whatsapp);
}

@media (max-width: 768px) {
  .payment-management-container {
    padding: 14px;
  }
  .card-header-flex {
    flex-direction: column;
    gap: 8px;
  }
  .payment-grid,
  .analytics-grid {
    grid-template-columns: 1fr;
  }
  .settings-action-bar .btn {
    width: 100%;
    justify-content: center;
    min-height: 46px;
  }
}
</style>
