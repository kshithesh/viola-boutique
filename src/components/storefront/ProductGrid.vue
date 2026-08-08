<script setup lang="ts">
import { PackageSearch, RefreshCw } from '@lucide/vue'
import ProductCard from './ProductCard.vue'
import type { Product } from '../../types'
import { useCatalogStore } from '../../stores/catalogStore'

const emit = defineEmits<{
  (e: 'openQuickView', product: Product): void
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const catalogStore = useCatalogStore()

function resetFilters(): void {
  catalogStore.searchQuery = ''
  catalogStore.selectedCategory = 'All Products'
  catalogStore.selectedStockFilter = 'all'
  catalogStore.maxPrice = 80000
}
</script>

<template>
  <div class="product-grid-section">
    <!-- Grid Header Info -->
    <div class="grid-header">
      <h2 class="section-title">
        Catalog Products
        <span class="count-pill">{{ catalogStore.filteredProducts.length }} Items</span>
      </h2>
      <p
        v-if="catalogStore.selectedCategory !== 'All Products' || catalogStore.searchQuery"
        class="section-subtitle"
      >
        Showing results for <strong>"{{ catalogStore.selectedCategory }}"</strong>
        <span v-if="catalogStore.searchQuery"> matching "{{ catalogStore.searchQuery }}"</span>
      </p>
    </div>

    <!-- Product Grid -->
    <div v-if="catalogStore.filteredProducts.length > 0" class="products-grid">
      <ProductCard
        v-for="product in catalogStore.filteredProducts"
        :key="product.id"
        :product="product"
        @open-quick-view="emit('openQuickView', $event)"
        @notify="(msg, type) => emit('notify', msg, type)"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state glass-panel animate-fade-in">
      <div class="empty-icon-box">
        <PackageSearch :size="36" />
      </div>
      <h3>No Products Found</h3>
      <p>We couldn't find any items matching your active search or filter criteria.</p>
      <button class="btn btn-secondary mt-3" @click="resetFilters">
        <RefreshCw :size="16" /> Reset Filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.product-grid-section {
  margin: 0 16px 40px 16px;
}

.grid-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 12px;
}

.count-pill {
  font-size: 0.78rem;
  font-weight: 700;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  color: var(--accent-primary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
}

.section-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon-box {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: var(--bg-surface-elevated);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 0.9rem;
  max-width: 400px;
  margin-bottom: 16px;
}

.mt-3 {
  margin-top: 12px;
}

@media (max-width: 640px) {
  .product-grid-section {
    margin: 0 8px 30px 8px;
  }
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .section-title {
    font-size: 1.2rem;
  }
}
</style>
