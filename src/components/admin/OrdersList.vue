<script setup>
import { ref, computed } from 'vue'
import { 
  FileText, 
  MessageSquare, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Truck, 
  PackageCheck, 
  XCircle,
  Sparkles
} from 'lucide-vue-next'
import { useCartStore } from '../../stores/cartStore.js'
import { useSettingsStore } from '../../stores/settingsStore.js'

const emit = defineEmits(['notify'])

const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const statusFilter = ref('all')

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') return cartStore.orders
  return cartStore.orders.filter(o => o.status === statusFilter.value)
})

function handleStatusChange(orderId, newStatus) {
  cartStore.updateOrderStatus(orderId, newStatus)
  emit('notify', `Order #${orderId} status changed to "${newStatus}"`, 'info')
}

function openWhatsAppChatWithCustomer(order) {
  const phone = order.customerPhone.replace(/\D/g, '')
  if (!phone) {
    emit('notify', 'Customer phone number is not available.', 'error')
    return
  }
  const text = encodeURIComponent(`Hi ${order.customerName}! Re: Your Viora Order #${order.orderId} (${settingsStore.formatPrice(order.totalAmount)}). We are following up regarding delivery!`)
  window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
}
</script>

<template>
  <div class="orders-list-container glass-panel">
    <!-- Header Controls -->
    <div class="orders-header">
      <div>
        <h3>Simulated WhatsApp Orders History</h3>
        <p class="subtitle">Review customer checkout payloads, delivery information, and order status workflow.</p>
      </div>

      <div class="orders-filter-group">
        <select v-model="statusFilter" class="table-select">
          <option value="all">All Order Statuses</option>
          <option value="Pending Contact">Pending Contact</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Orders Cards List -->
    <div v-if="filteredOrders.length > 0" class="orders-stack">
      <div 
        v-for="order in filteredOrders" 
        :key="order.orderId"
        class="order-card"
      >
        <div class="order-card-header">
          <div class="order-ref-box">
            <span class="order-id-tag">#{{ order.orderId }}</span>
            <span class="order-time">
              <Clock :size="13" /> {{ new Date(order.timestamp).toLocaleString() }}
            </span>
          </div>

          <div class="order-status-box">
            <span class="status-label">Status:</span>
            <select 
              :value="order.status" 
              @change="handleStatusChange(order.orderId, $event.target.value)"
              class="status-select"
              :class="`status-${order.status.toLowerCase().replace(/\s+/g, '-')}`"
            >
              <option value="Pending Contact">Pending Contact</option>
              <option value="Confirmed">Confirmed</option>
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
              <span><strong>Payment:</strong> {{ order.paymentMethod }}</span>
            </div>
          </div>

          <!-- Items Ordered Breakdown -->
          <div class="order-items-block">
            <h5 class="items-heading">Purchased Items ({{ order.items.length }})</h5>
            <div class="order-items-mini-list">
              <div 
                v-for="(item, idx) in order.items" 
                :key="idx" 
                class="mini-item-row"
              >
                <img :src="item.product.image" :alt="item.product.name" class="mini-item-thumb" />
                <div class="mini-item-desc">
                  <span class="mini-item-title">{{ item.product.name }} (x{{ item.quantity }})</span>
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
            <MessageSquare :size="15" /> Follow Up on WhatsApp
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Orders View -->
    <div v-else class="empty-orders-view">
      <FileText :size="40" class="empty-icon" />
      <h4>No WhatsApp Orders Yet</h4>
      <p>Orders submitted by customers via the WhatsApp cart drawer will appear here automatically.</p>
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

.table-select {
  padding: 8px 14px;
  background: var(--bg-surface-elevated);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 0.88rem;
  outline: none;
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
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  padding: 6px 12px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 700;
  outline: none;
  cursor: pointer;
  border: 1px solid transparent;
}

.status-pending-contact { background: rgba(245, 158, 11, 0.18); color: var(--accent-gold); border-color: rgba(245, 158, 11, 0.4); }
.status-confirmed { background: rgba(99, 102, 241, 0.18); color: var(--accent-primary); border-color: rgba(99, 102, 241, 0.4); }
.status-shipped { background: rgba(6, 182, 212, 0.18); color: var(--accent-info); border-color: rgba(6, 182, 212, 0.4); }
.status-delivered { background: rgba(16, 185, 129, 0.18); color: var(--accent-success); border-color: rgba(16, 185, 129, 0.4); }
.status-cancelled { background: rgba(239, 68, 68, 0.18); color: var(--accent-danger); border-color: rgba(239, 68, 68, 0.4); }

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
  background: var(--bg-dark);
  padding: 6px 10px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
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
  .order-card-body {
    grid-template-columns: 1fr;
  }
}
</style>
