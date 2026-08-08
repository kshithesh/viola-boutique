<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Edit2, Trash2, Sparkles, Layers, Package } from '@lucide/vue'
import type { LookbookEnsemble, Product } from '../../types'
import { useEnsembleStore } from '../../stores/ensembleStore'
import { useCatalogStore } from '../../stores/catalogStore'
import { useSettingsStore } from '../../stores/settingsStore'
import EnsembleModal from './EnsembleModal.vue'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const ensembleStore = useEnsembleStore()
const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()

const isModalOpen = ref<boolean>(false)
const editingEnsemble = ref<LookbookEnsemble | null>(null)

function openAddModal() {
  editingEnsemble.value = null
  isModalOpen.value = true
}

function openEditModal(ensemble: LookbookEnsemble) {
  editingEnsemble.value = ensemble
  isModalOpen.value = true
}

function handleSaveEnsemble(data: Partial<LookbookEnsemble>) {
  if (editingEnsemble.value) {
    ensembleStore.updateEnsemble(editingEnsemble.value.id, data)
    emit('notify', `Updated curated ensemble "${data.title}"`, 'success')
  } else {
    ensembleStore.addEnsemble(data)
    emit('notify', `Added new curated ensemble "${data.title}"`, 'success')
  }
  isModalOpen.value = false
}

function handleDeleteEnsemble(ensemble: LookbookEnsemble) {
  if (confirm(`Are you sure you want to delete ensemble "${ensemble.title}"?`)) {
    ensembleStore.deleteEnsemble(ensemble.id)
    emit('notify', `Deleted ensemble "${ensemble.title}"`, 'info')
  }
}

function getLinkedProducts(productIds: string[]): Product[] {
  if (!productIds || !Array.isArray(productIds)) return []
  return catalogStore.products.filter((p) => productIds.includes(p.id))
}
</script>

<template>
  <div class="ensemble-management">
    <div class="table-header-row glass-panel">
      <div>
        <h3 class="header-title">
          <Sparkles :size="20" class="sparkle-gold" />
          Curated Lookbook Ensembles
        </h3>
        <p class="header-subtitle">
          Manage complete styled ensembles shown on the storefront side section. Add items to create
          full bridal edits.
        </p>
      </div>

      <button class="btn btn-primary" @click="openAddModal">
        <Plus :size="16" /> Add New Ensemble
      </button>
    </div>

    <!-- Ensembles Grid -->
    <div v-if="ensembleStore.ensembles.length > 0" class="ensembles-admin-grid">
      <div
        v-for="ensemble in ensembleStore.ensembles"
        :key="ensemble.id"
        class="ensemble-admin-card glass-panel"
      >
        <div class="card-cover-box">
          <img :src="ensemble.image" :alt="ensemble.title" />
          <div class="card-actions-overlay">
            <button
              class="action-btn icon-edit"
              title="Edit Ensemble"
              @click="openEditModal(ensemble)"
            >
              <Edit2 :size="15" />
            </button>
            <button
              class="action-btn icon-delete"
              title="Delete Ensemble"
              @click="handleDeleteEnsemble(ensemble)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <div class="card-body">
          <div class="card-badge">Curated Ensemble</div>
          <h4 class="card-title">{{ ensemble.title }}</h4>
          <p v-if="ensemble.subtitle" class="card-subtitle">{{ ensemble.subtitle }}</p>

          <!-- Linked Products Section -->
          <div class="linked-products-section">
            <span class="linked-label">
              <Package :size="13" />
              Included Catalog Products ({{ ensemble.productIds?.length || 0 }})
            </span>

            <div
              v-if="getLinkedProducts(ensemble.productIds).length > 0"
              class="linked-products-list"
            >
              <div
                v-for="prod in getLinkedProducts(ensemble.productIds)"
                :key="prod.id"
                class="linked-product-chip"
              >
                <img :src="prod.image" :alt="prod.name" />
                <span class="chip-name">{{ prod.name }}</span>
                <span class="chip-price">{{ settingsStore.formatPrice(prod.price) }}</span>
              </div>
            </div>

            <div v-else class="no-linked-products">
              No products linked yet. Edit this ensemble to add catalog items.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state glass-panel">
      <div class="empty-icon">
        <Layers :size="36" />
      </div>
      <h3>No Curated Ensembles</h3>
      <p>Click "Add New Ensemble" above to create your first lookbook collection.</p>
      <button class="btn btn-primary mt-2" @click="openAddModal">
        <Plus :size="16" /> Add Ensemble
      </button>
    </div>

    <!-- Modal Form -->
    <EnsembleModal
      v-if="isModalOpen"
      :ensemble="editingEnsemble"
      @close="isModalOpen = false"
      @save="handleSaveEnsemble"
    />
  </div>
</template>

<style scoped>
.ensemble-management {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.table-header-row {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-title {
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.sparkle-gold {
  color: var(--accent-gold);
}

.header-subtitle {
  font-size: 0.86rem;
  color: var(--text-secondary);
}

.ensembles-admin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}

.ensemble-admin-card {
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.card-cover-box {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--bg-surface-elevated);
}

.card-cover-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-actions-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  transition:
    transform 0.2s,
    background 0.2s;
}

.action-btn:hover {
  transform: scale(1.08);
}

.icon-edit {
  background: var(--bg-surface);
  color: var(--accent-primary);
}

.icon-delete {
  background: rgba(220, 38, 38, 0.9);
  color: #ffffff;
}

.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.card-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-primary);
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.card-subtitle {
  font-size: 0.84rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.linked-products-section {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.linked-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.linked-products-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.linked-product-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
}

.linked-product-chip img {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  object-fit: cover;
}

.chip-name {
  font-size: 0.8rem;
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-price {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.no-linked-products {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-style: italic;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
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
  margin-bottom: 6px;
}

.empty-state p {
  color: var(--text-secondary);
  font-size: 0.88rem;
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

@media (max-width: 768px) {
  .table-header-row {
    padding: 16px;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .table-header-row .btn {
    width: 100%;
    justify-content: center;
    min-height: 42px;
  }
}

@media (max-width: 640px) {
  .ensembles-admin-grid {
    grid-template-columns: 1fr;
  }
  .card-cover-box {
    height: 170px;
  }
}
</style>
