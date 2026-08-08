<script setup lang="ts">
import { ArrowRight, MapPin, MessageSquare, ShieldCheck, Sparkles } from '@lucide/vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCartStore } from '../../stores/cartStore'

const emit = defineEmits<{
  (e: 'scrollToCatalog'): void
}>()

const settingsStore = useSettingsStore()
const cartStore = useCartStore()
</script>

<template>
  <div class="hero-banner glass-panel">
    <div class="hero-content">
      <div v-if="settingsStore.settings.heroPillText" class="hero-pill">
        <MapPin :size="13" class="sparkle-gold" />
        <span>{{ settingsStore.settings.heroPillText }}</span>
      </div>

      <h1 class="hero-title">
        {{ settingsStore.settings.heroTitleMain || 'Royal Ethnic Couture.' }}<br />
        <span
          :class="
            settingsStore.settings.enableWhatsApp !== false ? 'wa-highlight' : 'gold-highlight'
          "
          >{{
            settingsStore.settings.heroTitleHighlight ||
            (settingsStore.settings.enableWhatsApp !== false
              ? 'Order Instantly on WhatsApp.'
              : 'Order Online Instantly.')
          }}</span
        >
      </h1>

      <p class="hero-subtitle">
        {{
          settingsStore.settings.heroSubtitle ||
          'Explore our curated collection of Hyderabadi Zardozi lehengas, pure Kanjeevaram silks, and Nizam Kundan & pearl jewelry.'
        }}
      </p>

      <div class="hero-actions">
        <button class="btn btn-primary btn-md" @click="emit('scrollToCatalog')">
          {{ settingsStore.settings.heroButtonText || 'Explore Collection' }}
          <ArrowRight :size="16" />
        </button>

        <button class="btn btn-whatsapp btn-md" @click="cartStore.toggleCart(true)">
          <MessageSquare :size="16" /> View Bag ({{ cartStore.cartTotalItems }})
        </button>
      </div>

      <!-- Trust Badges -->
      <div class="trust-row">
        <div class="trust-item">
          <ShieldCheck :size="14" />
          <span>100% Handcrafted</span>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <Sparkles :size="14" />
          <span>Custom Fitting</span>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <MapPin :size="14" />
          <span>Express Delivery</span>
        </div>
      </div>
    </div>

    <!-- Visual Banner Side -->
    <div class="hero-visual">
      <div class="hero-card-stack">
        <div class="floating-card card-1">
          <img
            :src="
              settingsStore.settings.heroCard1Image ||
              'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop'
            "
            :alt="settingsStore.settings.heroCard1Title || 'Lehenga'"
          />
          <div class="card-info">
            <span class="card-title">{{
              settingsStore.settings.heroCard1Title || 'Zardozi Velvet Lehenga'
            }}</span>
            <span class="card-price">{{
              settingsStore.formatPrice(settingsStore.settings.heroCard1Price || 48500)
            }}</span>
            <span class="stock-badge">{{
              settingsStore.settings.heroCard1Badge || 'Exclusive Couture'
            }}</span>
          </div>
        </div>
        <div class="floating-card card-2">
          <img
            :src="
              settingsStore.settings.heroCard2Image ||
              'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop'
            "
            :alt="settingsStore.settings.heroCard2Title || 'Jewelry'"
          />
          <div class="card-info">
            <span class="card-title">{{
              settingsStore.settings.heroCard2Title || 'Nizam Kundan & Pearl Set'
            }}</span>
            <span class="card-price">{{
              settingsStore.formatPrice(settingsStore.settings.heroCard2Price || 24900)
            }}</span>
            <span class="stock-badge low">{{
              settingsStore.settings.heroCard2Badge || 'Only 3 Left'
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-banner {
  margin: 0 16px 20px 16px;
  padding: 24px 32px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 28px;
  align-items: center;
  overflow: hidden;
  position: relative;
  border-radius: var(--radius-lg);
  background:
    radial-gradient(circle at 80% 20%, rgba(217, 119, 6, 0.12), transparent 50%),
    radial-gradient(circle at 10% 90%, rgba(37, 211, 102, 0.08), transparent 50%), var(--bg-glass);
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  background: rgba(180, 83, 9, 0.12);
  border: 1px solid rgba(180, 83, 9, 0.25);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 12px;
}

.sparkle-gold {
  color: var(--accent-gold);
}

.hero-title {
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 10px;
}

.wa-highlight {
  background: linear-gradient(135deg, var(--accent-whatsapp), #16a34a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.gold-highlight {
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 0.92rem;
  color: var(--text-secondary);
  margin-bottom: 18px;
  max-width: 540px;
  line-height: 1.4;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.btn-md {
  padding: 10px 20px;
  font-size: 0.92rem;
  border-radius: var(--radius-md);
}

.trust-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.trust-divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--text-muted);
}

/* Visual Stack */
.hero-visual {
  position: relative;
  display: flex;
  justify-content: center;
}

.hero-card-stack {
  position: relative;
  width: 280px;
  height: 190px;
}

.floating-card {
  position: absolute;
  width: 230px;
  padding: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.3s;
}

.floating-card img {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.2;
}

.card-price {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--accent-primary);
}

.stock-badge {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--accent-success);
}
.stock-badge.low {
  color: var(--accent-gold);
}

.card-1 {
  top: 0;
  left: 0;
  transform: rotate(-3deg);
  z-index: 2;
}

.card-2 {
  bottom: 0px;
  right: 0;
  transform: rotate(4deg);
  z-index: 1;
}

.hero-card-stack:hover .card-1 {
  transform: rotate(-1deg) translateY(-4px);
}
.hero-card-stack:hover .card-2 {
  transform: rotate(2deg) translateY(4px);
}

@media (max-width: 992px) {
  .hero-banner {
    grid-template-columns: 1fr;
    padding: 20px 20px;
  }
  .hero-visual {
    display: none;
  }
  .hero-title {
    font-size: 1.6rem;
  }
}

@media (max-width: 640px) {
  .hero-banner {
    margin: 0 8px 16px 8px;
    padding: 16px 14px;
    border-radius: var(--radius-md);
  }
  .hero-title {
    font-size: 1.4rem;
  }
  .hero-subtitle {
    font-size: 0.84rem;
    margin-bottom: 14px;
  }
  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 8px;
    margin-bottom: 16px;
  }
  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }
  .trust-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .trust-divider {
    display: none;
  }
}
</style>
