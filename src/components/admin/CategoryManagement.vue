<script setup lang="ts">
import { ref, computed } from 'vue'
import { Tag, Plus, Edit2, Trash2, Save, X, Package } from '@lucide/vue'
import type { Category } from '../../types'
import { useCatalogStore } from '../../stores/catalogStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const catalogStore = useCatalogStore()

const newCategoryName = ref<string>('')
const newCategoryDesc = ref<string>('')
const editingCategory = ref<{ oldName: string; name: string; description: string } | null>(null)
const isModalOpen = ref<boolean>(false)

const categoriesWithCounts = computed(() => {
  return catalogStore.customCategories.map((cat) => {
    const count = catalogStore.products.filter((p) => p.category === cat.name).length
    return {
      ...cat,
      productCount: count
    }
  })
})

async function handleAddCategory(): Promise<void> {
  if (!newCategoryName.value.trim()) return

  const success = await catalogStore.addCategory({
    name: newCategoryName.value,
    description: newCategoryDesc.value
  })

  if (success) {
    emit('notify', `Category "${newCategoryName.value}" added successfully!`, 'success')
    newCategoryName.value = ''
    newCategoryDesc.value = ''
  } else {
    emit('notify', `Category "${newCategoryName.value}" already exists.`, 'error')
  }
}

function openEditCategoryModal(cat: Category): void {
  editingCategory.value = {
    oldName: cat.name,
    name: cat.name,
    description: cat.description || ''
  }
  isModalOpen.value = true
}

function handleSaveEditCategory(): void {
  if (!editingCategory.value || !editingCategory.value.name.trim()) return

  catalogStore.updateCategory(editingCategory.value.oldName, {
    name: editingCategory.value.name,
    description: editingCategory.value.description
  })

  emit('notify', `Updated category "${editingCategory.value.name}"!`, 'success')
  isModalOpen.value = false
  editingCategory.value = null
}

function handleDeleteCategory(categoryName: string): void {
  if (
    confirm(
      `Are you sure you want to delete category "${categoryName}"? Products in this category will be reassigned.`
    )
  ) {
    catalogStore.deleteCategory(categoryName)
    emit('notify', `Category "${categoryName}" deleted.`, 'info')
  }
}
</script>

<template>
  <div class="category-mgmt-container glass-panel">
    <!-- Header & Add Form Bar -->
    <div class="mgmt-header">
      <div>
        <h3>Boutique Category Management</h3>
        <p class="subtitle">
          Organize your store collections, edit category names, and track product distribution.
        </p>
      </div>
    </div>

    <!-- Quick Add Form -->
    <div class="add-cat-card">
      <h4 class="form-title"><Plus :size="16" /> Create New Category</h4>
      <form class="add-cat-form" @submit.prevent="handleAddCategory">
        <div class="form-inputs-row">
          <input
            v-model="newCategoryName"
            type="text"
            placeholder="Category Name (e.g. Designer Dupattas)"
            required
            class="input-field"
          />
          <input
            v-model="newCategoryDesc"
            type="text"
            placeholder="Description / Highlight note..."
            class="input-field flex-2"
          />
          <button type="submit" class="btn btn-primary"><Plus :size="16" /> Add Category</button>
        </div>
      </form>
    </div>

    <!-- Categories Grid -->
    <div class="categories-grid">
      <div v-for="cat in categoriesWithCounts" :key="cat.name" class="category-card">
        <div class="cat-card-header">
          <div class="cat-icon-box">
            <Tag :size="18" />
          </div>
          <span class="count-badge"> <Package :size="12" /> {{ cat.productCount }} Items </span>
        </div>

        <div class="cat-card-body">
          <h4 class="cat-name">{{ cat.name }}</h4>
          <p class="cat-desc">{{ cat.description || 'No description provided.' }}</p>
        </div>

        <div class="cat-card-actions">
          <button
            class="btn btn-secondary btn-sm"
            title="Edit Category"
            @click="openEditCategoryModal(cat)"
          >
            <Edit2 :size="14" /> Edit
          </button>

          <button
            class="btn btn-danger btn-sm"
            title="Delete Category"
            @click="handleDeleteCategory(cat.name)"
          >
            <Trash2 :size="14" /> Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Category Modal -->
    <div
      v-if="isModalOpen && editingCategory"
      class="modal-overlay"
      @click.self="isModalOpen = false"
    >
      <div class="edit-modal glass-panel animate-fade-in">
        <div class="modal-header">
          <h3>Edit Category: {{ editingCategory.oldName }}</h3>
          <button class="close-modal-btn" @click="isModalOpen = false">
            <X :size="18" />
          </button>
        </div>

        <form class="edit-form" @submit.prevent="handleSaveEditCategory">
          <div class="form-group">
            <label class="input-label">Category Name *</label>
            <input v-model="editingCategory.name" type="text" required class="input-field" />
            <span class="hint-text"
              >Updating name will automatically update all assigned products.</span
            >
          </div>

          <div class="form-group mt-3">
            <label class="input-label">Description</label>
            <textarea v-model="editingCategory.description" rows="3" class="input-field"></textarea>
          </div>

          <div class="modal-footer mt-4">
            <button type="button" class="btn btn-secondary" @click="isModalOpen = false">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              <Save :size="16" /> Save Category Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-mgmt-container {
  padding: 28px;
}

.mgmt-header {
  margin-bottom: 24px;
}

.mgmt-header h3 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
}

.add-cat-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px;
  margin-bottom: 24px;
}

.form-title {
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}

.form-inputs-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.form-inputs-row .input-field {
  flex: 1;
  min-width: 180px;
}

.flex-2 {
  flex: 2 !important;
  min-width: 240px;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.category-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-color-hover);
}

.cat-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.cat-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(180, 83, 9, 0.12);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.count-badge {
  font-size: 0.75rem;
  font-weight: 700;
  background: rgba(180, 140, 100, 0.15);
  color: var(--text-primary);
  padding: 4px 10px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 4px;
}

.cat-name {
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.cat-desc {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.cat-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

/* Edit Modal */
.edit-modal {
  width: 100%;
  max-width: 520px;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.close-modal-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.mt-3 {
  margin-top: 12px;
}
.mt-4 {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .category-mgmt-container {
    padding: 14px;
  }
  .add-cat-card {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .form-inputs-row {
    flex-direction: column;
    align-items: stretch;
  }
  .form-inputs-row .input-field,
  .flex-2 {
    min-width: 100%;
    width: 100%;
  }
  .form-inputs-row .btn {
    width: 100%;
    min-height: 42px;
  }
  .categories-grid {
    grid-template-columns: 1fr;
  }
  .category-card {
    padding: 16px;
  }
}
</style>
