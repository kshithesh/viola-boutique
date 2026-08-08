<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  FileText,
  MessageSquare,
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  Search,
  Filter
} from '@lucide/vue'
import type { OrderRecord } from '../../stores/cartStore'
import { useCartStore } from '../../stores/cartStore'
import { useSettingsStore } from '../../stores/settingsStore'

const emit = defineEmits<{
  (e: 'notify', message: string, type?: 'success' | 'error' | 'info'): void
}>()

const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const channelFilter = ref<'all' | 'razorpay' | 'whatsapp'>('all')
const statusFilter = ref<string>('all')
const searchQuery = ref<string>('')

const razorpayOrdersCount = computed<number>(() => {
  return cartStore.orders.filter(
    (o) => o.paymentMethod?.toLowerCase().includes('razorpay') || !!o.paymentId
  ).length
})

const whatsappOrdersCount = computed<number>(() => {
  return cartStore.orders.filter(
    (o) => !o.paymentMethod?.toLowerCase().includes('razorpay') && !o.paymentId
  ).length
})

const filteredOrders = computed<OrderRecord[]>(() => {
  return cartStore.orders.filter((o) => {
    // 1. Channel Filter
    if (channelFilter.value === 'razorpay') {
      const isRzp = o.paymentMethod?.toLowerCase().includes('razorpay') || !!o.paymentId
      if (!isRzp) return false
    } else if (channelFilter.value === 'whatsapp') {
      const isRzp = o.paymentMethod?.toLowerCase().includes('razorpay') || !!o.paymentId
      if (isRzp) return false
    }

    // 2. Status Filter
    if (statusFilter.value !== 'all' && o.status !== statusFilter.value) {
      return false
    }

    // 3. Search Query
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.trim().toLowerCase()
      const matchId = o.orderId.toLowerCase().includes(query)
      const matchName = o.customerName.toLowerCase().includes(query)
      const matchPhone = o.customerPhone.toLowerCase().includes(query)
      const matchPaymentId = o.paymentId?.toLowerCase().includes(query) || false
      if (!matchId && !matchName && !matchPhone && !matchPaymentId) {
        return false
      }
    }

    return true
  })
})

function handleStatusChange(orderId: string, newStatus: string): void {
  cartStore.updateOrderStatus(orderId, newStatus)
  emit('notify', `Order #${orderId} status changed to "${newStatus}"`, 'info')
}

function openWhatsAppChatWithCustomer(order: OrderRecord): void {
  const phone = order.customerPhone.replace(/\D/g, '')
  if (!phone) {
    emit('notify', 'Customer phone number is not available.', 'error')
    return
  }
  const text = encodeURIComponent(
    `Hi ${order.customerName}! Re: Your Viora Order #${order.orderId} (${settingsStore.formatPrice(order.totalAmount)}). We are following up regarding your order.`
  )
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}
</script>

<template>
  <div class="orders-list-container glass-panel">
    <!-- Header Controls -->
    <div class="orders-header">
      <div>
        <h3>Order Management & Processing</h3>
        <p class="subtitle">
          Manage customer orders, track Razorpay verified online payments & WhatsApp checkout logs.
        </p>
      </div>

      <!-- Channel Filter Pills -->
      <div class="channel-filter-pills">
        <button
          class="channel-pill"
          :class="{ active: channelFilter === 'all' }"
          @click="channelFilter = 'all'"
        >
          <span>All Orders</span>
          <span class="pill-badge">{{ cartStore.orders.length }}</span>
        </button>

        <button
          class="channel-pill channel-razorpay"
          :class="{ active: channelFilter === 'razorpay' }"
          @click="channelFilter = 'razorpay'"
        >
          <Zap :size="13" />
          <span>Razorpay Orders</span>
          <span class="pill-badge">{{ razorpayOrdersCount }}</span>
        </button>

        <button
          class="channel-pill channel-whatsapp"
          :class="{ active: channelFilter === 'whatsapp' }"
          @click="channelFilter = 'whatsapp'"
        >
          <MessageSquare :size="13" />
          <span>WhatsApp Orders</span>
          <span class="pill-badge">{{ whatsappOrdersCount }}</span>
        </button>
      </div>
    </div>

    <!-- Secondary Search & Status Filter Bar -->
    <div class="orders-toolbar">
      <div class="search-box">
        <Search :size="16" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Order ID, Customer, Phone, or Payment ID..."
          class="search-input"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
      </div>

      <div class="orders-filter-group">
        <Filter :size="15" class="filter-icon" />
        <select v-model="statusFilter" class="table-select">
          <option value="all">All Order Statuses</option>
          <option value="Paid via Razorpay">Paid via Razorpay</option>
          <option value="Pending Contact">Pending Contact</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Orders Cards List -->
    <div v-if="filteredOrders.length > 0" class="orders-stack">
      <div v-for="order in filteredOrders" :key="order.orderId" class="order-card">
        <div class="order-card-header">
          <div class="order-ref-box">
            <span class="order-id-tag">#{{ order.orderId }}</span>
            <span
              v-if="order.paymentMethod?.toLowerCase().includes('razorpay') || order.paymentId"
              class="payment-type-badge badge-razorpay"
            >
              <Zap :size="12" /> Razorpay Paid
            </span>
            <span v-else class="payment-type-badge badge-whatsapp">
              <MessageSquare :size="12" /> WhatsApp / COD
            </span>
            <span class="order-time">
              <Clock :size="13" /> {{ new Date(order.timestamp).toLocaleString() }}
            </span>
          </div>

          <div class="order-status-box">
            <span class="status-label">Status:</span>
            <select
              :value="order.status"
              class="status-select"
              :class="`status-${order.status.toLowerCase().replace(/\s+/g, '-')}`"
              @change="
                handleStatusChange(order.orderId, ($event.target as HTMLSelectElement).value)
              "
            >
              <option value="Paid via Razorpay">Paid via Razorpay</option>
              <option value="Pending Contact">Pending Contact</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div class="order-card-body">
          <!-- Customer Details -->
          <div class="customer-info-block">
            <div class="info-row">
              <User :size="15" class="info-icon" />
              <span><strong>Customer:</strong> {{ order.customerName }}</span>
            </div>
            <div class="info-row">
              <Phone :size="15" class="info-icon" />
              <span><strong>Phone:</strong> {{ order.customerPhone }}</span>
            </div>
            <div class="info-row">
              <MapPin :size="15" class="info-icon" />
              <span><strong>Address:</strong> {{ order.address }}</span>
            </div>
            <div class="info-row">
              <Sparkles :size="15" class="info-icon" />
              <span><strong>Payment Method:</strong> {{ order.paymentMethod }}</span>
            </div>
            <div v-if="order.paymentId" class="info-row">
              <CheckCircle2 :size="15" class="info-icon text-success" />
              <span
                ><strong>Razorpay Payment ID:</strong> <code>{{ order.paymentId }}</code></span
              >
            </div>
          </div>

          <!-- Items Ordered Breakdown -->
          <div class="order-items-block">
            <h5 class="items-heading">Purchased Items ({{ order.items.length }})</h5>
            <div class="order-items-mini-list">
              <div v-for="(item, idx) in order.items" :key="idx" class="mini-item-row">
                <img :src="item.product.image" :alt="item.product.name" class="mini-item-thumb" />
                <div class="mini-item-desc">
                  <span class="mini-item-title"
                    >{{ item.product.name }} (x{{ item.quantity }})</span
                  >
                  <span class="mini-item-meta">Color: {{ item.selectedColor }}</span>
                </div>
                <span class="mini-item-price">
                  {{ settingsStore.formatPrice(item.product.price * item.quantity) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="order-card-footer">
          <div class="order-total-block">
            <span>Total Payable:</span>
            <span class="grand-total-val">{{ settingsStore.formatPrice(order.totalAmount) }}</span>
          </div>

          <button
            v-if="order.customerPhone && order.customerPhone !== 'N/A'"
            class="btn btn-whatsapp btn-sm"
            @click="openWhatsAppChatWithCustomer(order)"
          >
            <MessageSquare :size="15" /> Contact Customer
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Orders View -->
    <div v-else class="empty-orders-view">
      <FileText :size="40" class="empty-icon" />
      <h4>No Orders Found</h4>
      <p v-if="searchQuery || statusFilter !== 'all' || channelFilter !== 'all'">
        No orders match your current filter or search query. Try clearing filters.
      </p>
      <p v-else>
        Orders placed by customers via Razorpay or WhatsApp checkout will appear here automatically.
      </p>
    </div>
  </div>
</template>

<style scoped>
.orders-list-container {
  padding: 24px;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.orders-header h3 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Channel Filter Pills */
.channel-filter-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.channel-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.channel-pill:hover {
  background: rgba(180, 140, 100, 0.12);
  color: var(--text-primary);
}

.channel-pill.active {
  background: var(--accent-primary);
  color: #ffffff;
  border-color: var(--accent-primary);
}

.channel-pill.channel-razorpay.active {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border-color: #0284c7;
}

.channel-pill.channel-whatsapp.active {
  background: linear-gradient(135deg, var(--accent-whatsapp), #16a34a);
  border-color: var(--accent-whatsapp);
}

.pill-badge {
  background: rgba(0, 0, 0, 0.15);
  color: inherit;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

.channel-pill.active .pill-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}

/* Secondary Toolbar */
.orders-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 260px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  background: var(--bg-input);
  border: 1px solid var(--border-input);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.85rem;
  outline: none;
}

.search-input:focus {
  border-color: var(--accent-primary);
}

.clear-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}

.orders-filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-icon {
  color: var(--text-muted);
}

.table-select {
  padding: 8px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.88rem;
  outline: none;
}

/* Payment Type Badge */
.payment-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.badge-razorpay {
  background: rgba(2, 132, 199, 0.15);
  color: var(--accent-info);
  border: 1px solid rgba(2, 132, 199, 0.3);
}

.badge-whatsapp {
  background: rgba(37, 211, 102, 0.15);
  color: var(--accent-whatsapp);
  border: 1px solid rgba(37, 211, 102, 0.3);
}

.orders-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--border-color-hover);
}

.order-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.order-ref-box {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-id-tag {
  font-family: var(--font-heading);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--accent-primary);
}

.order-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.order-status-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.status-select {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  outline: none;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.status-paid-via-razorpay {
  background: rgba(2, 132, 199, 0.18);
  color: var(--accent-info);
  border-color: rgba(2, 132, 199, 0.4);
}
.status-pending-contact {
  background: rgba(245, 158, 11, 0.18);
  color: var(--accent-gold);
  border-color: rgba(245, 158, 11, 0.4);
}
.status-confirmed {
  background: rgba(99, 102, 241, 0.18);
  color: var(--accent-primary);
  border-color: rgba(99, 102, 241, 0.4);
}
.status-shipped {
  background: rgba(6, 182, 212, 0.18);
  color: var(--accent-info);
  border-color: rgba(6, 182, 212, 0.4);
}
.status-delivered {
  background: rgba(16, 185, 129, 0.18);
  color: var(--accent-success);
  border-color: rgba(16, 185, 129, 0.4);
}
.status-cancelled {
  background: rgba(239, 68, 68, 0.18);
  color: var(--accent-danger);
  border-color: rgba(239, 68, 68, 0.4);
}

.order-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.customer-info-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.info-icon {
  color: var(--accent-primary);
}

.items-heading {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.order-items-mini-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mini-item-row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-input);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-input);
  box-shadow: var(--shadow-input);
}

.mini-item-thumb {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.mini-item-desc {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mini-item-title {
  font-size: 0.82rem;
  font-weight: 700;
}

.mini-item-meta {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.mini-item-price {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--accent-primary);
}

.order-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.order-total-block {
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.grand-total-val {
  font-size: 1.2rem;
  color: var(--accent-success);
  font-weight: 800;
}

.empty-orders-view {
  padding: 60px 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  color: var(--text-muted);
  margin-bottom: 12px;
}

.empty-orders-view h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.empty-orders-view p {
  color: var(--text-secondary);
  font-size: 0.88rem;
  max-width: 360px;
}

@media (max-width: 768px) {
  .orders-list-container {
    padding: 14px;
  }
  .order-card {
    padding: 16px;
    gap: 12px;
  }
  .order-card-body {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .order-card-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  .order-status-box {
    width: 100%;
    justify-content: space-between;
  }
  .status-select {
    flex: 1;
  }
  .order-card-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .order-card-footer .btn {
    width: 100%;
    justify-content: center;
    min-height: 42px;
  }
}
</style>
