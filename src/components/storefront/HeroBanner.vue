<script setup>
import { MessageSquare, ArrowRight, ShieldCheck, MapPin, Sparkles } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore.js'
import { useCartStore } from '../../stores/cartStore.js'

const emit = defineEmits(['scrollToCatalog'])
const settingsStore = useSettingsStore()
const cartStore = useCartStore()
</script>

<template>
  <div class="hero-banner glass-panel">
    <div class="hero-content">
      <div class="hero-pill">
        <MapPin :size="14" class="sparkle-gold" />
        <span>Jubilee Hills, Hyderabad • Personal Styling</span>
      </div>

      <h1 class="hero-title">
        Royal Ethnic Couture.<br>
        Order Instantly on <span class="wa-highlight">WhatsApp</span>.
      </h1>

      <p class="hero-subtitle">
        Explore our curated collection of Hyderabadi Zardozi lehengas, pure Kanjeevaram silks, and Nizam Kundan & pearl jewelry. 
        Reserve your pieces directly via WhatsApp with our boutique stylists.
      </p>

      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" @click="emit('scrollToCatalog')">
          Explore Boutique Collection <ArrowRight :size="18" />
        </button>

        <button class="btn btn-whatsapp btn-lg" @click="cartStore.toggleCart(true)">
          <MessageSquare :size="18" /> View Bag ({{ cartStore.cartTotalItems }})
        </button>
      </div>

      <!-- Trust Badges -->
      <div class="trust-row">
        <div class="trust-item">
          <ShieldCheck :size="16" />
          <span>100% Handcrafted Originals</span>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <Sparkles :size="16" />
          <span>Custom Fitting via WhatsApp</span>
        </div>
        <div class="trust-divider"></div>
        <div class="trust-item">
          <MapPin :size="16" />
          <span>Worldwide & Hyderabad Delivery</span>
        </div>
      </div>
    </div>

    <!-- Visual Banner Side -->
    <div class="hero-visual">
      <div class="hero-card-stack">
        <div class="floating-card card-1">
          <img src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=600&auto=format&fit=crop" alt="Royal Lehenga" />
          <div class="card-info">
            <span class="card-title">Zardozi Velvet Lehenga</span>
            <span class="card-price">{{ settingsStore.formatPrice(48500) }}</span>
            <span class="stock-badge">Exclusive Couture</span>
          </div>
        </div>
        <div class="floating-card card-2">
          <img src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600&auto=format&fit=crop" alt="Pearl Jewelry" />
          <div class="card-info">
            <span class="card-title">Nizam Kundan & Pearl Set</span>
            <span class="card-price">{{ settingsStore.formatPrice(24900) }}</span>
            <span class="stock-badge low">Only 3 Left</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-banner {
  margin: 0 16px 30px 16px;
  padding: 48px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 40px;
  align-items: center;
  overflow: hidden;
  position: relative;
  background: radial-gradient(circle at 80% 20%, rgba(217, 119, 6, 0.12), transparent 50%),
              radial-gradient(circle at 10% 90%, rgba(37, 211, 102, 0.08), transparent 50%),
              var(--bg-glass);
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
  padding: 6px 14px;
  border-radius: var(--radius-full);
  background: rgba(180, 83, 9, 0.12);
  border: 1px solid rgba(180, 83, 9, 0.25);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent-primary);
  margin-bottom: 20px;
}

.sparkle-gold {
  color: var(--accent-gold);
}

.hero-title {
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 16px;
}

.wa-highlight {
  background: linear-gradient(135deg, var(--accent-whatsapp), #16a34a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.05rem;
  color: var(--text-secondary);
  margin-bottom: 28px;
  max-width: 540px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
  border-radius: var(--radius-md);
}

.trust-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.trust-item {
  display: flex;
  align-items: center;
  gap: 6px;
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
  width: 320px;
  height: 300px;
}

.floating-card {
  position: absolute;
  width: 260px;
  padding: 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.3s;
}

.floating-card img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.card-info {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.card-price {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--accent-primary);
}

.stock-badge {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--accent-success);
}
.stock-badge.low {
  color: var(--accent-gold);
}

.card-1 {
  top: 0;
  left: 0;
  transform: rotate(-4deg);
  z-index: 2;
}

.card-2 {
  bottom: 10px;
  right: 0;
  transform: rotate(6deg);
  z-index: 1;
}

.hero-card-stack:hover .card-1 {
  transform: rotate(-2deg) translateY(-6px);
}
.hero-card-stack:hover .card-2 {
  transform: rotate(4deg) translateY(6px);
}

@media (max-width: 992px) {
  .hero-banner {
    grid-template-columns: 1fr;
    padding: 32px 24px;
  }
  .hero-visual {
    display: none;
  }
  .hero-title {
    font-size: 2rem;
  }
}

@media (max-width: 640px) {
  .hero-banner {
    margin: 0 8px 20px 8px;
    padding: 24px 16px;
    border-radius: var(--radius-md);
  }
  .hero-title {
    font-size: 1.65rem;
  }
  .hero-subtitle {
    font-size: 0.88rem;
    margin-bottom: 20px;
  }
  .hero-actions {
    flex-direction: column;
    width: 100%;
    gap: 10px;
    margin-bottom: 24px;
  }
  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }
  .trust-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .trust-divider {
    display: none;
  }
}
</style>
