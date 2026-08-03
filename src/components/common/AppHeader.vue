<script setup>
import { ref } from 'vue'
import { 
  ShoppingBag, 
  Search, 
  LayoutDashboard, 
  Store, 
  Sun, 
  Moon, 
  Sparkles,
  MessageSquare,
  Crown
} from 'lucide-vue-next'
import { useCatalogStore } from '../../stores/catalogStore.js'
import { useCartStore } from '../../stores/cartStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'

const props = defineProps({
  currentView: {
    type: String,
    default: 'store' // 'store' | 'admin'
  }
})

const emit = defineEmits(['navigate'])

const catalogStore = useCatalogStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const isDarkMode = ref(false)

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.setAttribute('data-theme', isDarkMode.value ? 'dark' : 'light')
}

function openStylistWhatsApp() {
  const phone = settingsStore.settings.whatsappNumber.replace(/\D/g, '')
  const text = encodeURIComponent(`Namaste! I would like to book a VIP Personal Styling Consultation & Bridal Fitting at ${settingsStore.settings.storeName}.`)
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}
</script>

<template>
  <header class="app-header glass-panel">
    <div class="header-container">
      <!-- Brand Logo -->
      <div class="brand-logo" @click="emit('navigate', 'store')">
        <div class="logo-icon">
          <Crown class="crown-icon" />
        </div>
        <div class="logo-text">
          <span class="brand-name">{{ settingsStore.settings.storeName }}</span>
          <span class="brand-subtitle">Designer Atelier & Styling • Hyderabad</span>
        </div>
      </div>

      <!-- Center Search Bar (Visible in Store View) -->
      <div class="header-search" v-if="currentView === 'store'">
        <Search class="search-icon" :size="18" />
        <input 
          type="text" 
          v-model="catalogStore.searchQuery" 
          placeholder="Search lehengas, sarees, jewelry..." 
          class="search-input"
        />
        <button 
          v-if="catalogStore.searchQuery" 
          @click="catalogStore.searchQuery = ''"
          class="clear-search-btn"
        >
          ✕
        </button>
      </div>

      <!-- Right Actions: Stylist status, Return to Store (if on admin), Theme Toggle, Cart -->
      <div class="header-actions">
        <!-- Return to Storefront (Only when on Admin Page) -->
        <button 
          v-if="currentView === 'admin'"
          class="btn btn-secondary btn-sm"
          @click="emit('navigate', 'store')"
          title="Return to Customer Storefront"
        >
          <Store :size="16" />
          <span class="action-text">Return to Shop</span>
        </button>

        <!-- Live Stylist Status Pill (Store View) -->
        <button 
          v-if="currentView === 'store'"
          class="btn btn-secondary btn-sm stylist-status-btn"
          @click="openStylistWhatsApp"
          title="Chat with Personal Stylist on WhatsApp"
        >
          <span class="online-dot"></span>
          <span class="stylist-text">Stylist Online</span>
        </button>

        <!-- Theme Toggle -->
        <button class="btn btn-secondary btn-icon" @click="toggleTheme" title="Toggle Light/Dark Theme">
          <component :is="isDarkMode ? Sun : Moon" :size="18" />
        </button>

        <!-- Cart Button (Store View) -->
        <button 
          v-if="currentView === 'store'"
          class="btn btn-primary cart-trigger-btn"
          @click="cartStore.toggleCart(true)"
        >
          <ShoppingBag :size="18" />
          <span class="cart-label">Cart</span>
          <span v-if="cartStore.cartTotalItems > 0" class="cart-badge animate-bounce">
            {{ cartStore.cartTotalItems }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 12px;
  z-index: 50;
  margin: 0 16px 24px 16px;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  max-width: 1320px;
  margin: 0 auto;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.logo-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-gold));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px var(--accent-primary-glow);
}

.crown-icon {
  color: #ffffff;
  width: 24px;
  height: 24px;
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 1.6rem;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 0.72rem;
  color: var(--accent-primary);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Search Bar */
.header-search {
  position: relative;
  flex: 1;
  max-width: 440px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 10px 38px 10px 42px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  color: var(--text-primary);
  font-size: 0.9rem;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--accent-primary-glow);
  outline: none;
}

.clear-search-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stylist-status-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  border-color: rgba(5, 150, 105, 0.3);
  background: rgba(5, 150, 105, 0.08);
  color: var(--accent-success);
}

.online-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-success);
  box-shadow: 0 0 8px var(--accent-success);
}

.view-toggle-btn {
  position: relative;
}

.low-stock-dot {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--accent-gold);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.7rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-trigger-btn {
  position: relative;
}

.cart-badge {
  background: var(--accent-whatsapp);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.75rem;
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

@media (max-width: 768px) {
  .app-header {
    margin: 8px 8px 16px 8px;
    padding: 10px 14px;
  }
  .header-container {
    flex-wrap: wrap;
    gap: 10px;
  }
  .brand-name {
    font-size: 1.25rem;
  }
  .brand-subtitle {
    font-size: 0.65rem;
  }
  .logo-icon {
    width: 36px;
    height: 36px;
  }
  .crown-icon {
    width: 18px;
    height: 18px;
  }
  .header-search {
    order: 3;
    max-width: 100%;
    width: 100%;
    margin-top: 4px;
  }
  .stylist-text, .action-text, .cart-label {
    display: none;
  }
}
</style>
