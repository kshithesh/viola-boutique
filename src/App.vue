<script setup>
import { ref } from 'vue'
import AppHeader from './components/common/AppHeader.vue'
import AppFooter from './components/common/AppFooter.vue'
import NotificationToast from './components/common/NotificationToast.vue'

// Storefront Components
import HeroBanner from './components/storefront/HeroBanner.vue'
import BoutiqueLookbook from './components/storefront/BoutiqueLookbook.vue'
import CategoryFilter from './components/storefront/CategoryFilter.vue'
import ProductGrid from './components/storefront/ProductGrid.vue'
import ProductDetailModal from './components/storefront/ProductDetailModal.vue'
import CartDrawer from './components/storefront/CartDrawer.vue'

// Admin Component
import AdminDashboard from './components/admin/AdminDashboard.vue'

const currentView = ref('store') // 'store' | 'admin'
const quickViewProduct = ref(null)
const toastRef = ref(null)
const catalogRef = ref(null)

function showNotification(message, type = 'success') {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}

function scrollToCatalog() {
  if (catalogRef.value) {
    catalogRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="app-layout">
    <!-- Notification Toast System -->
    <NotificationToast ref="toastRef" />

    <!-- Application Top Navigation -->
    <AppHeader 
      v-model:currentView="currentView" 
    />

    <!-- Main Container -->
    <main class="main-content">
      <!-- CUSTOMER STOREFRONT VIEW -->
      <template v-if="currentView === 'store'">
        <HeroBanner 
          @scrollToCatalog="scrollToCatalog" 
        />

        <BoutiqueLookbook 
          @notify="showNotification"
        />

        <div ref="catalogRef">
          <CategoryFilter />
        </div>

        <ProductGrid 
          @openQuickView="quickViewProduct = $event"
          @notify="showNotification"
        />

        <!-- Slide-out Cart Drawer -->
        <CartDrawer 
          @notify="showNotification"
        />

        <!-- Product Detail Quick View Modal -->
        <ProductDetailModal 
          :product="quickViewProduct"
          @close="quickViewProduct = null"
          @notify="showNotification"
        />
      </template>

      <!-- INVENTORY ADMIN VIEW -->
      <template v-else-if="currentView === 'admin'">
        <AdminDashboard 
          @notify="showNotification"
        />
      </template>
    </main>

    <!-- Global Footer -->
    <AppFooter />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  max-width: 1360px;
  width: 100%;
  margin: 0 auto;
}
</style>
