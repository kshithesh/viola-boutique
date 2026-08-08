<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  Save,
  Store,
  Lock,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layout
} from '@lucide/vue'
import type { StoreSettings } from '../../types'
import { useSettingsStore } from '../../stores/settingsStore'
import { isTursoConfigured, initDatabase } from '../../services/tursoService'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const settingsStore = useSettingsStore()

const formData = ref<StoreSettings>({ ...settingsStore.settings })
const isCheckingDb = ref<boolean>(false)
const dbStatus = ref<'unknown' | 'online' | 'offline'>('unknown')
const dbMessage = ref<string>('')

watch(
  () => settingsStore.settings,
  (newSettings) => {
    formData.value = { ...newSettings }
  },
  { deep: true }
)

onMounted(() => {
  checkDbStatus(false)
})

async function checkDbStatus(userInitiated = true): Promise<void> {
  isCheckingDb.value = true
  dbMessage.value = ''

  const configured = isTursoConfigured()

  if (!configured) {
    dbStatus.value = 'offline'
    dbMessage.value =
      'Turso environment variables (VITE_TURSO_DATABASE_URL & VITE_TURSO_AUTH_TOKEN) are not set. Operating in local storage mode.'
    if (userInitiated) {
      emit('notify', 'Turso DB credentials not configured in environment variables.', 'info')
    }
    isCheckingDb.value = false
    return
  }

  try {
    const success = await initDatabase()
    if (success) {
      dbStatus.value = 'online'
      dbMessage.value =
        'Connection successful! Turso edge database is online and fully synchronized.'
      if (userInitiated) {
        emit('notify', 'Turso Edge Database is online & connected!', 'success')
      }
    } else {
      dbStatus.value = 'offline'
      dbMessage.value =
        'Unable to reach Turso database endpoints. Operating in local storage fallback mode.'
      if (userInitiated) {
        emit('notify', 'Could not reach Turso DB endpoints.', 'error')
      }
    }
  } catch (err: any) {
    dbStatus.value = 'offline'
    dbMessage.value = err.message || 'Database connection test failed.'
    if (userInitiated) {
      emit('notify', `DB Test Failed: ${err.message}`, 'error')
    }
  } finally {
    isCheckingDb.value = false
  }
}

function handleSaveSettings(): void {
  settingsStore.updateSettings(formData.value)
  emit('notify', 'Store configuration & admin password saved!', 'success')
}
</script>

<template>
  <div class="store-settings-container glass-panel">
    <div class="settings-header">
      <h3>Store & Security Configuration</h3>
      <p class="subtitle">
        Configure store identity, business address, Admin Dashboard password, hero banner copy, and
        test live Turso DB connectivity. Manage payment gateways and WhatsApp channels in Payment
        Settings & Gateways.
      </p>
    </div>

    <form class="settings-form" @submit.prevent="handleSaveSettings">
      <div class="settings-grid">
        <!-- Turso Edge Database Online Status Card -->
        <div class="settings-card highlight-card">
          <div class="card-header-flex">
            <div>
              <h4 class="card-title"><Database :size="16" /> Turso Edge Database Connection</h4>
              <p class="card-subtitle">
                Secrets are configured via Vercel Environment Variables. Check database connection
                health below.
              </p>
            </div>
            <span
              class="status-pill"
              :class="dbStatus === 'online' ? 'status-online' : 'status-offline'"
            >
              <span
                class="status-dot"
                :class="dbStatus === 'online' ? 'bg-success animate-pulse' : 'bg-warning'"
              ></span>
              {{ dbStatus === 'online' ? 'DB Online & Syncing' : 'Local Storage Fallback' }}
            </span>
          </div>

          <div class="db-details-box mt-3">
            <div class="info-row">
              <span class="info-label">Vercel / ENV Config:</span>
              <span
                v-if="isTursoConfigured()"
                class="text-success font-semibold flex items-center gap-1"
              >
                <CheckCircle2 :size="14" /> Secrets Configured
              </span>
              <span v-else class="text-warning font-semibold flex items-center gap-1">
                <AlertCircle :size="14" /> Not Configured in ENV
              </span>
            </div>

            <p v-if="dbMessage" class="db-message-text mt-2">
              {{ dbMessage }}
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="isCheckingDb"
              @click="checkDbStatus(true)"
            >
              <RefreshCw :size="14" :class="{ 'animate-spin': isCheckingDb }" />
              <span>{{ isCheckingDb ? 'Testing Connection...' : 'Check DB Connection' }}</span>
            </button>

            <span class="field-hint text-muted">
              Database URL & Auth token managed via Vercel Dashboard secrets.
            </span>
          </div>
        </div>

        <!-- Admin Dashboard Password Security -->
        <div class="settings-card">
          <h4 class="card-title"><Lock :size="16" /> Admin Dashboard Password</h4>
          <p class="card-subtitle">
            Password required to unlock inventory management & orders log.
          </p>

          <div class="form-group mt-3">
            <label class="input-label">Admin Password *</label>
            <input
              v-model="formData.adminPassword"
              type="text"
              required
              class="input-field"
              placeholder="e.g. viora123"
            />
            <span v-if="formData.adminPassword === 'viora123'" class="field-hint">
              Status: Using Default Password (viora123). Change this for better security.
            </span>
            <span v-else class="field-hint text-success">
              Status: Customized Password saved. Remember your new password for login!
            </span>
          </div>
        </div>

        <!-- Branding & Location -->
        <div class="settings-card">
          <h4 class="card-title"><Store :size="16" /> Store Identity & Location</h4>

          <div class="form-group mt-3">
            <label class="input-label">Store Brand Name *</label>
            <input v-model="formData.storeName" type="text" required class="input-field" />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Tagline</label>
            <input v-model="formData.tagline" type="text" class="input-field" />
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Business Address</label>
            <input v-model="formData.businessAddress" type="text" class="input-field" />
          </div>
        </div>

        <!-- Storefront Hero Banner Copy & Call to Action -->
        <div class="settings-card span-full">
          <h4 class="card-title">
            <Layout :size="16" /> Storefront Hero Banner Content & Headlines
          </h4>
          <p class="card-subtitle">
            Customize main banner copy, highlight text, subtitle, button label, and floating
            featured item cards.
          </p>

          <div class="banner-form-grid mt-3">
            <div class="form-group">
              <label class="input-label">Banner Main Headline</label>
              <input
                v-model="formData.heroTitleMain"
                type="text"
                class="input-field"
                placeholder="Royal Ethnic Couture."
              />
            </div>

            <div class="form-group">
              <label class="input-label">WhatsApp Highlight Text</label>
              <input
                v-model="formData.heroTitleHighlight"
                type="text"
                class="input-field"
                placeholder="Order Instantly on WhatsApp."
              />
            </div>

            <div class="form-group span-full">
              <label class="input-label">Banner Subtitle</label>
              <textarea
                v-model="formData.heroSubtitle"
                rows="2"
                class="input-field textarea-field"
                placeholder="Explore our curated collection of Hyderabadi Zardozi lehengas..."
              ></textarea>
            </div>

            <div class="form-group">
              <label class="input-label">Header Badge / Pill Text</label>
              <input
                v-model="formData.heroPillText"
                type="text"
                class="input-field"
                placeholder="Jubilee Hills, Hyderabad • Personal Styling"
              />
            </div>

            <div class="form-group">
              <label class="input-label">Catalog Button Label</label>
              <input
                v-model="formData.heroButtonText"
                type="text"
                class="input-field"
                placeholder="Explore Boutique Collection"
              />
            </div>
          </div>

          <!-- Floating Featured Cards Customization -->
          <div class="cards-grid mt-4">
            <!-- Floating Card 1 Controls -->
            <div class="card-group-box">
              <h5 class="card-title text-accent">
                <Sparkles :size="14" /> Floating Card 1 (Top Card)
              </h5>
              <div class="form-group mt-2">
                <label class="input-label">Title</label>
                <input v-model="formData.heroCard1Title" type="text" class="input-field" />
              </div>
              <div class="form-group mt-2">
                <label class="input-label">Price (₹)</label>
                <input v-model.number="formData.heroCard1Price" type="number" class="input-field" />
              </div>
              <div class="form-group mt-2">
                <label class="input-label">Badge Label</label>
                <input v-model="formData.heroCard1Badge" type="text" class="input-field" />
              </div>
              <div class="form-group mt-2">
                <label class="input-label">Image URL</label>
                <input v-model="formData.heroCard1Image" type="url" class="input-field" />
              </div>
              <div v-if="formData.heroCard1Image" class="preview-mini mt-2">
                <img :src="formData.heroCard1Image" alt="Card 1 Preview" />
              </div>
            </div>

            <!-- Floating Card 2 Controls -->
            <div class="card-group-box">
              <h5 class="card-title text-accent">
                <Sparkles :size="14" /> Floating Card 2 (Bottom Card)
              </h5>
              <div class="form-group mt-2">
                <label class="input-label">Title</label>
                <input v-model="formData.heroCard2Title" type="text" class="input-field" />
              </div>
              <div class="form-group mt-2">
                <label class="input-label">Price (₹)</label>
                <input v-model.number="formData.heroCard2Price" type="number" class="input-field" />
              </div>
              <div class="form-group mt-2">
                <label class="input-label">Badge Label</label>
                <input v-model="formData.heroCard2Badge" type="text" class="input-field" />
              </div>
              <div class="form-group mt-2">
                <label class="input-label">Image URL</label>
                <input v-model="formData.heroCard2Image" type="url" class="input-field" />
              </div>
              <div v-if="formData.heroCard2Image" class="preview-mini mt-2">
                <img :src="formData.heroCard2Image" alt="Card 2 Preview" />
              </div>
            </div>
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

.highlight-card {
  border-color: rgba(180, 83, 9, 0.35);
  background: rgba(180, 83, 9, 0.05);
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
  background: rgba(5, 150, 105, 0.15);
  color: var(--accent-success);
  border: 1px solid rgba(5, 150, 105, 0.3);
}

.status-offline {
  background: rgba(217, 119, 6, 0.15);
  color: var(--accent-gold);
  border: 1px solid rgba(217, 119, 6, 0.3);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.bg-success {
  background-color: var(--accent-success);
}
.bg-warning {
  background-color: var(--accent-gold);
}

.db-details-box {
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  box-shadow: var(--shadow-input);
  border-radius: var(--radius-md);
  padding: 14px;
  font-size: 0.85rem;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-label {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.db-message-text {
  font-size: 0.8rem;
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

.highlight-checkbox {
  background: rgba(37, 211, 102, 0.1);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(37, 211, 102, 0.3);
}

.opacity-50 {
  opacity: 0.5;
  pointer-events: none;
}

.card-disabled {
  border-color: var(--border-color);
}

.checkbox-label input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: var(--accent-whatsapp);
  cursor: pointer;
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
.mt-4 {
  margin-top: 16px;
}
.flex {
  display: flex;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.gap-1 {
  gap: 4px;
}
.gap-3 {
  gap: 12px;
}
.font-semibold {
  font-weight: 600;
}
.text-success {
  color: var(--accent-success);
}
.text-warning {
  color: var(--accent-gold);
}
.text-muted {
  color: var(--text-muted);
}

.span-full {
  grid-column: 1 / -1;
}

.banner-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card-group-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 16px;
}

.preview-mini {
  width: 100%;
  height: 100px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.preview-mini img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.textarea-field {
  resize: vertical;
  min-height: 60px;
}

.font-bold {
  font-weight: 700;
}

.text-accent {
  color: var(--accent-primary);
}

@media (max-width: 768px) {
  .store-settings-container {
    padding: 14px;
  }
  .card-header-flex {
    flex-direction: column;
    gap: 8px;
  }
  .settings-grid,
  .banner-form-grid {
    grid-template-columns: 1fr;
  }
  .settings-action-bar .btn {
    width: 100%;
    justify-content: center;
    min-height: 46px;
  }
}
</style>
