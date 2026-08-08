<script setup lang="ts">
import { ShoppingBag, Eye, Star, AlertCircle, Check } from '@lucide/vue'
import type { Product } from '../../types'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCartStore } from '../../stores/cartStore'

const props = defineProps<{
  product: Product
}>()

const emit = defineEmits<{
  (e: 'openQuickView', product: Product): void
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const settingsStore = useSettingsStore()
const cartStore = useCartStore()

function handleAddToCart(): void {
  if (props.product.stock <= 0) return
  cartStore.addToCart(props.product, 1)
  emit('notify', `Added "${props.product.name}" to cart!`, 'success')
}
</script>

<template>
  <div class="product-card glass-panel" :class="{ 'out-of-stock-card': product.stock <= 0 }">
    <!-- Image & Badges Container -->
    <div class="card-image-wrapper" @click="emit('openQuickView', product)">
      <img :src="product.image" :alt="product.name" class="product-img" loading="lazy" />
      <div class="image-overlay">
        <button class="btn btn-secondary btn-sm quick-view-btn">
          <Eye :size="15" /> Quick View
        </button>
      </div>

      <!-- Top Badges -->
      <div class="badge-stack">
        <span v-if="product.badge" class="badge badge-featured">
          {{ product.badge }}
        </span>
        <span v-else-if="product.stock <= 5 && product.stock > 0" class="badge badge-low-stock">
          Only {{ product.stock }} Left
        </span>
        <span v-else-if="product.stock <= 0" class="badge badge-out-of-stock"> Out of Stock </span>
      </div>
    </div>

    <!-- Product Metadata -->
    <div class="card-body">
      <div class="meta-header">
        <span class="category-tag">{{ product.category }}</span>
        <div v-if="product.rating" class="rating-box">
          <Star :size="13" class="star-icon" />
          <span>{{ product.rating }}</span>
          <span class="reviews-count">({{ product.reviewsCount }})</span>
        </div>
      </div>

      <h3 class="product-title" :title="product.name" @click="emit('openQuickView', product)">
        {{ product.name }}
      </h3>

      <p class="product-desc-snippet">
        {{ product.description }}
      </p>

      <!-- Price & Stock Row -->
      <div class="price-stock-row">
        <div class="price-block">
          <span class="current-price">{{ settingsStore.formatPrice(product.price) }}</span>
          <span v-if="product.originalPrice" class="original-price">
            {{ settingsStore.formatPrice(product.originalPrice) }}
          </span>
        </div>

        <div class="stock-indicator">
          <span v-if="product.stock > 5" class="stock-text stock-in">
            <Check :size="12" /> In Stock ({{ product.stock }})
          </span>
          <span v-else-if="product.stock > 0" class="stock-text stock-low">
            <AlertCircle :size="12" /> Only {{ product.stock }} left
          </span>
          <span v-else class="stock-text stock-out"> Sold Out </span>
        </div>
      </div>

      <!-- Action Button -->
      <button
        class="btn add-to-cart-btn"
        :class="product.stock > 0 ? 'btn-primary' : 'btn-secondary disabled'"
        :disabled="product.stock <= 0"
        @click="handleAddToCart"
      >
        <ShoppingBag :size="16" />
        <span>{{ product.stock > 0 ? 'Add to Cart' : 'Out of Stock' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition:
    transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.25s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-color-hover);
}

.out-of-stock-card {
  opacity: 0.75;
}

.card-image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 Aspect Ratio */
  overflow: hidden;
  background: var(--bg-surface-elevated);
  cursor: pointer;
}

.product-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.product-card:hover .product-img {
  transform: scale(1.06);
}

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.card-image-wrapper:hover .image-overlay {
  opacity: 1;
}

.badge-stack {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2;
}

.card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.meta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.category-tag {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--accent-primary);
}

.rating-box {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-primary);
}

.star-icon {
  color: var(--accent-gold);
  fill: var(--accent-gold);
}

.reviews-count {
  color: var(--text-muted);
  font-weight: 400;
}

.product-title {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.product-title:hover {
  color: var(--accent-primary);
}

.product-desc-snippet {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.price-stock-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.price-block {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.current-price {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.original-price {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-decoration: line-through;
}

.stock-indicator {
  font-size: 0.75rem;
}

.stock-text {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
}

.stock-in {
  color: var(--accent-success);
}
.stock-low {
  color: var(--accent-gold);
}
.stock-out {
  color: var(--accent-danger);
}

.add-to-cart-btn {
  width: 100%;
  margin-top: auto;
}

.btn-secondary.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .card-body {
    padding: 10px;
  }
  .badge-stack {
    top: 8px;
    left: 8px;
    gap: 4px;
  }
  .badge {
    font-size: 0.65rem;
    padding: 2px 6px;
  }
  .category-tag {
    font-size: 0.68rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100px;
  }
  .rating-box {
    font-size: 0.72rem;
  }
  .reviews-count {
    display: none;
  }
  .product-title {
    font-size: 0.88rem;
    line-height: 1.2;
    margin-bottom: 4px;
  }
  .product-desc-snippet {
    display: none;
  }
  .current-price {
    font-size: 1.02rem;
  }
  .original-price {
    font-size: 0.72rem;
  }
  .price-stock-row {
    margin-bottom: 10px;
    padding-top: 8px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  .add-to-cart-btn {
    padding: 10px;
    font-size: 0.82rem;
    min-height: 40px;
  }
}
</style>
