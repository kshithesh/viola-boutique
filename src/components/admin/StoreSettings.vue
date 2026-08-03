<script setup>
import { ref, watch } from 'vue'
import { Save, Phone, DollarSign, Store, Truck, Lock, MapPin, CreditCard } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore.js'

const emit = defineEmits(['notify'])
const settingsStore = useSettingsStore()

const formData = ref({ ...settingsStore.settings })

watch(
  () => settingsStore.settings,
  (newSettings) => {
    formData.value = { ...newSettings }
  },
  { deep: true }
)

function handleSaveSettings() {
  settingsStore.updateSettings(formData.value)
  emit('notify', 'Store configuration & admin password saved!', 'success')
}
</script>

<template>
  <div class="store-settings-container glass-panel">
    <div class="settings-header">
      <h3>Store & Security Configuration</h3>
      <p class="subtitle">Configure your WhatsApp phone number, Razorpay API Keys, store currency, shipping rules, and Admin Dashboard password.</p>
    </div>

    <form @submit.prevent="handleSaveSettings" class="settings-form">
      <div class="settings-grid">
        <!-- Razorpay Payment Gateway Settings -->
        <div class="settings-card highlight-card">
          <h4 class="card-title"><CreditCard :size="16" /> Razorpay Payment Gateway</h4>
          <p class="card-subtitle">Enable instant online checkout via UPI (Google Pay, PhonePe, Paytm), Cards & NetBanking.</p>

          <div class="form-group mt-3">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.enableRazorpay" />
              <span>Enable Razorpay Online Checkout</span>
            </label>
          </div>

          <div class="form-group mt-3" v-if="formData.enableRazorpay">
            <label class="input-label">Razorpay Key ID (Test or Live) *</label>
            <input 
              type="text" 
              v-model="formData.razorpayKeyId" 
              required 
              class="input-field" 
              placeholder="e.g. rzp_test_..." 
            />
            <span class="field-hint">
              Default Test Key: <code>rzp_test_VioraBoutique2026</code>. Get your live keys from <a href="https://dashboard.razorpay.com/" target="_blank" rel="noopener">Razorpay Dashboard</a>.
            </span>
          </div>
        </div>

        <!-- WhatsApp Phone & Business Profile -->
        <div class="settings-card">
          <h4 class="card-title"><Phone :size="16" /> WhatsApp Business Contact</h4>
          <p class="card-subtitle">Orders generated in the cart will be sent to this number.</p>

          <div class="form-group mt-3">
            <label class="input-label">Target WhatsApp Number (Country Code + Digits) *</label>
            <input 
              type="text" 
              v-model="formData.whatsappNumber" 
              required 
              class="input-field" 
              placeholder="e.g. 919876543210" 
            />
            <span class="field-hint">Do not include plus signs or spaces. Example: 919876543210</span>
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Welcome Greeting Message</label>
            <input 
              type="text" 
              v-model="formData.welcomeMessage" 
              class="input-field" 
            />
          </div>
        </div>

        <!-- Admin Dashboard Password Security -->
        <div class="settings-card">
          <h4 class="card-title"><Lock :size="16" /> Admin Dashboard Password</h4>
          <p class="card-subtitle">Password required to unlock inventory management & orders log.</p>

          <div class="form-group mt-3">
            <label class="input-label">Admin Password *</label>
            <input 
              type="text" 
              v-model="formData.adminPassword" 
              required 
              class="input-field" 
              placeholder="e.g. viora123" 
            />
            <span class="field-hint" v-if="formData.adminPassword === 'viora123'">
              Status: Using Default Password (viora123). Change this for better security.
            </span>
            <span class="field-hint text-success" v-else>
              Status: Customized Password saved. Remember your new password for login!
            </span>
          </div>
        </div>

        <!-- Branding & Location -->
        <div class="settings-card">
          <h4 class="card-title"><Store :size="16" /> Store Identity & Location</h4>

          <div class="form-group mt-3">
            <label class="input-label">Store Brand Name *</label>
            <input type="text" v-model="formData.storeName" required class="input-field" />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Tagline</label>
            <input type="text" v-model="formData.tagline" class="input-field" />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Business Address</label>
            <input type="text" v-model="formData.businessAddress" class="input-field" />
          </div>
        </div>

        <!-- Currency & Shipping -->
        <div class="settings-card">
          <h4 class="card-title"><Truck :size="16" /> Pricing & Shipping Rules</h4>

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
              type="number" 
              step="1" 
              v-model.number="formData.deliveryFee" 
              class="input-field" 
            />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Free Shipping Threshold (₹)</label>
            <input 
              type="number" 
              step="100" 
              v-model.number="formData.freeShippingThreshold" 
              class="input-field" 
            />
          </div>
        </div>
      </div>

      <div class="settings-action-bar">
        <button type="submit" class="btn btn-primary btn-lg">
          <Save :size="18" /> Save Configuration
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.store-settings-container {
  padding: 28px;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.settings-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.highlight-card {
  border-color: rgba(180, 83, 9, 0.35);
  background: rgba(180, 83, 9, 0.05);
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

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

.settings-action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}
</style>
