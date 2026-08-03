<script setup>
import { ref, computed } from 'vue'
import { Search, Plus, Minus, Edit2, Trash2, AlertCircle, CheckCircle, PackageX } from 'lucide-vue-next'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'

const emit = defineEmits(['editProduct', 'notify'])

const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()

const adminSearch = ref('')
const adminCategoryFilter = ref('All Categories')
const adminStockFilter = ref('all') // 'all', 'low-stock', 'out-of-stock'

const tableProducts = computed(() => {
  return catalogStore.products.filter(product => {
    // Search filter
    if (adminSearch.value.trim()) {
      const q = adminSearch.value.toLowerCase()
      const matchName = product.name.toLowerCase().includes(q)
      const matchSku = product.sku.toLowerCase().includes(q)
      if (!matchName && !matchSku) return false
    }

    // Category filter
    if (adminCategoryFilter.value !== 'All Categories' && product.category !== adminCategoryFilter.value) {
      return false
    }

    // Stock status filter
    if (adminStockFilter.value === 'low-stock' && (product.stock > 5 || product.stock <= 0)) return false
    if (adminStockFilter.value === 'out-of-stock' && product.stock > 0) return false

    return true
  })
})

function handleStockChange(product, delta) {
  const newStock = Math.max(0, product.stock + delta)
  catalogStore.updateStock(product.id, newStock)
  emit('notify', `Stock for "${product.name}" updated to ${newStock}`, 'info')
}

function handleDirectStockInput(product, event) {
  const val = parseInt(event.target.value) || 0
  catalogStore.updateStock(product.id, val)
  emit('notify', `Stock for "${product.name}" set to ${val}`, 'info')
}

function handleDeleteProduct(product) {
  if (confirm(`Are you sure you want to delete "${product.name}" from inventory?`)) {
    catalogStore.deleteProduct(product.id)
    emit('notify', `Product "${product.name}" deleted.`, 'error')
  }
}
</script>

<template>
  <div class="inventory-table-container glass-panel">
    <!-- Table Controls Bar -->
    <div class="table-controls-bar">
      <!-- Search Input -->
      <div class="table-search-box">
        <Search :size="16" class="search-icon" />
        <input 
          type="text" 
          v-model="adminSearch" 
          placeholder="Filter SKU or product name..."
          class="table-search-input"
        />
      </div>

      <div class="table-filter-group">
        <!-- Category Filter -->
        <select v-model="adminCategoryFilter" class="table-select">
          <option value="All Categories">All Categories</option>
          <option v-for="cat in catalogStore.categoriesList.slice(1)" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>

        <!-- Stock Status Filter -->
        <select v-model="adminStockFilter" class="table-select">
          <option value="all">All Inventory Status</option>
          <option value="low-stock">⚠️ Low Stock Alerts (≤ 5)</option>
          <option value="out-of-stock">🚫 Out of Stock (0)</option>
        </select>
      </div>
    </div>

    <!-- Data Table -->
    <div class="table-wrapper">
      <table class="inventory-table">
        <thead>
          <tr>
            <th>Product & SKU</th>
            <th>Category</th>
            <th>Price</th>
            <th>Cost</th>
            <th>Stock Count (Live Edit)</th>
            <th>Stock Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in tableProducts" :key="product.id" class="table-row">
            <!-- Product info -->
            <td class="product-cell">
              <img :src="product.image" :alt="product.name" class="table-thumb" />
              <div class="product-info-cell">
                <span class="product-title-text">{{ product.name }}</span>
                <span class="sku-code">{{ product.sku }}</span>
              </div>
            </td>

            <!-- Category -->
            <td>
              <span class="cat-badge">{{ product.category }}</span>
            </td>

            <!-- Price -->
            <td class="price-cell">
              {{ settingsStore.formatPrice(product.price) }}
            </td>

            <!-- Cost -->
            <td class="cost-cell">
              {{ product.costPrice ? settingsStore.formatPrice(product.costPrice) : 'N/A' }}
            </td>

            <!-- Inline Stock Adjuster -->
            <td class="stock-adjust-cell">
              <div class="stock-adjuster">
                <button class="stock-btn" @click="handleStockChange(product, -1)">
                  <Minus :size="12" />
                </button>
                <input 
                  type="number" 
                  :value="product.stock"
                  @change="handleDirectStockInput(product, $event)"
                  min="0"
                  class="stock-number-input"
                />
                <button class="stock-btn" @click="handleStockChange(product, 1)">
                  <Plus :size="12" />
                </button>
              </div>
            </td>

            <!-- Stock Status Pill -->
            <td>
              <span v-if="product.stock > 5" class="badge badge-in-stock">
                <CheckCircle :size="12" /> In Stock
              </span>
              <span v-else-if="product.stock > 0" class="badge badge-low-stock">
                <AlertCircle :size="12" /> Low Stock
              </span>
              <span v-else class="badge badge-out-of-stock">
                <PackageX :size="12" /> Out of Stock
              </span>
            </td>

            <!-- Action Buttons -->
            <td class="text-right action-cell">
              <button 
                class="btn btn-secondary btn-sm action-icon-btn" 
                @click="emit('editProduct', product)"
                title="Edit Product"
              >
                <Edit2 :size="14" />
              </button>

              <button 
                class="btn btn-danger btn-sm action-icon-btn" 
                @click="handleDeleteProduct(product)"
                title="Delete Product"
              >
                <Trash2 :size="14" />
              </button>
            </td>
          </tr>

          <!-- Empty Table State -->
          <tr v-if="tableProducts.length === 0">
            <td colspan="7" class="empty-table-cell">
              No products found matching your inventory filters.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.inventory-table-container {
  padding: 24px;
}

.table-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.table-search-box {
  position: relative;
  flex: 1;
  max-width: 380px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.table-search-input {
  width: 100%;
  padding: 8px 16px 8px 38px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.88rem;
  outline: none;
}

.table-filter-group {
  display: flex;
  gap: 10px;
}

.table-select {
  padding: 8px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
}

.table-wrapper {
  overflow-x: auto;
}

.inventory-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.inventory-table th {
  padding: 12px 16px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

.table-row {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.2s;
}

.table-row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.inventory-table td {
  padding: 12px 16px;
  font-size: 0.9rem;
  vertical-align: middle;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-elevated);
}

.product-info-cell {
  display: flex;
  flex-direction: column;
}

.product-title-text {
  font-weight: 700;
  color: var(--text-primary);
}

.sku-code {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: monospace;
}

.cat-badge {
  font-size: 0.75rem;
  background: var(--bg-surface-elevated);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
}

.price-cell {
  font-weight: 800;
  color: var(--accent-primary);
}

.cost-cell {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.stock-adjuster {
  display: inline-flex;
  align-items: center;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 2px;
}

.stock-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.stock-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.stock-number-input {
  width: 45px;
  text-align: center;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 0.9rem;
  outline: none;
  -moz-appearance: textfield;
}

.stock-number-input::-webkit-outer-spin-button,
.stock-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.text-right {
  text-align: right;
}

.action-cell {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.action-icon-btn {
  padding: 6px 10px;
}

.empty-table-cell {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
  font-size: 0.9rem;
}
</style>
