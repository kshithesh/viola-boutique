<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Product } from './types'
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
import CustomerAuthModal from './components/storefront/CustomerAuthModal.vue'

// Admin Component
import AdminDashboard from './components/admin/AdminDashboard.vue'

const currentView = ref<'store' | 'admin'>('store')
const quickViewProduct = ref<Product | null>(null)
const toastRef = ref<any>(null)
const catalogRef = ref<HTMLElement | null>(null)

function updateViewFromRoute(): void {
  const path = window.location.pathname
  if (path.startsWith('/admin')) {
    currentView.value = 'admin'
  } else {
    currentView.value = 'store'
  }
}

function handleNavigate(view: 'store' | 'admin'): void {
  currentView.value = view
  if (view === 'admin') {
    if (window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin')
    }
  } else {
    if (window.location.pathname !== '/') {
      window.history.pushState(null, '', '/')
    }
  }
}

onMounted(() => {
  updateViewFromRoute()
  window.addEventListener('popstate', updateViewFromRoute)
  // Load Google Identity Services
  if (!document.getElementById('google-gsi-script')) {
    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }
})

onUnmounted(() => {
  window.removeEventListener('popstate', updateViewFromRoute)
})

function showNotification(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
  if (toastRef.value) {
    toastRef.value.addToast(message, type)
  }
}

function scrollToCatalog(): void {
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
    <AppHeader :current-view="currentView" @navigate="handleNavigate" />

    <!-- Main Container -->
    <main class="main-content">
      <!-- CUSTOMER STOREFRONT VIEW -->
      <template v-if="currentView === 'store'">
        <HeroBanner @scroll-to-catalog="scrollToCatalog" />

        <div ref="catalogRef" class="storefront-content-layout">
          <!-- Main Primary Products Column -->
          <div class="storefront-primary-col">
            <CategoryFilter />
            <ProductGrid @open-quick-view="quickViewProduct = $event" @notify="showNotification" />
          </div>

          <!-- Side Lookbook Ensembles Column -->
          <aside class="storefront-sidebar-col">
            <BoutiqueLookbook @notify="showNotification" />
          </aside>
        </div>

        <!-- Slide-out Cart Drawer -->
        <CartDrawer @notify="showNotification" />

        <!-- Customer Auth Modal -->
        <CustomerAuthModal @notify="showNotification" />

        <!-- Product Detail Quick View Modal -->
        <ProductDetailModal
          :product="quickViewProduct"
          @close="quickViewProduct = null"
          @notify="showNotification"
        />
      </template>

      <!-- INVENTORY ADMIN VIEW -->
      <template v-else-if="currentView === 'admin'">
        <AdminDashboard @notify="showNotification" @navigate="handleNavigate" />
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

.storefront-content-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 24px;
  align-items: start;
  margin: 0 16px 40px 16px;
}

.storefront-primary-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.storefront-sidebar-col {
  position: sticky;
  top: 90px;
}

@media (max-width: 1024px) {
  .storefront-content-layout {
    grid-template-columns: 1fr;
    gap: 24px;
    margin: 0 8px 30px 8px;
  }
  .storefront-sidebar-col {
    position: static;
  }
}
</style>
