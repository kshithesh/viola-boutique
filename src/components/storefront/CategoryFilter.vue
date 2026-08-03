<script setup>
import { SlidersHorizontal, ArrowUpDown, Filter } from 'lucide-vue-next'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'

const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()
</script>

<template>
  <div class="category-filter-bar glass-panel">
    <!-- Category Pills -->
    <div class="category-pills">
      <button 
        v-for="cat in catalogStore.categoriesList" 
        :key="cat"
        class="category-pill"
        :class="{ active: catalogStore.selectedCategory === cat }"
        @click="catalogStore.selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <!-- Secondary Filters Row -->
    <div class="secondary-filters">
      <!-- Stock Availability Filter -->
      <div class="filter-group">
        <Filter :size="15" class="filter-icon" />
        <select v-model="catalogStore.selectedStockFilter" class="filter-select">
          <option value="all">All Availability</option>
          <option value="in-stock">In Stock Only</option>
          <option value="low-stock">Low Stock Alert (≤ 5)</option>
        </select>
      </div>

      <!-- Max Price Slider -->
      <div class="filter-group price-slider-group">
        <span class="price-label">Max Price: {{ settingsStore.formatPrice(catalogStore.maxPrice) }}</span>
        <input 
          type="range" 
          v-model.number="catalogStore.maxPrice" 
          min="2000" 
          max="80000" 
          step="1000" 
          class="price-range-input"
        />
      </div>

      <!-- Sorting Dropdown -->
      <div class="filter-group">
        <ArrowUpDown :size="15" class="filter-icon" />
        <select v-model="catalogStore.sortBy" class="filter-select">
          <option value="featured">Sort: Featured First</option>
          <option value="price-asc">Sort: Price Low → High</option>
          <option value="price-desc">Sort: Price High → Low</option>
          <option value="rating">Sort: Highest Rated</option>
          <option value="stock-low">Sort: Stock Count Low → High</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-filter-bar {
  margin: 0 16px 24px 16px;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-pills {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  scrollbar-width: thin;
}

.category-pill {
  padding: 8px 18px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.category-pill:hover {
  border-color: var(--border-color-hover);
  color: var(--text-primary);
}

.category-pill.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 4px 12px var(--accent-primary-glow);
}

.secondary-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: var(--radius-md);
}

.filter-icon {
  color: var(--text-muted);
}

.filter-select {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.85rem;
  outline: none;
  cursor: pointer;
}

.filter-select option {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.price-slider-group {
  flex: 1;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.price-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.price-range-input {
  width: 100%;
  accent-color: var(--accent-primary);
  cursor: pointer;
}

@media (max-width: 768px) {
  .secondary-filters {
    flex-direction: column;
    align-items: stretch;
  }
  .price-slider-group {
    max-width: 100%;
  }
}
</style>
