<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Package,
  AlertTriangle,
  DollarSign,
  ShoppingBag,
  Plus,
  Settings,
  FileText,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  Tag,
  Sparkles,
  CreditCard,
  Users
} from '@lucide/vue'
import InventoryTable from './InventoryTable.vue'
import CategoryManagement from './CategoryManagement.vue'
import EnsembleManagement from './EnsembleManagement.vue'
import ProductModal from './ProductModal.vue'
import OrdersList from './OrdersList.vue'
import StoreSettings from './StoreSettings.vue'
import PaymentManagement from './PaymentManagement.vue'
import CustomersList from './CustomersList.vue'
import type { Product } from '../../types'
import { useCatalogStore } from '../../stores/catalogStore'
import { useCartStore } from '../../stores/cartStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { safeSessionStorage } from '../../utils/safeStorage'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
  (e: 'navigate', view: 'store' | 'admin'): void
}>()

const catalogStore = useCatalogStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const activeTab = ref<
  'inventory' | 'categories' | 'ensembles' | 'orders' | 'payments' | 'settings' | 'customers'
>('inventory')
const isProductModalOpen = ref<boolean>(false)
const editingProduct = ref<Product | null>(null)

// Admin Authentication State
const isAuthenticated = ref<boolean>(false)
const inputPassword = ref<string>('')
const showPassword = ref<boolean>(false)
const authError = ref<string>('')

onMounted(() => {
  const savedAuth = safeSessionStorage.getItem('viora_admin_auth')
  if (savedAuth === 'true') {
    isAuthenticated.value = true
  }
})

function handleLogin(): void {
  authError.value = ''
  if (!inputPassword.value) {
    authError.value = 'Please enter the admin password.'
    return
  }

  if (inputPassword.value === settingsStore.settings.adminPassword) {
    isAuthenticated.value = true
    safeSessionStorage.setItem('viora_admin_auth', 'true')
    emit('notify', 'Admin access granted. Welcome to Inventory Manager!', 'success')
    inputPassword.value = ''
  } else {
    authError.value =
      settingsStore.settings.adminPassword === 'viora123'
        ? 'Incorrect password. Default password is "viora123".'
        : 'Incorrect admin password. Please try your customized password.'
    emit('notify', 'Invalid admin password.', 'error')
  }
}

function handleLogout(): void {
  isAuthenticated.value = false
  safeSessionStorage.removeItem('viora_admin_auth')
  emit('notify', 'Logged out of Admin Dashboard.', 'info')
}

function openAddModal(): void {
  editingProduct.value = null
  isProductModalOpen.value = true
}

function openEditModal(product: Product): void {
  editingProduct.value = product
  isProductModalOpen.value = true
}

function handleSaveProduct(productData: Partial<Product>): void {
  if (editingProduct.value) {
    catalogStore.updateProduct(editingProduct.value.id, productData)
    emit('notify', `Updated product "${productData.name}"`, 'success')
  } else {
    catalogStore.addProduct(productData)
    emit('notify', `Added new product "${productData.name}" to inventory`, 'success')
  }
  isProductModalOpen.value = false
}

function handleResetDemoData(): void {
  if (confirm('Reset catalog back to initial boutique dataset?')) {
    catalogStore.resetToDefaultCatalog()
    emit('notify', 'Catalog reset to default dataset.', 'info')
  }
}

function handleChildNotify(msg: string, type?: 'success' | 'error' | 'info'): void {
  emit('notify', msg, type)
}
</script>

<template>
  <div class="admin-dashboard">
    <!-- ADMIN LOGIN CARD (Shown when not authenticated) -->
    <div v-if="!isAuthenticated" class="auth-wrapper">
      <div class="auth-card glass-panel animate-fade-in">
        <div class="auth-header">
          <div class="auth-icon-box">
            <Lock :size="28" />
          </div>
          <h2 class="auth-title">Admin Dashboard Login</h2>
          <p class="auth-subtitle">
            Authorized boutique staff only. Enter your password to access inventory and orders.
          </p>
        </div>

        <form class="auth-form" @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="input-label">Admin Password</label>
            <div class="input-password-box">
              <Lock :size="16" class="input-icon" />
              <input
                v-model="inputPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter password..."
                class="input-field pl-icon pr-icon"
                :class="{ 'input-error': authError }"
                autofocus
              />
              <button type="button" class="toggle-pw-btn" @click="showPassword = !showPassword">
                <component :is="showPassword ? EyeOff : Eye" :size="16" />
              </button>
            </div>
            <span v-if="authError" class="error-text">{{ authError }}</span>
            <span v-if="settingsStore.settings.adminPassword === 'viora123'" class="hint-text">
              Default Password: <strong>viora123</strong>
            </span>
            <span v-else class="hint-text text-success"> Customized admin password active. </span>
          </div>

          <button type="submit" class="btn btn-primary auth-submit-btn">
            <ShieldCheck :size="18" /> Unlock Admin Panel
          </button>
        </form>
      </div>
    </div>

    <!-- AUTHENTICATED ADMIN DASHBOARD -->
    <template v-else>
      <!-- Admin Header & Metrics -->
      <div class="admin-header glass-panel">
        <div class="header-top">
          <div>
            <h2 class="admin-title">Inventory & Store Management</h2>
            <p class="admin-subtitle">
              Monitor stock levels, manage boutique items, categories, and review incoming WhatsApp
              orders.
            </p>
          </div>

          <div class="admin-top-actions">
            <button
              class="btn btn-secondary btn-sm"
              title="Reset Catalog Demo Data"
              @click="handleResetDemoData"
            >
              <RotateCcw :size="15" /> Reset Catalog
            </button>
            <button class="btn btn-primary" @click="openAddModal">
              <Plus :size="18" /> Add New Item
            </button>
            <button
              class="btn btn-danger btn-sm"
              title="Log out of Admin Panel"
              @click="handleLogout"
            >
              <LogOut :size="15" /> Log Out
            </button>
          </div>
        </div>

        <!-- Key Metrics Row -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon icon-indigo">
              <Package :size="20" />
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ catalogStore.totalProductsCount }}</span>
              <span class="metric-label">Total Boutique Items</span>
            </div>
          </div>

          <div
            class="metric-card"
            :class="{ 'warning-card': catalogStore.lowStockProducts.length > 0 }"
          >
            <div class="metric-icon icon-amber">
              <AlertTriangle :size="20" />
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ catalogStore.lowStockProducts.length }}</span>
              <span class="metric-label">Low Stock Alerts</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-emerald">
              <DollarSign :size="20" />
            </div>
            <div class="metric-info">
              <span class="metric-value">{{
                settingsStore.formatPrice(catalogStore.totalCatalogValue)
              }}</span>
              <span class="metric-label">Total Inventory Valuation</span>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon icon-cyan">
              <ShoppingBag :size="20" />
            </div>
            <div class="metric-info">
              <span class="metric-value">{{ cartStore.orders.length }}</span>
              <span class="metric-label">Total Orders Logged</span>
            </div>
          </div>

          <div class="metric-card" style="cursor: pointer" @click="activeTab = 'customers'">
            <div class="metric-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6">
              <Users :size="20" />
            </div>
            <div class="metric-info">
              <span class="metric-value" style="color: #8b5cf6">—</span>
              <span class="metric-label">Customer Accounts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Admin Tabs -->
      <div class="admin-nav-tabs">
        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'inventory' }"
          @click="activeTab = 'inventory'"
        >
          <Package :size="16" /> Inventory Items
        </button>

        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'categories' }"
          @click="activeTab = 'categories'"
        >
          <Tag :size="16" /> Category Management
        </button>

        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'ensembles' }"
          @click="activeTab = 'ensembles'"
        >
          <Sparkles :size="16" /> Curated Ensembles
        </button>

        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'orders' }"
          @click="activeTab = 'orders'"
        >
          <FileText :size="16" />
          Order Management
          <span v-if="cartStore.orders.length > 0" class="tab-badge">
            {{ cartStore.orders.length }}
          </span>
        </button>

        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'payments' }"
          @click="activeTab = 'payments'"
        >
          <CreditCard :size="16" /> Payment Settings & Gateways
        </button>

        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          <Settings :size="16" /> Store & Password Settings
        </button>

        <button
          class="admin-tab-btn"
          :class="{ active: activeTab === 'customers' }"
          @click="activeTab = 'customers'"
        >
          <Users :size="16" /> Customer Accounts
        </button>
      </div>

      <!-- Tab View Content -->
      <div class="tab-content">
        <!-- Tab 1: Inventory Table -->
        <InventoryTable
          v-if="activeTab === 'inventory'"
          @edit-product="openEditModal"
          @notify="handleChildNotify"
        />

        <!-- Tab 2: Category Management -->
        <CategoryManagement v-else-if="activeTab === 'categories'" @notify="handleChildNotify" />

        <!-- Tab 3: Curated Ensembles -->
        <EnsembleManagement v-else-if="activeTab === 'ensembles'" @notify="handleChildNotify" />

        <!-- Tab 4: Order Management -->
        <OrdersList v-else-if="activeTab === 'orders'" @notify="handleChildNotify" />

        <!-- Tab 5: Payment Settings & Gateways -->
        <PaymentManagement v-else-if="activeTab === 'payments'" @notify="handleChildNotify" />

        <!-- Tab 6: Store Settings -->
        <StoreSettings v-else-if="activeTab === 'settings'" @notify="handleChildNotify" />

        <!-- Tab 7: Customer Accounts -->
        <CustomersList v-else-if="activeTab === 'customers'" @notify="handleChildNotify" />
      </div>

      <!-- Add / Edit Product Modal -->
      <ProductModal
        v-if="isProductModalOpen"
        :product="editingProduct"
        @close="isProductModalOpen = false"
        @save="handleSaveProduct"
      />
    </template>
  </div>
</template>

<style scoped>
.admin-dashboard {
  margin: 0 16px 40px 16px;
}

/* Authentication Lock Screen */
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 440px;
  padding: 36px 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.auth-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(180, 83, 9, 0.15);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px auto;
  border: 1px solid rgba(180, 83, 9, 0.3);
}

.auth-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.auth-subtitle {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.auth-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-password-box {
  position: relative;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.toggle-pw-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.pl-icon {
  padding-left: 40px;
}

.pr-icon {
  padding-right: 40px;
}

.input-error {
  border-color: var(--accent-danger) !important;
}

.error-text {
  font-size: 0.78rem;
  color: var(--accent-danger);
  margin-top: 4px;
  display: block;
}

.hint-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
  display: block;
}

.auth-submit-btn {
  width: 100%;
  padding: 12px;
  font-size: 1rem;
  margin-top: 8px;
}

/* Authenticated Admin Styles */
.admin-header {
  padding: 28px;
  margin-bottom: 24px;
  border-radius: var(--radius-lg);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.admin-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.admin-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.admin-top-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.metric-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  padding: 18px 20px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 16px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-color-hover);
}

.warning-card {
  border-color: rgba(217, 119, 6, 0.4);
  background: rgba(217, 119, 6, 0.08);
}

.metric-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-indigo {
  background: rgba(180, 83, 9, 0.15);
  color: var(--accent-primary);
}
.icon-amber {
  background: rgba(217, 119, 6, 0.15);
  color: var(--accent-gold);
}
.icon-emerald {
  background: rgba(5, 150, 105, 0.15);
  color: var(--accent-success);
}
.icon-cyan {
  background: rgba(2, 132, 199, 0.15);
  color: var(--accent-info);
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-value {
  font-family: var(--font-heading);
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.metric-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  font-weight: 600;
}

/* Nav Tabs Bar */
.admin-nav-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: var(--bg-surface-elevated);
  padding: 6px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.admin-nav-tabs::-webkit-scrollbar {
  display: none;
}

.admin-tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 0.92rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.admin-tab-btn:hover {
  color: var(--text-primary);
  background: rgba(180, 140, 100, 0.12);
}

.admin-tab-btn.active {
  background: var(--accent-primary);
  color: #ffffff;
  box-shadow: 0 4px 12px var(--accent-primary-glow);
}

.tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

@media (max-width: 768px) {
  .admin-dashboard {
    margin: 0 8px 30px 8px;
  }
  .admin-header {
    padding: 18px;
  }
  .admin-title {
    font-size: 1.4rem;
  }
  .header-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .admin-top-actions {
    width: 100%;
    flex-wrap: wrap;
  }
  .admin-top-actions .btn {
    flex: 1;
    justify-content: center;
    min-height: 42px;
  }
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .metric-card {
    padding: 12px;
    gap: 10px;
    min-width: 0;
  }
  .metric-value {
    font-size: 1.3rem;
  }
  .metric-label {
    font-size: 0.72rem;
  }
  .admin-nav-tabs {
    padding: 4px;
    gap: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .admin-tab-btn {
    padding: 8px 12px;
    font-size: 0.82rem;
  }
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px 18px;
  }
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
