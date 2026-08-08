<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  X,
  ShoppingBag,
  MessageSquare,
  Star,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Scissors
} from '@lucide/vue'
import type { Product } from '../../types'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCartStore } from '../../stores/cartStore'

const props = defineProps<{
  product?: Product | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const settingsStore = useSettingsStore()
const cartStore = useCartStore()

const selectedQuantity = ref<number>(1)
const selectedColor = ref<string>(props.product?.colors?.[0] || 'Default')
const stitchingOption = ref<string>('Custom Fitting via WhatsApp')

const subtotal = computed<number>(() => {
  if (!props.product) return 0
  return props.product.price * selectedQuantity.value
})

function handleAddToCart(): void {
  if (!props.product || props.product.stock <= 0) return
  cartStore.addToCart(
    props.product,
    selectedQuantity.value,
    `${selectedColor.value} | ${stitchingOption.value}`
  )
  emit(
    'notify',
    `Added ${selectedQuantity.value}x "${props.product.name}" (${stitchingOption.value}) to cart!`,
    'success'
  )
  emit('close')
}

function handleDirectWhatsAppBuy(): void {
  if (!props.product || props.product.stock <= 0) return
  cartStore.addToCart(
    props.product,
    selectedQuantity.value,
    `${selectedColor.value} | ${stitchingOption.value}`
  )
  cartStore.toggleCart(true)
  emit('close')
}
</script>

<template>
  <div v-if="product" class="modal-overlay" @click.self="emit('close')">
    <div class="product-modal glass-panel animate-fade-in">
      <button class="close-modal-btn" @click="emit('close')">
        <X :size="20" />
      </button>

      <div class="modal-grid">
        <!-- Product Image Section -->
        <div class="modal-image-col">
          <div class="large-img-wrapper">
            <img :src="product.image" :alt="product.name" />
            <span v-if="product.badge" class="badge badge-featured modal-badge">
              {{ product.badge }}
            </span>
          </div>
        </div>

        <!-- Product Details Section -->
        <div class="modal-details-col">
          <span class="category-pill">{{ product.category }}</span>
          <h2 class="modal-title">{{ product.name }}</h2>

          <div class="modal-meta-row">
            <div v-if="product.rating" class="rating-box">
              <Star :size="15" class="star-icon" />
              <span>{{ product.rating }}</span>
              <span class="reviews-count"
                >({{ product.reviewsCount }} verified boutique reviews)</span
              >
            </div>
            <span class="sku-tag">SKU: {{ product.sku }}</span>
          </div>

          <!-- Price & Stock -->
          <div class="modal-price-row">
            <span class="modal-price">{{ settingsStore.formatPrice(product.price) }}</span>
            <span v-if="product.originalPrice" class="modal-original-price">
              {{ settingsStore.formatPrice(product.originalPrice) }}
            </span>

            <span v-if="product.stock > 5" class="stock-badge-large stock-in">
              <Check :size="14" /> {{ product.stock }} Available
            </span>
            <span v-else-if="product.stock > 0" class="stock-badge-large stock-low">
              ⚠️ Only {{ product.stock }} left!
            </span>
            <span v-else class="stock-badge-large stock-out"> Sold Out </span>
          </div>

          <p class="modal-description">
            {{ product.description }}
          </p>

          <!-- Color Variant Selector -->
          <div v-if="product.colors && product.colors.length > 0" class="variant-section">
            <span class="variant-label">Color / Work Style:</span>
            <div class="color-options">
              <button
                v-for="color in product.colors"
                :key="color"
                class="color-btn"
                :class="{ active: selectedColor === color }"
                @click="selectedColor = color"
              >
                {{ color }}
              </button>
            </div>
          </div>

          <!-- Boutique Stitching & Fitting Options -->
          <div
            v-if="
              product.category.includes('Lehenga') ||
              product.category.includes('Suit') ||
              product.category.includes('Saree') ||
              product.category.includes('Sharara')
            "
            class="stitching-section"
          >
            <span class="variant-label"
              ><Scissors :size="14" /> Boutique Tailoring & Stitching:</span
            >
            <div class="stitching-options">
              <label
                class="stitching-radio"
                :class="{ active: stitchingOption === 'Custom Fitting via WhatsApp' }"
              >
                <input v-model="stitchingOption" type="radio" value="Custom Fitting via WhatsApp" />
                <span>Custom Fitting via WhatsApp Measurements</span>
              </label>

              <label
                class="stitching-radio"
                :class="{ active: stitchingOption === 'Standard Sizing (S / M / L / XL)' }"
              >
                <input
                  v-model="stitchingOption"
                  type="radio"
                  value="Standard Sizing (S / M / L / XL)"
                />
                <span>Standard Ready Size</span>
              </label>

              <label
                class="stitching-radio"
                :class="{ active: stitchingOption === 'Unstitched Fabric Only' }"
              >
                <input v-model="stitchingOption" type="radio" value="Unstitched Fabric Only" />
                <span>Unstitched Fabric</span>
              </label>
            </div>
          </div>

          <!-- Quantity Selector -->
          <div v-if="product.stock > 0" class="quantity-section">
            <span class="variant-label">Quantity:</span>
            <div class="quantity-controls">
              <button
                class="qty-btn"
                :disabled="selectedQuantity <= 1"
                @click="selectedQuantity = Math.max(1, selectedQuantity - 1)"
              >
                <Minus :size="14" />
              </button>
              <span class="qty-number">{{ selectedQuantity }}</span>
              <button
                class="qty-btn"
                :disabled="selectedQuantity >= product.stock"
                @click="selectedQuantity = Math.min(product.stock, selectedQuantity + 1)"
              >
                <Plus :size="14" />
              </button>
            </div>
            <span class="subtotal-text">Subtotal: {{ settingsStore.formatPrice(subtotal) }}</span>
          </div>

          <!-- Action Buttons -->
          <div class="modal-actions">
            <button
              class="btn btn-primary btn-lg flex-1"
              :disabled="product.stock <= 0"
              @click="handleAddToCart"
            >
              <ShoppingBag :size="18" /> Add to Cart
            </button>

            <button
              v-if="settingsStore.settings.enableWhatsApp !== false"
              class="btn btn-whatsapp btn-lg flex-1"
              :disabled="product.stock <= 0"
              @click="handleDirectWhatsAppBuy"
            >
              <MessageSquare :size="18" /> Order via WhatsApp
            </button>
          </div>

          <div class="guarantee-box">
            <ShieldCheck :size="16" class="guarantee-icon" />
            <span
              >Guaranteed handcrafted authentic couture from Jubilee Hills, Hyderabad. Direct
              stylist consultation included.</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-modal {
  position: relative;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 32px;
  border-radius: var(--radius-lg);
  -webkit-overflow-scrolling: touch;
}

.close-modal-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-modal-btn:hover {
  color: var(--text-primary);
  background: rgba(180, 140, 100, 0.15);
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 32px;
}

.large-img-wrapper {
  position: relative;
  width: 100%;
  height: 420px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--bg-surface-elevated);
}

.large-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-badge {
  position: absolute;
  top: 16px;
  left: 16px;
}

.modal-details-col {
  display: flex;
  flex-direction: column;
}

.category-pill {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-primary);
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.modal-title {
  font-size: 1.8rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 10px;
}

.modal-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.rating-box {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 700;
}

.star-icon {
  color: var(--accent-gold);
  fill: var(--accent-gold);
}

.reviews-count {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.sku-tag {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: monospace;
}

.modal-price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-price {
  font-family: var(--font-heading);
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.modal-original-price {
  font-size: 1rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.stock-badge-large {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: var(--radius-full);
}
.stock-badge-large.stock-in {
  background: rgba(5, 150, 105, 0.12);
  color: var(--accent-success);
}
.stock-badge-large.stock-low {
  background: rgba(217, 119, 6, 0.15);
  color: var(--accent-gold);
}
.stock-badge-large.stock-out {
  background: rgba(220, 38, 38, 0.15);
  color: var(--accent-danger);
}

.modal-description {
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 18px;
}

.variant-section,
.stitching-section,
.quantity-section {
  margin-bottom: 18px;
}

.variant-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-btn {
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn.active {
  border-color: var(--accent-primary);
  background: rgba(180, 83, 9, 0.15);
  color: var(--accent-primary);
  font-weight: 700;
}

.stitching-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stitching-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.stitching-radio.active {
  border-color: var(--accent-primary);
  background: rgba(180, 83, 9, 0.12);
  color: var(--accent-primary);
  font-weight: 700;
}

.quantity-controls {
  display: inline-flex;
  align-items: center;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 4px;
  margin-right: 16px;
}

.qty-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.qty-btn:disabled {
  opacity: 0.3;
}

.qty-number {
  width: 36px;
  text-align: center;
  font-weight: 700;
}

.subtotal-text {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.flex-1 {
  flex: 1;
}

.guarantee-box {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: var(--text-muted);
  background: rgba(180, 140, 100, 0.08);
  padding: 10px 14px;
  border-radius: var(--radius-md);
}

.guarantee-icon {
  color: var(--accent-success);
}

@media (max-width: 768px) {
  .product-modal {
    padding: 20px 16px;
    max-height: 94vh;
    border-radius: var(--radius-md);
  }
  .close-modal-btn {
    top: 14px;
    right: 14px;
    width: 32px;
    height: 32px;
  }
  .modal-grid {
    grid-template-columns: 1fr;
    gap: 18px;
  }
  .large-img-wrapper {
    height: 250px;
  }
  .modal-title {
    font-size: 1.35rem;
  }
  .modal-price {
    font-size: 1.4rem;
  }
  .color-btn {
    padding: 8px 14px;
  }
  .stitching-radio {
    padding: 10px 12px;
  }
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  .modal-actions .btn {
    width: 100%;
    min-height: 46px;
  }
}

@media (max-width: 480px) {
  .large-img-wrapper {
    height: 210px;
  }
  .modal-price-row {
    flex-wrap: wrap;
    gap: 8px;
  }
  .quantity-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
