<script setup lang="ts">
import { ref, watch } from 'vue'
import { Save, Layout, Sparkles } from '@lucide/vue'
import type { StoreSettings } from '../../types'
import { useSettingsStore } from '../../stores/settingsStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const settingsStore = useSettingsStore()

const formData = ref<StoreSettings>({ ...settingsStore.settings })

watch(
  () => settingsStore.settings,
  (newSettings) => {
    formData.value = { ...newSettings }
  },
  { deep: true }
)

function handleSaveHero(): void {
  settingsStore.updateSettings(formData.value)
  emit('notify', 'Storefront Hero Banner content saved!', 'success')
}
</script>

<template>
  <div class="hero-settings-container glass-panel">
    <div class="settings-header">
      <h3>
        <Layout :size="20" class="header-icon" />
        Storefront Hero Banner Content
      </h3>
      <p class="subtitle">
        Customize the main banner headline, WhatsApp highlight text, subtitle, button label, and
        floating featured item cards displayed on your storefront homepage.
      </p>
    </div>

    <form class="hero-settings-form" @submit.prevent="handleSaveHero">
      <div class="settings-card">
        <h4 class="card-title"><Sparkles :size="16" /> Main Banner Copy & Call to Action</h4>

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
      </div>

      <!-- Floating Cards Row -->
      <div class="cards-grid mt-4">
        <!-- Floating Card 1 Controls -->
        <div class="settings-card card-group-box">
          <h4 class="card-title text-accent">Floating Card 1 (Top Card)</h4>
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
        <div class="settings-card card-group-box">
          <h4 class="card-title text-accent">Floating Card 2 (Bottom Card)</h4>
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

      <div class="settings-action-bar mt-4">
        <button type="submit" class="btn btn-primary btn-lg">
          <Save :size="18" /> Save Hero Banner Content
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.hero-settings-container {
  padding: 28px;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--accent-primary);
}

.subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.settings-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-primary);
}

.banner-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.card-group-box {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 18px;
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
  min-height: 65px;
}

.span-full {
  grid-column: 1 / -1;
}

.text-accent {
  color: var(--accent-primary);
}

.settings-action-bar {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.mt-2 {
  margin-top: 8px;
}
.mt-3 {
  margin-top: 12px;
}
.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .hero-settings-container {
    padding: 14px;
  }
  .banner-form-grid,
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .settings-action-bar .btn {
    width: 100%;
    justify-content: center;
    min-height: 46px;
  }
}
</style>
