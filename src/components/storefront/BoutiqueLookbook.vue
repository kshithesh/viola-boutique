<script setup lang="ts">
import { Sparkles, ShoppingBag } from '@lucide/vue'
import type { LookbookEnsemble } from '../../types'
import { useCatalogStore } from '../../stores/catalogStore'
import { useCartStore } from '../../stores/cartStore'
import { useEnsembleStore } from '../../stores/ensembleStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const catalogStore = useCatalogStore()
const cartStore = useCartStore()
const ensembleStore = useEnsembleStore()

function addEnsembleToCart(ensemble: LookbookEnsemble): void {
  let addedCount = 0
  if (ensemble.productIds && ensemble.productIds.length > 0) {
    ensemble.productIds.forEach((id) => {
      const product = catalogStore.products.find((p) => p.id === id)
      if (product && product.stock > 0) {
        cartStore.addToCart(product, 1)
        addedCount++
      }
    })
  }

  if (addedCount > 0) {
    emit('notify', `Added "${ensemble.title}" lookbook items to your cart!`, 'success')
  } else if (ensemble.productIds && ensemble.productIds.length > 0) {
    emit('notify', 'Lookbook items are currently out of stock.', 'error')
  } else {
    emit('notify', 'No products currently linked to this ensemble.', 'info')
  }
}
</script>

<template>
  <div class="boutique-lookbook-section glass-panel">
    <div class="lookbook-header">
      <div class="header-badge">
        <Sparkles :size="14" class="sparkle-icon" />
        <span>Curated Lookbook</span>
      </div>
      <h2 class="lookbook-title">Boutique Ensembles</h2>
      <p class="lookbook-subtitle">
        Complete wedding & festive looks styled by our Hyderabadi couturiers.
      </p>
    </div>

    <div v-if="ensembleStore.ensembles.length > 0" class="ensembles-list">
      <div v-for="ensemble in ensembleStore.ensembles" :key="ensemble.id" class="ensemble-card">
        <div class="ensemble-img-box">
          <img :src="ensemble.image" :alt="ensemble.title" />
          <div class="ensemble-overlay">
            <button class="btn btn-primary btn-sm" @click="addEnsembleToCart(ensemble)">
              <ShoppingBag :size="14" /> Shop Ensemble
            </button>
          </div>
        </div>

        <div class="ensemble-info">
          <span class="edit-pill">Curated Ensemble</span>
          <h3 class="ensemble-name">{{ ensemble.title }}</h3>
          <p v-if="ensemble.subtitle" class="ensemble-desc">{{ ensemble.subtitle }}</p>
          <div class="products-count-tag">
            {{ ensemble.productIds?.length || 0 }} Items Included
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-ensembles">
      <p>No curated ensembles available yet.</p>
    </div>
  </div>
</template>

<style scoped>
.boutique-lookbook-section {
  padding: 24px 20px;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lookbook-header {
  text-align: left;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: rgba(180, 83, 9, 0.12);
  color: var(--accent-primary);
  font-size: 0.76rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.sparkle-icon {
  color: var(--accent-gold);
}

.lookbook-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.lookbook-subtitle {
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

.ensembles-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ensemble-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.ensemble-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-md);
}

.ensemble-img-box {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--bg-surface-elevated);
}

.ensemble-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.ensemble-card:hover .ensemble-img-box img {
  transform: scale(1.05);
}

.ensemble-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(20, 15, 12, 0.65) 0%, transparent 60%);
  display: flex;
  align-items: flex-end;
  padding: 12px;
}

.ensemble-info {
  padding: 14px;
  display: flex;
  flex-direction: column;
}

.edit-pill {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-primary);
  letter-spacing: 0.05em;
  margin-bottom: 2px;
}

.ensemble-name {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 4px;
  line-height: 1.3;
}

.ensemble-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.35;
}

.products-count-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent-gold);
  background: rgba(217, 119, 6, 0.1);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  width: fit-content;
}

.empty-ensembles {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  padding: 20px 0;
}
</style>
