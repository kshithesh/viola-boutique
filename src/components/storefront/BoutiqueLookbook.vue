<script setup>
import { Sparkles, ShoppingBag, ArrowRight, Heart } from 'lucide-vue-next'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useCartStore } from '../../stores/cartStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'

const emit = defineEmits(['notify'])
const catalogStore = useCatalogStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const lookbookEnsembles = [
  {
    id: 'ensemble-1',
    title: 'The Royal Nizam Bridal Edit',
    subtitle: 'Signature Zardozi Lehenga paired with Nizam Kundan Choker',
    image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=800&auto=format&fit=crop',
    productIds: ['prod-301', 'prod-308']
  },
  {
    id: 'ensemble-2',
    title: 'The Sangeet & Reception Edit',
    subtitle: 'Mirror-work Georgette Gown paired with Chandbali Drops',
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop',
    productIds: ['prod-303', 'prod-306']
  }
]

function addEnsembleToCart(ensemble) {
  let addedCount = 0
  ensemble.productIds.forEach(id => {
    const product = catalogStore.products.find(p => p.id === id)
    if (product && product.stock > 0) {
      cartStore.addToCart(product, 1)
      addedCount++
    }
  })

  if (addedCount > 0) {
    emit('notify', `Added "${ensemble.title}" lookbook items to your cart!`, 'success')
  } else {
    emit('notify', 'Lookbook items are currently out of stock.', 'error')
  }
}
</script>

<template>
  <div class="boutique-lookbook-section glass-panel">
    <div class="lookbook-header">
      <div class="header-badge">
        <Sparkles :size="14" class="sparkle-icon" />
        <span>Curated Lookbook Ensembles</span>
      </div>
      <h2 class="lookbook-title">The Jubilee Hills Bridal Edit</h2>
      <p class="lookbook-subtitle">
        Hand-curated complete wedding looks styled by our lead Hyderabadi couturiers. Add entire ensembles to your cart with one click.
      </p>
    </div>

    <div class="ensembles-grid">
      <div 
        v-for="ensemble in lookbookEnsembles" 
        :key="ensemble.id"
        class="ensemble-card"
      >
        <div class="ensemble-img-box">
          <img :src="ensemble.image" :alt="ensemble.title" />
          <div class="ensemble-overlay">
            <button class="btn btn-whatsapp btn-sm" @click="addEnsembleToCart(ensemble)">
              <ShoppingBag :size="15" /> Shop This Ensemble
            </button>
          </div>
        </div>

        <div class="ensemble-info">
          <span class="edit-pill">Curated Look</span>
          <h3 class="ensemble-name">{{ ensemble.title }}</h3>
          <p class="ensemble-desc">{{ ensemble.subtitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.boutique-lookbook-section {
  margin: 0 16px 36px 16px;
  padding: 32px;
}

.lookbook-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 28px auto;
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: var(--radius-full);
  background: rgba(180, 83, 9, 0.12);
  color: var(--accent-primary);
  font-size: 0.8rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.sparkle-icon {
  color: var(--accent-gold);
}

.lookbook-title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.lookbook-subtitle {
  font-size: 0.92rem;
  color: var(--text-secondary);
}

.ensembles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 24px;
}

.ensemble-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s;
}

.ensemble-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.ensemble-img-box {
  position: relative;
  width: 100%;
  height: 260px;
  overflow: hidden;
  background: var(--bg-surface-elevated);
}

.ensemble-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}

.ensemble-card:hover .ensemble-img-box img {
  transform: scale(1.05);
}

.ensemble-overlay {
  position: absolute;
  inset: 0;
  background: rgba(37, 27, 20, 0.35);
  display: flex;
  align-items: flex-end;
  padding: 16px;
  opacity: 0.9;
}

.ensemble-info {
  padding: 18px;
  display: flex;
  flex-direction: column;
}

.edit-pill {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-primary);
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.ensemble-name {
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.ensemble-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
}
</style>
