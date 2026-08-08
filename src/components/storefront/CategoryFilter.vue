<script setup lang="ts">
import { ArrowUpDown, SlidersHorizontal, Search, X } from '@lucide/vue'
import { useCatalogStore } from '../../stores/catalogStore'
import { useSettingsStore } from '../../stores/settingsStore'

const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()
</script>

<template>
  <div class="category-filter-bar glass-panel">
    <!-- Top Row: Search & Minimalist Category Tabs -->
    <div class="filter-top-row">
      <!-- Sleek Search Input -->
      <div class="search-input-box">
        <Search :size="15" class="search-icon" />
        <input
          v-model="catalogStore.searchQuery"
          type="text"
          class="search-input"
          placeholder="Search products..."
        />
        <button
          v-if="catalogStore.searchQuery"
          type="button"
          class="clear-search-btn"
          title="Clear search"
          @click="catalogStore.searchQuery = ''"
        >
          <X :size="13" />
        </button>
      </div>

      <!-- Category Pills Tabs -->
      <div class="category-pills">
        <button
          v-for="cat in catalogStore.categoriesList"
          :key="cat"
          class="category-pill"
          :class="{ active: catalogStore.selectedCategory === cat }"
          @click="catalogStore.selectedCategory = cat"
        >
          <span v-if="catalogStore.selectedCategory === cat" class="pill-dot"></span>
          <span>{{ cat }}</span>
        </button>
      </div>
    </div>

    <!-- Minimal Secondary Filters Row -->
    <div class="secondary-filters">
      <!-- Stock Filter -->
      <div class="filter-group">
        <SlidersHorizontal :size="14" class="filter-icon" />
        <select v-model="catalogStore.selectedStockFilter" class="filter-select">
          <option value="all">Availability: All</option>
          <option value="in-stock">In Stock Only</option>
          <option value="low-stock">Low Stock (≤ 5)</option>
        </select>
      </div>

      <!-- Slim Price Range Slider -->
      <div class="filter-group price-slider-group">
        <div class="price-header">
          <span class="price-title"
            >Under {{ settingsStore.formatPrice(catalogStore.maxPrice) }}</span
          >
        </div>
        <input
          v-model.number="catalogStore.maxPrice"
          type="range"
          min="2000"
          max="80000"
          step="1000"
          class="price-range-input"
        />
      </div>

      <!-- Sorting Options -->
      <div class="filter-group">
        <ArrowUpDown :size="14" class="filter-icon" />
        <select v-model="catalogStore.sortBy" class="filter-select">
          <option value="featured">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="stock-low">Stock: Low to High</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-filter-bar {
  margin: 0 0 18px 0;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-glass);
}

.filter-top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 0 0 220px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  padding: 0 10px;
  transition: border-color 0.2s;
}

.search-input-box:focus-within {
  border-color: var(--accent-primary);
}

.search-icon {
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 6px;
}

.search-input {
  width: 100%;
  padding: 6px 0;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.82rem;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-muted);
}

.clear-search-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 50%;
}

.clear-search-btn:hover {
  color: var(--accent-danger);
}

.category-pills {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  padding-bottom: 4px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.category-pills::-webkit-scrollbar {
  display: none;
}

.category-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-weight: 500;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.category-pill:hover {
  color: var(--text-primary);
  background: rgba(180, 140, 100, 0.08);
}

.category-pill.active {
  background: var(--accent-primary);
  color: #ffffff;
  font-weight: 600;
  border-color: var(--accent-primary);
}

.pill-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #ffffff;
}

.secondary-filters {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid var(--border-color);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  padding: 5px 12px;
  border-radius: var(--radius-sm);
  transition: border-color 0.2s;
}

.filter-group:hover {
  border-color: var(--border-color-hover);
}

.filter-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.filter-select {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 0.8rem;
  font-weight: 500;
  outline: none;
  cursor: pointer;
}

.filter-select option {
  background: var(--bg-surface);
  color: var(--text-primary);
}

.price-slider-group {
  flex: 1;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 4px;
  padding: 4px 10px;
}

.price-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.price-range-input {
  width: 100%;
  accent-color: var(--accent-primary);
  cursor: pointer;
  height: 4px;
}

@media (max-width: 992px) {
  .search-input-box {
    flex: 1 1 100%;
  }
}

@media (max-width: 768px) {
  .category-filter-bar {
    padding: 12px 14px;
  }
  .secondary-filters {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .filter-group {
    width: 100%;
    min-height: 40px;
    justify-content: flex-start;
  }
  .filter-select {
    width: 100%;
    font-size: 0.85rem;
  }
  .price-slider-group {
    max-width: 100%;
  }
}
</style>
