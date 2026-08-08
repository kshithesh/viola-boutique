<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Save } from '@lucide/vue'
import type { Product } from '../../types'
import { CATEGORIES } from '../../data/mockProducts'

const props = defineProps<{
  product?: Product | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: Partial<Product>): void
}>()

const formData = ref({
  name: '',
  sku: '',
  category: 'Bridal & Wedding Lehengas',
  price: 25000,
  originalPrice: null as number | null,
  costPrice: 10000,
  stock: 5,
  badge: '',
  image:
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
  colorsInput: 'Heritage Crimson, Royal Maroon',
  description: '',
  isFeatured: false
})

const sampleImages = [
  {
    name: 'Watch',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Headphones',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Leather Bag',
    url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Sunglasses',
    url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Teapot',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=800&auto=format&fit=crop'
  },
  {
    name: 'Hoodie',
    url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?q=80&w=800&auto=format&fit=crop'
  }
]

onMounted(() => {
  if (props.product) {
    formData.value = {
      name: props.product.name,
      sku: props.product.sku,
      category: props.product.category,
      price: props.product.price,
      originalPrice: props.product.originalPrice || null,
      costPrice: props.product.costPrice || 0,
      stock: props.product.stock,
      badge: props.product.badge || '',
      image: props.product.image || '',
      colorsInput: Array.isArray(props.product.colors)
        ? props.product.colors.join(', ')
        : 'Default',
      description: props.product.description || '',
      isFeatured: !!props.product.isFeatured
    }
  }
})

function handleSave() {
  if (!formData.value.name.trim()) return

  const colors = formData.value.colorsInput
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  emit('save', {
    ...formData.value,
    colors: colors.length > 0 ? colors : ['Default']
  })
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="form-modal glass-panel animate-fade-in">
      <div class="modal-header">
        <h3>{{ product ? 'Edit Product' : 'Add New Inventory Product' }}</h3>
        <button class="close-modal-btn" @click="emit('close')">
          <X :size="18" />
        </button>
      </div>

      <form class="modal-form-body" @submit.prevent="handleSave">
        <div class="form-grid">
          <!-- Left Column -->
          <div class="form-col">
            <div class="form-group">
              <label class="input-label">Product Name *</label>
              <input
                v-model="formData.name"
                type="text"
                required
                class="input-field"
                placeholder="e.g. Italian Leather Belt"
              />
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="input-label">Category</label>
                <select v-model="formData.category" class="input-field">
                  <option v-for="cat in CATEGORIES.slice(1)" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="input-label">SKU Code</label>
                <input
                  v-model="formData.sku"
                  type="text"
                  class="input-field"
                  placeholder="Auto-generated if blank"
                />
              </div>
            </div>

            <div class="form-row-3">
              <div class="form-group">
                <label class="input-label">Selling Price ($) *</label>
                <input
                  v-model.number="formData.price"
                  type="number"
                  step="0.01"
                  required
                  class="input-field"
                />
              </div>

              <div class="form-group">
                <label class="input-label">Original Price ($)</label>
                <input
                  v-model.number="formData.originalPrice"
                  type="number"
                  step="0.01"
                  class="input-field"
                  placeholder="Optional"
                />
              </div>

              <div class="form-group">
                <label class="input-label">Cost Price ($)</label>
                <input
                  v-model.number="formData.costPrice"
                  type="number"
                  step="0.01"
                  class="input-field"
                  placeholder="Cost"
                />
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label class="input-label">Initial Stock Count *</label>
                <input
                  v-model.number="formData.stock"
                  type="number"
                  min="0"
                  required
                  class="input-field"
                />
              </div>

              <div class="form-group">
                <label class="input-label">Badge Overlay</label>
                <input
                  v-model="formData.badge"
                  type="text"
                  class="input-field"
                  placeholder="e.g. New, Best Seller"
                />
              </div>
            </div>

            <div class="form-group">
              <label class="input-label">Color / Style Variants (Comma Separated)</label>
              <input
                v-model="formData.colorsInput"
                type="text"
                class="input-field"
                placeholder="Black, Tan, Olive"
              />
            </div>
          </div>

          <!-- Right Column -->
          <div class="form-col">
            <div class="form-group">
              <label class="input-label">Product Image URL</label>
              <input
                v-model="formData.image"
                type="url"
                class="input-field"
                placeholder="https://..."
              />
            </div>

            <!-- Image Preview & Preset Picker -->
            <div class="image-preview-container">
              <span class="preview-label">Image Preview:</span>
              <div class="preview-box">
                <img :src="formData.image" alt="Preview" class="preview-img" />
              </div>

              <span class="preset-label">Quick Sample Images:</span>
              <div class="presets-row">
                <button
                  v-for="sample in sampleImages"
                  :key="sample.name"
                  type="button"
                  class="preset-btn"
                  @click="formData.image = sample.url"
                >
                  {{ sample.name }}
                </button>
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="input-label">Description</label>
              <textarea
                v-model="formData.description"
                rows="3"
                class="input-field textarea-field"
                placeholder="Describe materials, sizing, features..."
              ></textarea>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="emit('close')">Cancel</button>
          <button type="submit" class="btn btn-primary">
            <Save :size="16" /> {{ product ? 'Save Changes' : 'Create Product' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.form-modal {
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  -webkit-overflow-scrolling: touch;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.form-grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 24px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-row-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}

.textarea-field {
  resize: vertical;
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-surface-elevated);
  padding: 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.preview-label,
.preset-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.preview-box {
  width: 100%;
  height: 140px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  box-shadow: var(--shadow-input);
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.presets-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.preset-btn {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  color: var(--text-secondary);
  cursor: pointer;
  box-shadow: var(--shadow-input);
  transition: all 0.15s ease;
}

.preset-btn:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background: var(--bg-input-focus);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.mt-3 {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .form-modal {
    padding: 18px 14px;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
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

@media (max-width: 540px) {
  .form-row-2,
  .form-row-3 {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
