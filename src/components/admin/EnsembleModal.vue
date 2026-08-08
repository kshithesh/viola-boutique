<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Save, Sparkles, Check } from '@lucide/vue'
import type { LookbookEnsemble } from '../../types'
import { useCatalogStore } from '../../stores/catalogStore'
import { useSettingsStore } from '../../stores/settingsStore'

const props = defineProps<{
  ensemble?: LookbookEnsemble | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: Partial<LookbookEnsemble>): void
}>()

const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()

const formData = ref({
  title: '',
  subtitle: '',
  image:
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
  productIds: [] as string[]
})

const sampleImages = [
  {
    name: 'Bridal Zardozi Edit',
    url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Sangeet Gown & Drops',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Silk & Kundan Heritage',
    url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Royal Velvet Reception',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop'
  }
]

onMounted(() => {
  if (props.ensemble) {
    formData.value = {
      title: props.ensemble.title || '',
      subtitle: props.ensemble.subtitle || '',
      image: props.ensemble.image || sampleImages[0].url,
      productIds: [...(props.ensemble.productIds || [])]
    }
  }
})

function toggleProductSelection(productId: string) {
  const index = formData.value.productIds.indexOf(productId)
  if (index === -1) {
    formData.value.productIds.push(productId)
  } else {
    formData.value.productIds.splice(index, 1)
  }
}

function handleSave() {
  if (!formData.value.title.trim()) return
  emit('save', {
    title: formData.value.title.trim(),
    subtitle: formData.value.subtitle.trim(),
    image: formData.value.image.trim(),
    productIds: formData.value.productIds
  })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="form-modal glass-panel animate-fade-in">
      <div class="modal-header">
        <div class="modal-header-title">
          <Sparkles :size="20" class="sparkle-gold" />
          <h3>{{ ensemble ? 'Edit Curated Ensemble' : 'Create New Curated Ensemble' }}</h3>
        </div>
        <button class="close-modal-btn" @click="emit('close')">
          <X :size="20" />
        </button>
      </div>

      <form class="modal-form" @submit.prevent="handleSave">
        <!-- Title & Subtitle -->
        <div class="form-grid">
          <div class="form-group span-2">
            <label class="input-label">Ensemble Title *</label>
            <input
              v-model="formData.title"
              type="text"
              class="input-field"
              placeholder="e.g., The Royal Nizam Bridal Edit"
              required
            />
          </div>

          <div class="form-group span-2">
            <label class="input-label">Subtitle / Description</label>
            <input
              v-model="formData.subtitle"
              type="text"
              class="input-field"
              placeholder="e.g., Signature Zardozi Lehenga paired with Nizam Kundan Choker"
            />
          </div>

          <!-- Cover Image URL -->
          <div class="form-group span-2">
            <label class="input-label">Cover Image URL</label>
            <input
              v-model="formData.image"
              type="url"
              class="input-field"
              placeholder="https://..."
            />
            <div class="preset-images-row">
              <span class="preset-label">Quick Presets:</span>
              <button
                v-for="img in sampleImages"
                :key="img.name"
                type="button"
                class="btn-preset-chip"
                :class="{ active: formData.image === img.url }"
                @click="formData.image = img.url"
              >
                {{ img.name }}
              </button>
            </div>
          </div>

          <!-- Image Preview -->
          <div v-if="formData.image" class="form-group span-2">
            <label class="input-label">Image Preview</label>
            <div class="ensemble-preview-box">
              <img :src="formData.image" alt="Preview" />
            </div>
          </div>

          <!-- Product Picker -->
          <div class="form-group span-2">
            <div class="products-picker-header">
              <label class="input-label mb-0">Select Included Catalog Products</label>
              <span class="selected-count-badge"> {{ formData.productIds.length }} Selected </span>
            </div>

            <div class="products-picker-grid">
              <div
                v-for="prod in catalogStore.products"
                :key="prod.id"
                class="product-picker-card"
                :class="{ selected: formData.productIds.includes(prod.id) }"
                @click="toggleProductSelection(prod.id)"
              >
                <div class="picker-check">
                  <Check v-if="formData.productIds.includes(prod.id)" :size="14" />
                </div>
                <img :src="prod.image" :alt="prod.name" class="picker-thumb" />
                <div class="picker-info">
                  <span class="picker-title">{{ prod.name }}</span>
                  <span class="picker-meta"
                    >{{ prod.sku }} • {{ settingsStore.formatPrice(prod.price) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="!formData.title.trim()">
            <Save :size="16" /> Save Ensemble
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(18, 12, 9, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.form-modal {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 28px;
  border-radius: var(--radius-lg);
  -webkit-overflow-scrolling: touch;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sparkle-gold {
  color: var(--accent-gold);
}

.modal-header h3 {
  font-size: 1.35rem;
  font-weight: 700;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}

.close-modal-btn:hover {
  color: var(--text-primary);
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.span-2 {
  grid-column: span 2;
}

.preset-images-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.btn-preset-chip {
  font-size: 0.72rem;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border-color);
  background: var(--bg-surface-elevated);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.btn-preset-chip:hover,
.btn-preset-chip.active {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: rgba(180, 83, 9, 0.1);
}

.ensemble-preview-box {
  width: 100%;
  height: 160px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.ensemble-preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.products-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.selected-count-badge {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--accent-primary);
  background: rgba(180, 83, 9, 0.12);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.products-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
  padding-right: 4px;
  -webkit-overflow-scrolling: touch;
}

.product-picker-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.product-picker-card:hover {
  border-color: var(--border-color-hover);
}

.product-picker-card.selected {
  border-color: var(--accent-primary);
  background: rgba(180, 83, 9, 0.08);
}

.picker-check {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.product-picker-card.selected .picker-check {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
}

.picker-thumb {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  object-fit: cover;
  flex-shrink: 0;
}

.picker-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.picker-title {
  font-size: 0.84rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-meta {
  font-size: 0.74rem;
  color: var(--text-secondary);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 640px) {
  .form-modal {
    padding: 18px 14px;
  }
  .form-grid {
    grid-template-columns: 1fr;
  }
  .span-2 {
    grid-column: span 1;
  }
  .products-picker-grid {
    grid-template-columns: 1fr;
  }
  .modal-footer {
    flex-direction: column-reverse;
  }
  .modal-footer .btn {
    width: 100%;
    justify-content: center;
    min-height: 42px;
  }
}
</style>
