<script setup>
import { MessageSquare, ShieldCheck, Zap, RefreshCw } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore.js'

const settingsStore = useSettingsStore()

function openDirectWhatsApp() {
  const phone = settingsStore.settings.whatsappNumber.replace(/\D/g, '')
  const text = encodeURIComponent(`Hi ${settingsStore.settings.storeName}! I have an inquiry about your products.`)
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}
</script>

<template>
  <footer class="app-footer glass-panel">
    <!-- Value Props Banner -->
    <div class="features-bar">
      <div class="feature-item">
        <div class="feature-icon"><MessageSquare :size="20" /></div>
        <div class="feature-text">
          <h4>WhatsApp Ordering</h4>
          <p>Send order directly to WhatsApp in 1 click</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon"><Zap :size="20" /></div>
        <div class="feature-text">
          <h4>Live Inventory</h4>
          <p>Real-time stock counts & zero delays</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon"><ShieldCheck :size="20" /></div>
        <div class="feature-text">
          <h4>100% Authentic</h4>
          <p>Curated premium quality catalog</p>
        </div>
      </div>
      <div class="feature-item">
        <div class="feature-icon"><RefreshCw :size="20" /></div>
        <div class="feature-text">
          <h4>Easy Returns</h4>
          <p>Hassle-free support via chat</p>
        </div>
      </div>
    </div>

    <!-- Main Footer Content -->
    <div class="footer-body">
      <div class="footer-brand">
        <h3 class="footer-logo">{{ settingsStore.settings.storeName }}</h3>
        <p class="footer-tagline">{{ settingsStore.settings.tagline }}</p>
        <button class="btn btn-whatsapp btn-sm mt-3" @click="openDirectWhatsApp">
          <MessageSquare :size="16" /> Chat on WhatsApp
        </button>
      </div>

      <div class="footer-links">
        <div class="link-group">
          <h5>Storefront</h5>
          <a href="#">New Arrivals</a>
          <a href="#">Featured Products</a>
          <a href="#">Categories</a>
        </div>
        <div class="link-group">
          <h5>Business Info</h5>
          <p class="info-line">📍 {{ settingsStore.settings.businessAddress }}</p>
          <p class="info-line">💬 WhatsApp: +{{ settingsStore.settings.whatsappNumber }}</p>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; {{ new Date().getFullYear() }} {{ settingsStore.settings.storeName }}. Designed for Seamless Vercel Deployment.</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin: 40px 16px 20px 16px;
  padding: 30px 30px 20px 30px;
}

.features-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bg-surface-elevated);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
}

.feature-text h4 {
  font-size: 0.9rem;
  font-weight: 700;
}

.feature-text p {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.footer-body {
  display: flex;
  justify-content: space-between;
  gap: 30px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.footer-logo {
  font-size: 1.4rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.footer-tagline {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 320px;
}

.mt-3 {
  margin-top: 12px;
}

.footer-links {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}

.link-group h5 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.link-group a {
  display: block;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.85rem;
  margin-bottom: 6px;
  transition: color 0.2s;
}

.link-group a:hover {
  color: var(--accent-primary);
}

.info-line {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.footer-bottom {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
